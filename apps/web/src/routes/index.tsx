import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { authenticatedRequest, clearAuthSession, getAuthSession } from "../lib/auth";
import { adminTicketFormSchema, equipmentFormSchema, ticketEditFormSchema, userAccountFormSchema, userProfileFormSchema } from "../lib/form-schemas";
import type { AuthSession } from "../lib/auth";
import { sectors } from "../lib/sectors";
import { UserPortal } from "./-user-portal";

type View = "dashboard" | "chamados" | "pessoas" | "equipamentos";
type TicketStatus = "Aberto" | "Em atendimento" | "Aguardando retorno" | "Resolvido";
type Priority = "Baixa" | "Média" | "Alta" | "Crítica";

type User = {
  id: number;
  name: string;
  email: string;
  sector: string;
  phone: string;
};

type ApiUser = {
  id: number;
  nome: string;
  email: string;
  setor: string;
  telefone: string;
};

type ApiEquipment = {
  id: number;
  nome: string;
  patrimonio: string;
  tipo: string;
};

type ApiTicket = {
  id: number;
  titulo: string;
  descricao: string;
  prioridade: string;
  status: string;
  equipamentoId: number;
  usuarioId: number;
  dataAbertura: string;
  dataFechamento: string | null;
};

type Ticket = {
  id: number;
  title: string;
  description: string;
  userId: number;
  equipmentId: number;
  priority: Priority;
  status: TicketStatus;
  openedAt: string;
  updatedAt: string;
};

const statusOptions: TicketStatus[] = ["Aberto", "Em atendimento", "Aguardando retorno", "Resolvido"];
const priorityOptions: Priority[] = ["Baixa", "Média", "Alta", "Crítica"];

const statusClass: Record<TicketStatus, string> = {
  Aberto: "status-open",
  "Em atendimento": "status-progress",
  "Aguardando retorno": "status-waiting",
  Resolvido: "status-done",
};

const priorityClass: Record<Priority, string> = {
  Baixa: "priority-low",
  Média: "priority-medium",
  Alta: "priority-high",
  Crítica: "priority-critical",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function toTicketStatus(status: string): TicketStatus {
  if (status === "Em Andamento" || status === "Em atendimento") {
    return "Em atendimento";
  }
  if (status === "Fechado" || status === "Resolvido") {
    return "Resolvido";
  }
  if (status === "Aguardando retorno") {
    return "Aguardando retorno";
  }
  return "Aberto";
}

function toTicket(apiTicket: ApiTicket): Ticket {
  const openedAt = new Date(apiTicket.dataAbertura).toLocaleString("pt-BR");

  return {
    id: apiTicket.id,
    title: apiTicket.titulo,
    description: apiTicket.descricao,
    userId: apiTicket.usuarioId,
    equipmentId: apiTicket.equipamentoId,
    priority: priorityOptions.includes(apiTicket.prioridade as Priority) ? apiTicket.prioridade as Priority : "Média",
    status: toTicketStatus(apiTicket.status),
    openedAt,
    updatedAt: apiTicket.dataFechamento
      ? new Date(apiTicket.dataFechamento).toLocaleString("pt-BR")
      : openedAt,
  };
}

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (!getAuthSession()) {
      throw redirect({ to: "/login" });
    }
  },
  component: Home,
});

function Home() {
  const session = getAuthSession();

  if (!session) {
    return null;
  }

  return session.account.role === "USER"
    ? <UserPortal session={session} />
    : <ServiceDesk session={session} />;
}

function ServiceDesk({ session }: { session: AuthSession | null }) {
  const authenticatedAccount = session?.account ?? null;
  const [view, setView] = useState<View>("dashboard");
  const [accounts, setAccounts] = useState<User[]>([]);
  const [accountEquipment, setAccountEquipment] = useState<ApiEquipment[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingEquipmentId, setEditingEquipmentId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [deletingEquipmentId, setDeletingEquipmentId] = useState<number | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState(0);
  const [isLoadingTickets, setIsLoadingTickets] = useState(authenticatedAccount?.role === "ADMIN");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | TicketStatus>("Todos");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [savingTicketId, setSavingTicketId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const ticketForm = useForm({
    resolver: zodResolver(adminTicketFormSchema),
    defaultValues: { title: "", description: "", userId: 0, equipmentId: 0, priority: "Média" as Priority },
  });
  const userForm = useForm({
    resolver: zodResolver(userAccountFormSchema),
    defaultValues: { name: "", email: "", sector: "" as typeof sectors[number] | "", phone: "", password: "" },
  });
  const userEditForm = useForm({
    resolver: zodResolver(userProfileFormSchema),
    defaultValues: { name: "", email: "", sector: "" as typeof sectors[number] | "", phone: "" },
  });
  const equipmentForm = useForm({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: { name: "", asset: "", kind: "" as "Computador" | "Impressora" | "Scanner" | "Monitor" | "Celular" | "" },
  });
  const ticketEditForm = useForm({
    resolver: zodResolver(ticketEditFormSchema),
    defaultValues: { title: "", description: "", status: "Aberto" as TicketStatus, priority: "Média" as Priority },
  });
  const isSubmittingTicket = ticketForm.formState.isSubmitting;
  const ticketTitleField = ticketEditForm.register("title");
  const ticketDescriptionField = ticketEditForm.register("description");
  const ticketStatusField = ticketEditForm.register("status");
  const ticketPriorityField = ticketEditForm.register("priority");

  const displayedUsers = authenticatedAccount?.role === "ADMIN" ? accounts : [];
  const displayedEquipment = authenticatedAccount?.role === "ADMIN"
    ? accountEquipment.map((item) => ({ id: item.id, name: item.nome, asset: item.patrimonio, kind: item.tipo, owner: "Sem responsável" }))
    : [];
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0];
  const openTickets = tickets.filter((ticket) => ticket.status !== "Resolvido");
  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return tickets.filter((ticket) => {
      const requester = displayedUsers.find((user) => user.id === ticket.userId)?.name ?? "";
      const relatedEquipment = displayedEquipment.find((item) => item.id === ticket.equipmentId)?.name ?? "";
      const matchesQuery = !normalizedQuery || [ticket.title, requester, relatedEquipment, String(ticket.id)].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
      return matchesQuery && (statusFilter === "Todos" || ticket.status === statusFilter);
    });
  }, [displayedEquipment, displayedUsers, query, statusFilter, tickets]);

  useEffect(() => {
    if (selectedTicket) {
      ticketEditForm.reset({
        title: selectedTicket.title,
        description: selectedTicket.description,
        status: selectedTicket.status,
        priority: selectedTicket.priority,
      });
    }
  }, [selectedTicket?.id, selectedTicket?.title, selectedTicket?.description, selectedTicket?.status, selectedTicket?.priority, ticketEditForm.reset]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  useEffect(() => {
    if (authenticatedAccount?.role !== "ADMIN") {
      return;
    }

    let isCurrent = true;
    authenticatedRequest<ApiUser[]>("/api/usuarios")
      .then((loadedAccounts) => {
        if (isCurrent) {
          setAccounts(loadedAccounts.map((account) => ({
            id: account.id,
            name: account.nome,
            email: account.email,
            sector: account.setor,
            phone: account.telefone,
          })));
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setNotice(error instanceof Error ? error.message : "Não foi possível carregar as contas.");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [authenticatedAccount?.role]);

  useEffect(() => {
    if (authenticatedAccount?.role !== "ADMIN") {
      return;
    }

    let isCurrent = true;
    let hasLoaded = false;
    const loadTickets = () => {
      authenticatedRequest<ApiTicket[]>("/api/chamados")
        .then((loadedTickets) => {
          if (isCurrent) {
            const mappedTickets = loadedTickets.map(toTicket);
            setTickets(mappedTickets);
            setSelectedTicketId((selectedId) => mappedTickets.some((ticket) => ticket.id === selectedId)
              ? selectedId
              : mappedTickets[0]?.id ?? 0);
          }
        })
        .catch((error: unknown) => {
          if (isCurrent) {
            setNotice(error instanceof Error ? error.message : "Não foi possível carregar os chamados.");
          }
        })
        .finally(() => {
          if (isCurrent && !hasLoaded) {
            hasLoaded = true;
            setIsLoadingTickets(false);
          }
        });
    };

    loadTickets();
    const refreshInterval = view === "dashboard"
      ? window.setInterval(loadTickets, 15_000)
      : undefined;

    return () => {
      isCurrent = false;
      if (refreshInterval) {
        window.clearInterval(refreshInterval);
      }
    };
  }, [authenticatedAccount?.role, view]);

  useEffect(() => {
    if (authenticatedAccount?.role !== "ADMIN") {
      return;
    }

    let isCurrent = true;
    authenticatedRequest<ApiEquipment[]>("/api/equipamentos")
      .then((loadedEquipment) => {
        if (isCurrent) {
          setAccountEquipment(loadedEquipment);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setNotice(error instanceof Error ? error.message : "Não foi possível carregar os equipamentos.");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [authenticatedAccount?.role]);

  const persistTicketChanges = async (id: number, changes: Partial<Ticket>) => {
    if (authenticatedAccount?.role !== "ADMIN" || savingTicketId === id) {
      return;
    }

    const previousTicket = tickets.find((ticket) => ticket.id === id);
    if (!previousTicket) {
      return;
    }

    const payload: Record<string, string | number> = {};
    if (changes.title !== undefined) payload.titulo = changes.title;
    if (changes.description !== undefined) payload.descricao = changes.description;
    if (changes.status !== undefined) payload.status = changes.status;
    if (changes.priority !== undefined) payload.prioridade = changes.priority;

    if (Object.keys(payload).length === 0) {
      return;
    }

    setSavingTicketId(id);
    try {
      const savedTicket = await authenticatedRequest<ApiTicket>(`/api/chamados/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setTickets((current) => current.map((ticket) => ticket.id === id
        ? { ...toTicket(savedTicket), updatedAt: "agora" }
        : ticket));
      showNotice(`Chamado #${id} atualizado.`);
    } catch (error) {
      setTickets((current) => current.map((ticket) => ticket.id === id ? previousTicket : ticket));
      showNotice(error instanceof Error ? error.message : "Não foi possível salvar o chamado.");
    } finally {
      setSavingTicketId(null);
    }
  };

  const openTicketComposer = () => {
    ticketForm.reset({
      ...ticketForm.getValues(),
      userId: displayedUsers[0]?.id ?? 0,
      equipmentId: displayedEquipment[0]?.id ?? 0,
    });
    setView("chamados");
    setIsComposerOpen(true);
  };

  const createTicket = ticketForm.handleSubmit(async (ticketDraft) => {
    if (authenticatedAccount?.role === "ADMIN") {
      const requesterExists = displayedUsers.some((user) => user.id === ticketDraft.userId);
      const equipmentExists = displayedEquipment.some((item) => item.id === ticketDraft.equipmentId);

      if (!requesterExists || !equipmentExists) {
        showNotice("Selecione uma pessoa e um equipamento cadastrados.");
        return;
      }

      try {
        const createdTicket = await authenticatedRequest<ApiTicket>("/api/chamados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: ticketDraft.title,
            descricao: ticketDraft.description,
            usuarioId: ticketDraft.userId,
            equipamentoId: ticketDraft.equipmentId,
            prioridade: ticketDraft.priority,
          }),
        });
        const nextTicket = toTicket(createdTicket);
        setTickets((current) => [nextTicket, ...current.filter((ticket) => ticket.id !== nextTicket.id)]);
        setSelectedTicketId(nextTicket.id);
        ticketForm.reset({
          ...ticketDraft,
          title: "",
          description: "",
          priority: "Média",
          userId: displayedUsers[0]?.id ?? 0,
          equipmentId: displayedEquipment[0]?.id ?? 0,
        });
        setIsComposerOpen(false);
        showNotice(`Chamado #${nextTicket.id} criado.`);
      } catch (error) {
        showNotice(error instanceof Error ? error.message : "Não foi possível criar o chamado.");
      }
      return;
    }

    showNotice("Entre como administrador para abrir chamados.");
  });

  const createUser = userForm.handleSubmit(async (userDraft) => {
    if (authenticatedAccount?.role !== "ADMIN") {
      showNotice("Entre como administrador para criar contas.");
      return;
    }

    try {
      const createdUser = await authenticatedRequest<ApiUser> (
        "/api/usuarios",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: userDraft.name,
            email: userDraft.email,
            setor: userDraft.sector,
            telefone: userDraft.phone,
            senha: userDraft.password,
          }),
        },
      );
      const nextUser: User = { id: createdUser.id, name: createdUser.nome, email: createdUser.email, sector: createdUser.setor, phone: createdUser.telefone };
      setAccounts((current) => [nextUser, ...current.filter((user) => user.id !== nextUser.id)]);
      userForm.reset({ name: "", email: "", sector: "", phone: "", password: "" });
      showNotice(`A conta de ${nextUser.name} foi criada. Ela já pode entrar com o e-mail e a senha inicial.`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    }
  });

  const editUser = userEditForm.handleSubmit(async (userDraft) => {
    if (authenticatedAccount?.role !== "ADMIN" || editingUserId === null) {
      return;
    }

    try {
      const savedUser = await authenticatedRequest<ApiUser>(`/api/usuarios/${editingUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: userDraft.name,
          email: userDraft.email,
          setor: userDraft.sector,
          telefone: userDraft.phone,
        }),
      });
      const nextUser: User = { id: savedUser.id, name: savedUser.nome, email: savedUser.email, sector: savedUser.setor, phone: savedUser.telefone };
      setAccounts((current) => current.map((user) => user.id === nextUser.id ? nextUser : user));
      setEditingUserId(null);
      userEditForm.reset({ name: "", email: "", sector: "", phone: "" });
      showNotice(`Os dados de ${nextUser.name} foram atualizados.`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Não foi possível atualizar a pessoa.");
    }
  });

  const cancelUserEdit = () => {
    setEditingUserId(null);
    userEditForm.reset({ name: "", email: "", sector: "", phone: "" });
  };

  const deleteUser = async (user: User) => {
    if (authenticatedAccount?.role !== "ADMIN" || !window.confirm(`Excluir a pessoa ${user.name}?`)) {
      return;
    }

    setDeletingUserId(user.id);
    try {
      await authenticatedRequest<void>(`/api/usuarios/${user.id}`, { method: "DELETE" });
      setAccounts((current) => current.filter((account) => account.id !== user.id));
      if (editingUserId === user.id) cancelUserEdit();
      showNotice(`${user.name} foi excluída.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível excluir a pessoa.";
      showNotice(message.includes("conflita")
        ? "Esta pessoa possui chamados vinculados e não pode ser excluída enquanto eles existirem."
        : message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const saveEquipment = equipmentForm.handleSubmit(async (equipmentDraft) => {
    if (authenticatedAccount?.role === "ADMIN") {
      try {
        const isEditing = editingEquipmentId !== null;
        const savedEquipment = await authenticatedRequest<ApiEquipment>(isEditing ? `/api/equipamentos/${editingEquipmentId}` : "/api/equipamentos", {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: equipmentDraft.name,
            patrimonio: equipmentDraft.asset,
            tipo: equipmentDraft.kind,
          }),
        });
        setAccountEquipment((current) => isEditing
          ? current.map((item) => item.id === savedEquipment.id ? savedEquipment : item)
          : [savedEquipment, ...current]);
        setEditingEquipmentId(null);
        equipmentForm.reset({ name: "", asset: "", kind: "" });
        showNotice(isEditing ? `${savedEquipment.nome} foi atualizado.` : `${savedEquipment.nome} foi cadastrado.`);
      } catch (error) {
        showNotice(error instanceof Error ? error.message : "Não foi possível cadastrar o equipamento.");
      }
      return;
    }

    showNotice("Entre como administrador para cadastrar equipamentos.");
  });

  const cancelEquipmentEdit = () => {
    setEditingEquipmentId(null);
    equipmentForm.reset({ name: "", asset: "", kind: "" });
  };

  const deleteEquipment = async (equipment: ApiEquipment) => {
    if (authenticatedAccount?.role !== "ADMIN" || !window.confirm(`Excluir o equipamento ${equipment.nome}?`)) {
      return;
    }

    setDeletingEquipmentId(equipment.id);
    try {
      await authenticatedRequest<void>(`/api/equipamentos/${equipment.id}`, { method: "DELETE" });
      setAccountEquipment((current) => current.filter((item) => item.id !== equipment.id));
      if (editingEquipmentId === equipment.id) cancelEquipmentEdit();
      showNotice(`${equipment.nome} foi excluído.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível excluir o equipamento.";
      showNotice(message.includes("conflita")
        ? "Este equipamento possui chamados vinculados e não pode ser excluído enquanto eles existirem."
        : message);
    } finally {
      setDeletingEquipmentId(null);
    }
  };

  const ticketRequester = selectedTicket ? displayedUsers.find((user) => user.id === selectedTicket.userId) : undefined;
  const ticketEquipment = selectedTicket ? displayedEquipment.find((item) => item.id === selectedTicket.equipmentId) : undefined;
  const navigation = [["dashboard", "Visão geral"], ["chamados", "Chamados"], ["pessoas", "Pessoas"], ["equipamentos", "Equipamentos"]] as const;

  return (
    <div className="desk-shell">
      <aside className="desk-sidebar" aria-label="Navegação do sistema">
        <div className="sidebar-top">
          <span className="workspace-label">CENTRAL DE SERVIÇOS</span>
          <div className="workspace-name"><span className="workspace-mark" aria-hidden="true">a.</span><span>atende</span></div>
        </div>
        <nav className="desk-nav">
          {navigation.map(([itemView, label]) => <button className={`nav-item ${view === itemView ? "is-active" : ""}`} key={itemView} onClick={() => setView(itemView)} type="button"><span>{label}</span>{itemView === "chamados" && <small>{openTickets.length}</small>}</button>)}
        </nav>
        <div className="sidebar-bottom"><div className="admin-avatar" aria-hidden="true">{authenticatedAccount ? initials(authenticatedAccount.nome) : ""}</div><div><strong>{authenticatedAccount?.nome}</strong><span>Administrador</span></div></div>
      </aside>

      <main className="desk-main">
        <header className="desk-topbar">
          <div><p className="crumb">Central / {navigation.find(([itemView]) => itemView === view)?.[1]}</p><h1>{view === "dashboard" ? `Bom dia, ${authenticatedAccount?.nome.split(" ")[0] ?? "Ruan"}.` : navigation.find(([itemView]) => itemView === view)?.[1]}</h1></div>
          <div className="topbar-actions"><button className="primary-button" onClick={openTicketComposer} type="button"><span aria-hidden="true">+</span> Novo chamado</button><button className="quiet-button" onClick={() => { clearAuthSession(); window.location.assign("/login"); }} type="button">Sair</button></div>
        </header>
        {notice && <div className="toast" role="status">{notice}</div>}

        {view === "dashboard" && <section className="page-enter" aria-labelledby="overview-heading">
          <div className="overview-heading"><div><p className="section-kicker">ACOMPANHAMENTO DE HOJE</p><h2 id="overview-heading">Fila de atendimento</h2></div><p>Resumo dos chamados cadastrados no sistema.</p></div>
          <div className="metrics-grid">
            <article className="metric emphasis"><span>Em aberto</span><strong>{openTickets.length}</strong><small>{tickets.filter((ticket) => ticket.status === "Aberto").length} novos aguardando triagem</small></article>
            <article className="metric"><span>Em atendimento</span><strong>{tickets.filter((ticket) => ticket.status === "Em atendimento").length}</strong><small>atualizados na última hora</small></article>
            <article className="metric"><span>Aguardando retorno</span><strong>{tickets.filter((ticket) => ticket.status === "Aguardando retorno").length}</strong><small>dependem de uma confirmação</small></article>
            <article className="metric"><span>Resolvidos</span><strong>{tickets.filter((ticket) => ticket.status === "Resolvido").length}</strong><small>cadastros no sistema</small></article>
          </div>
          <div className="dashboard-layout">
            <section className="queue-panel" aria-labelledby="queue-heading">
              <div className="panel-heading"><div><p className="section-kicker">PRIORIDADE DE ATENDIMENTO</p><h2 id="queue-heading">Próximos chamados</h2></div><button className="quiet-button" onClick={() => setView("chamados")} type="button">Ver todos</button></div>
              <div className="ticket-list">
                {isLoadingTickets && <p className="empty-state">Carregando chamados...</p>}
                {tickets.filter((ticket) => ticket.status !== "Resolvido").slice(0, 4).map((ticket) => {
                  const requester = displayedUsers.find((user) => user.id === ticket.userId);
                  return <button className={`ticket-row ${selectedTicketId === ticket.id ? "is-selected" : ""}`} key={ticket.id} onClick={() => { setSelectedTicketId(ticket.id); setView("chamados"); }} type="button"><span className={`priority-dot ${priorityClass[ticket.priority]}`} aria-label={`Prioridade ${ticket.priority}`} /><span className="ticket-row-copy"><strong>{ticket.title}</strong><small>#{ticket.id} · {requester?.name}</small></span><span className={`status ${statusClass[ticket.status]}`}>{ticket.status}</span></button>;
                })}
              </div>
            </section>
            <section className="today-panel" aria-labelledby="today-heading"><p className="section-kicker">RITMO DO DIA</p><h2 id="today-heading">Uma fila mais clara.</h2><p>Priorize as solicitações críticas, registre o contexto e mantenha cada pessoa informada.</p><div className="today-note"><span /> Última atualização: agora</div></section>
          </div>
        </section>}

        {view === "chamados" && <section className="page-enter" aria-labelledby="tickets-heading">
          <div className="view-heading"><div><p className="section-kicker">OPERAÇÃO</p><h2 id="tickets-heading">Todos os chamados</h2></div><span>{isLoadingTickets ? "Carregando..." : `${filteredTickets.length} resultados`}</span></div>
          {isLoadingTickets && <p className="empty-state">Carregando chamados...</p>}
          {isComposerOpen && <form className="composer" noValidate onSubmit={createTicket}>
            <div className="composer-heading"><div><p className="section-kicker">NOVO REGISTRO</p><h3>Abrir chamado</h3></div><button className="close-button" onClick={() => setIsComposerOpen(false)} type="button" aria-label="Fechar formulário">×</button></div>
            <div className="form-grid">
              <label className="field field-wide">Título<input {...ticketForm.register("title")} aria-invalid={Boolean(ticketForm.formState.errors.title)} placeholder="Descreva o pedido em uma frase" />{ticketForm.formState.errors.title?.message && <span className="auth-field-error">{ticketForm.formState.errors.title.message}</span>}</label>
              <label className="field">Solicitante<select {...ticketForm.register("userId", { valueAsNumber: true })} aria-invalid={Boolean(ticketForm.formState.errors.userId)}><option value="">Selecione uma pessoa</option>{displayedUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.sector}</option>)}</select>{ticketForm.formState.errors.userId?.message && <span className="auth-field-error">{ticketForm.formState.errors.userId.message}</span>}</label>
              <label className="field">Equipamento<select {...ticketForm.register("equipmentId", { valueAsNumber: true })} aria-invalid={Boolean(ticketForm.formState.errors.equipmentId)}><option value="">Selecione um equipamento</option>{displayedEquipment.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.asset}</option>)}</select>{ticketForm.formState.errors.equipmentId?.message && <span className="auth-field-error">{ticketForm.formState.errors.equipmentId.message}</span>}</label>
              {authenticatedAccount?.role === "ADMIN" && !displayedUsers.length && <p className="field-hint">Cadastre uma pessoa antes de abrir um chamado.</p>}
              {authenticatedAccount?.role === "ADMIN" && !displayedEquipment.length && <p className="field-hint">Cadastre um equipamento antes de abrir um chamado.</p>}
              <label className="field">Prioridade<select {...ticketForm.register("priority")}>{priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
              <label className="field field-wide">Descrição<textarea {...ticketForm.register("description")} aria-invalid={Boolean(ticketForm.formState.errors.description)} placeholder="Inclua o que aconteceu e como isso afeta o trabalho." rows={3} />{ticketForm.formState.errors.description?.message && <span className="auth-field-error">{ticketForm.formState.errors.description.message}</span>}</label>
            </div>
            <div className="form-actions"><button className="quiet-button" onClick={() => setIsComposerOpen(false)} type="button">Cancelar</button><button className="primary-button" disabled={isSubmittingTicket || (authenticatedAccount?.role === "ADMIN" && (!displayedUsers.length || !displayedEquipment.length))} type="submit">{isSubmittingTicket ? "Criando..." : "Criar chamado"}</button></div>
          </form>}
          <div className="filter-bar"><label className="search-field"><span>Buscar</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Título, número, pessoa ou equipamento" /></label><label className="select-field">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "Todos" | TicketStatus)}><option>Todos</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label></div>
          <div className="tickets-workspace">
            <div className="ticket-table" role="list" aria-label="Lista de chamados"><div className="table-header" aria-hidden="true"><span>Chamado</span><span>Status</span><span>Atualização</span></div>
              {filteredTickets.map((ticket) => {
                const requester = displayedUsers.find((user) => user.id === ticket.userId);
                return <button className={`ticket-table-row ${selectedTicketId === ticket.id ? "is-selected" : ""}`} key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} type="button"><span className="ticket-table-title"><span className={`priority-dot ${priorityClass[ticket.priority]}`} /><span><strong>{ticket.title}</strong><small>#{ticket.id} · {requester?.name}</small></span></span><span className={`status ${statusClass[ticket.status]}`}>{ticket.status}</span><small className="updated-at">{ticket.updatedAt}</small></button>;
              })}
              {!filteredTickets.length && <p className="empty-state">Nenhum chamado corresponde aos filtros.</p>}
            </div>
            {selectedTicket && <aside className="ticket-detail" aria-labelledby="detail-title">
              <div className="detail-heading"><div><span className="ticket-number">CHAMADO #{selectedTicket.id}</span><h3 id="detail-title">{selectedTicket.title}</h3></div><span className={`status ${statusClass[selectedTicket.status]}`}>{selectedTicket.status}</span></div>
              <p className="detail-description">{selectedTicket.description}</p>
              <dl className="detail-meta"><div><dt>Solicitante</dt><dd><span className="person-avatar">{ticketRequester ? initials(ticketRequester.name) : "?"}</span>{ticketRequester?.name}</dd></div><div><dt>Equipamento</dt><dd>{ticketEquipment?.name}<small>{ticketEquipment?.asset}</small></dd></div><div><dt>Aberto em</dt><dd>{selectedTicket.openedAt}</dd></div></dl>
              <label className="field edit-title">Título<input {...ticketTitleField} disabled={savingTicketId === selectedTicket.id} aria-invalid={Boolean(ticketEditForm.formState.errors.title)} onBlur={async (event) => { await ticketTitleField.onBlur(event); if (await ticketEditForm.trigger("title")) await persistTicketChanges(selectedTicket.id, { title: ticketEditForm.getValues("title") }); }} />{ticketEditForm.formState.errors.title?.message && <span className="auth-field-error">{ticketEditForm.formState.errors.title.message}</span>}</label>
              <div className="detail-controls"><label className="field">Status<select {...ticketStatusField} disabled={savingTicketId === selectedTicket.id} aria-invalid={Boolean(ticketEditForm.formState.errors.status)} onChange={async (event) => { await ticketStatusField.onChange(event); if (await ticketEditForm.trigger("status")) await persistTicketChanges(selectedTicket.id, { status: ticketEditForm.getValues("status") }); }}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label><label className="field">Prioridade<select {...ticketPriorityField} disabled={savingTicketId === selectedTicket.id} aria-invalid={Boolean(ticketEditForm.formState.errors.priority)} onChange={async (event) => { await ticketPriorityField.onChange(event); if (await ticketEditForm.trigger("priority")) await persistTicketChanges(selectedTicket.id, { priority: ticketEditForm.getValues("priority") }); }}>{priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}</select></label></div>
              <label className="field edit-description">Descrição<textarea {...ticketDescriptionField} disabled={savingTicketId === selectedTicket.id} rows={3} aria-invalid={Boolean(ticketEditForm.formState.errors.description)} onBlur={async (event) => { await ticketDescriptionField.onBlur(event); if (await ticketEditForm.trigger("description")) await persistTicketChanges(selectedTicket.id, { description: ticketEditForm.getValues("description") }); }} />{ticketEditForm.formState.errors.description?.message && <span className="auth-field-error">{ticketEditForm.formState.errors.description.message}</span>}</label>
              <div className="timeline" aria-label="Histórico do chamado"><p className="section-kicker">HISTÓRICO</p><div><span className="timeline-dot active" /><p><strong>Chamado atualizado</strong><small>Alterações são mantidas apenas nesta tela.</small></p><time>agora</time></div><div><span className="timeline-dot" /><p><strong>Chamado aberto</strong><small>Solicitação registrada por {ticketRequester?.name}.</small></p><time>{selectedTicket.openedAt}</time></div></div>
            </aside>}
          </div>
        </section>}

        {view === "pessoas" && <section className="page-enter management-view" aria-labelledby="users-heading">
          <div className="view-heading"><div><p className="section-kicker">CONTAS DE ACESSO</p><h2 id="users-heading">Pessoas solicitantes</h2></div><span>{authenticatedAccount?.role === "ADMIN" ? `${accounts.length} cadastradas` : "Acesso restrito"}</span></div>
          <div className="management-layout">
            {authenticatedAccount?.role === "ADMIN" ? (
              editingUserId === null ? (
                <form className="entity-form" noValidate onSubmit={createUser}>
                  <p className="section-kicker">NOVA CONTA</p><h3>Criar acesso de solicitante</h3>
                  <label className="field">Nome completo<input {...userForm.register("name")} autoComplete="name" aria-invalid={Boolean(userForm.formState.errors.name)} />{userForm.formState.errors.name?.message && <span className="auth-field-error">{userForm.formState.errors.name.message}</span>}</label>
                  <label className="field">E-mail<input {...userForm.register("email")} type="email" autoComplete="email" aria-invalid={Boolean(userForm.formState.errors.email)} />{userForm.formState.errors.email?.message && <span className="auth-field-error">{userForm.formState.errors.email.message}</span>}</label>
                  <label className="field">Setor<select {...userForm.register("sector")} aria-invalid={Boolean(userForm.formState.errors.sector)}><option value="">Selecione um setor</option>{sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}</select>{userForm.formState.errors.sector?.message && <span className="auth-field-error">{userForm.formState.errors.sector.message}</span>}</label>
                  <label className="field">Telefone<input {...userForm.register("phone")} type="tel" autoComplete="tel" aria-invalid={Boolean(userForm.formState.errors.phone)} />{userForm.formState.errors.phone?.message && <span className="auth-field-error">{userForm.formState.errors.phone.message}</span>}</label>
                  <label className="field">Senha inicial<input {...userForm.register("password")} type="password" autoComplete="new-password" aria-invalid={Boolean(userForm.formState.errors.password)} />{userForm.formState.errors.password?.message && <span className="auth-field-error">{userForm.formState.errors.password.message}</span>}</label>
                  <button className="primary-button full-button" disabled={userForm.formState.isSubmitting} type="submit">{userForm.formState.isSubmitting ? "Criando conta..." : "Criar conta"}</button>
                </form>
              ) : (
                <form className="entity-form" noValidate onSubmit={editUser}>
                  <p className="section-kicker">EDITAR PESSOA</p><h3>Atualizar dados de acesso</h3>
                  <label className="field">Nome completo<input {...userEditForm.register("name")} autoComplete="name" aria-invalid={Boolean(userEditForm.formState.errors.name)} />{userEditForm.formState.errors.name?.message && <span className="auth-field-error">{userEditForm.formState.errors.name.message}</span>}</label>
                  <label className="field">E-mail<input {...userEditForm.register("email")} type="email" autoComplete="email" aria-invalid={Boolean(userEditForm.formState.errors.email)} />{userEditForm.formState.errors.email?.message && <span className="auth-field-error">{userEditForm.formState.errors.email.message}</span>}</label>
                  <label className="field">Setor<select {...userEditForm.register("sector")} aria-invalid={Boolean(userEditForm.formState.errors.sector)}><option value="">Selecione um setor</option>{sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}</select>{userEditForm.formState.errors.sector?.message && <span className="auth-field-error">{userEditForm.formState.errors.sector.message}</span>}</label>
                  <label className="field">Telefone<input {...userEditForm.register("phone")} type="tel" autoComplete="tel" aria-invalid={Boolean(userEditForm.formState.errors.phone)} />{userEditForm.formState.errors.phone?.message && <span className="auth-field-error">{userEditForm.formState.errors.phone.message}</span>}</label>
                  <div className="entity-form-actions"><button className="quiet-button" onClick={cancelUserEdit} type="button">Cancelar</button><button className="primary-button" disabled={userEditForm.formState.isSubmitting} type="submit">{userEditForm.formState.isSubmitting ? "Salvando..." : "Salvar alterações"}</button></div>
                </form>
              )
            ) : (
              <div className="entity-form"><p className="section-kicker">ACESSO RESTRITO</p><h3>Somente o administrador pode criar contas</h3><p className="detail-description">Entre com a conta administrativa para cadastrar novos solicitantes.</p><Link className="primary-button full-button" to="/login">Entrar como administrador</Link></div>
            )}
            <div className="directory-list">{authenticatedAccount?.role === "ADMIN" ? accounts.length ? accounts.map((user) => <article className="directory-row" key={user.id}><span className="person-avatar large">{initials(user.name)}</span><div><h3>{user.name}</h3><p>{user.email} · {user.phone}</p></div><div className="directory-row-meta"><span>{user.sector}</span><div className="directory-actions"><button className="directory-action" disabled={deletingUserId === user.id} onClick={() => { setEditingUserId(user.id); userEditForm.reset({ name: user.name, email: user.email, sector: user.sector as typeof sectors[number], phone: user.phone }); }} type="button" aria-label={`Editar ${user.name}`}>Editar</button><button className="directory-action danger-action" disabled={deletingUserId === user.id} onClick={() => void deleteUser(user)} type="button" aria-label={`Excluir ${user.name}`}>{deletingUserId === user.id ? "Excluindo..." : "Excluir"}</button></div></div></article>) : <p className="empty-state">Nenhuma pessoa cadastrada.</p> : <p className="empty-state">Lista disponível para administradores.</p>}</div>
          </div>
        </section>}

        {view === "equipamentos" && <section className="page-enter management-view" aria-labelledby="equipment-heading">
          <div className="view-heading"><div><p className="section-kicker">{authenticatedAccount ? "INVENTÁRIO" : "INVENTÁRIO LOCAL"}</p><h2 id="equipment-heading">Equipamentos</h2></div><span>{displayedEquipment.length} cadastrados</span></div>
          <div className="management-layout">
            <form className="entity-form" noValidate onSubmit={saveEquipment}>
              <p className="section-kicker">{editingEquipmentId === null ? "NOVO ATIVO" : "EDITAR ATIVO"}</p><h3>{editingEquipmentId === null ? "Adicionar equipamento" : "Atualizar equipamento"}</h3>
              <label className="field">Nome<input {...equipmentForm.register("name")} placeholder="Ex.: Notebook Lenovo" aria-invalid={Boolean(equipmentForm.formState.errors.name)} />{equipmentForm.formState.errors.name?.message && <span className="auth-field-error">{equipmentForm.formState.errors.name.message}</span>}</label>
              <label className="field">Patrimônio<input {...equipmentForm.register("asset")} placeholder="Ex.: NT-0422" aria-invalid={Boolean(equipmentForm.formState.errors.asset)} />{equipmentForm.formState.errors.asset?.message && <span className="auth-field-error">{equipmentForm.formState.errors.asset.message}</span>}</label>
              <label className="field">Tipo<select {...equipmentForm.register("kind")} aria-invalid={Boolean(equipmentForm.formState.errors.kind)}><option value="">Selecione um tipo</option><option>Computador</option><option>Impressora</option><option>Scanner</option><option>Monitor</option><option>Celular</option></select>{equipmentForm.formState.errors.kind?.message && <span className="auth-field-error">{equipmentForm.formState.errors.kind.message}</span>}</label>
              {editingEquipmentId === null ? <button className="primary-button full-button" disabled={equipmentForm.formState.isSubmitting} type="submit">{equipmentForm.formState.isSubmitting ? "Adicionando..." : "Adicionar equipamento"}</button> : <div className="entity-form-actions"><button className="quiet-button" onClick={cancelEquipmentEdit} type="button">Cancelar</button><button className="primary-button" disabled={equipmentForm.formState.isSubmitting} type="submit">{equipmentForm.formState.isSubmitting ? "Salvando..." : "Salvar alterações"}</button></div>}
            </form>
            <div className="directory-list equipment-list">{accountEquipment.length ? accountEquipment.map((item) => <article className="directory-row" key={item.id}><span className="asset-mark">{item.tipo.slice(0, 1)}</span><div><h3>{item.nome}</h3><p>{item.patrimonio}</p></div><div className="directory-row-meta"><span>{item.tipo}</span><div className="directory-actions"><button className="directory-action" disabled={deletingEquipmentId === item.id} onClick={() => { setEditingEquipmentId(item.id); equipmentForm.reset({ name: item.nome, asset: item.patrimonio, kind: item.tipo as "Computador" | "Impressora" | "Scanner" | "Monitor" | "Celular" }); }} type="button" aria-label={`Editar ${item.nome}`}>Editar</button><button className="directory-action danger-action" disabled={deletingEquipmentId === item.id} onClick={() => void deleteEquipment(item)} type="button" aria-label={`Excluir ${item.nome}`}>{deletingEquipmentId === item.id ? "Excluindo..." : "Excluir"}</button></div></div></article>) : <p className="empty-state">Nenhum equipamento cadastrado.</p>}</div>
          </div>
        </section>}
      </main>
    </div>
  );
}
