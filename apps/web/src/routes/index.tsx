import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { authenticatedRequest, clearAuthSession, getAuthSession } from "../lib/auth";
import type { AuthSession } from "../lib/auth";
import { UserPortal } from "./-user-portal";

type View = "dashboard" | "chamados" | "pessoas" | "equipamentos";
type TicketStatus = "Aberto" | "Em atendimento" | "Aguardando retorno" | "Resolvido";
type Priority = "Baixa" | "Média" | "Alta" | "Crítica";

type User = {
  id: number;
  name: string;
  email: string;
  sector: string;
};

type ApiUser = {
  id: number;
  nome: string;
  email: string;
  setor: string;
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

type Equipment = {
  id: number;
  name: string;
  asset: string;
  kind: string;
  owner: string;
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

const initialUsers: User[] = [
  { id: 1, name: "Juliana Oliveira", email: "juliana.oliveira@atende.local", sector: "Financeiro" },
  { id: 2, name: "Marcos Vinícius", email: "marcos.vinicius@atende.local", sector: "Operações" },
  { id: 3, name: "Ana Beatriz", email: "ana.beatriz@atende.local", sector: "Recursos Humanos" },
  { id: 4, name: "Diego Santos", email: "diego.santos@atende.local", sector: "Comercial" },
];

const initialEquipment: Equipment[] = [
  { id: 1, name: "Notebook Dell Latitude", asset: "NT-0421", kind: "Notebook", owner: "Juliana Oliveira" },
  { id: 2, name: "Monitor LG 27\"", asset: "MN-0198", kind: "Monitor", owner: "Marcos Vinícius" },
  { id: 3, name: "Impressora HP LaserJet", asset: "IM-0087", kind: "Impressora", owner: "Administrativo" },
  { id: 4, name: "iPhone 15", asset: "MB-0334", kind: "Celular", owner: "Diego Santos" },
];

const initialTickets: Ticket[] = [
  { id: 1842, title: "Acesso ao sistema financeiro", description: "Preciso recuperar o acesso ao módulo de pagamentos para concluir o fechamento mensal.", userId: 1, equipmentId: 1, priority: "Alta", status: "Em atendimento", openedAt: "Hoje, 09:18", updatedAt: "há 12 min" },
  { id: 1841, title: "Monitor sem sinal de vídeo", description: "O monitor secundário não reconhece o cabo ao ligar a estação.", userId: 2, equipmentId: 2, priority: "Média", status: "Aberto", openedAt: "Hoje, 08:44", updatedAt: "há 46 min" },
  { id: 1839, title: "Impressora não responde", description: "A fila de impressão permanece parada mesmo depois de reiniciar o equipamento.", userId: 3, equipmentId: 3, priority: "Alta", status: "Aguardando retorno", openedAt: "Ontem, 16:02", updatedAt: "ontem" },
  { id: 1837, title: "Configurar e-mail no celular", description: "Solicitação para configurar a conta corporativa no dispositivo móvel.", userId: 4, equipmentId: 4, priority: "Baixa", status: "Resolvido", openedAt: "Ontem, 10:12", updatedAt: "ontem" },
  { id: 1834, title: "Atualização de antivírus", description: "O agente de proteção informa que a assinatura está desatualizada.", userId: 2, equipmentId: 1, priority: "Média", status: "Aberto", openedAt: "Segunda, 14:20", updatedAt: "segunda" },
];

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

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const session = getAuthSession();

  return session?.account.role === "USER"
    ? <UserPortal session={session} />
    : <ServiceDesk session={session} />;
}

function ServiceDesk({ session }: { session: AuthSession | null }) {
  const authenticatedAccount = session?.account ?? null;
  const [view, setView] = useState<View>("dashboard");
  const [users] = useState<User[]>(initialUsers);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>(initialEquipment);
  const [accountEquipment, setAccountEquipment] = useState<ApiEquipment[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>(authenticatedAccount?.role === "ADMIN" ? [] : initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState(authenticatedAccount?.role === "ADMIN" ? 0 : 1842);
  const [isLoadingTickets, setIsLoadingTickets] = useState(authenticatedAccount?.role === "ADMIN");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | TicketStatus>("Todos");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [savingTicketId, setSavingTicketId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [ticketDraft, setTicketDraft] = useState({ title: "", description: "", userId: 1, equipmentId: 1, priority: "Média" as Priority });
  const [userDraft, setUserDraft] = useState({ name: "", email: "", sector: "", phone: "", password: "" });
  const [equipmentDraft, setEquipmentDraft] = useState({ name: "", asset: "", kind: "" });

  const displayedUsers = authenticatedAccount?.role === "ADMIN" ? accounts : users;
  const displayedEquipment = authenticatedAccount?.role === "ADMIN"
    ? accountEquipment.map((item) => ({ id: item.id, name: item.nome, asset: item.patrimonio, kind: item.tipo, owner: "Sem responsável" }))
    : equipment;
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

  const updateTicket = (id: number, changes: Partial<Ticket>) => {
    setTickets((current) => current.map((ticket) => (ticket.id === id ? { ...ticket, ...changes, updatedAt: "agora" } : ticket)));
  };

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
    setTicketDraft((current) => ({
      ...current,
      userId: displayedUsers[0]?.id ?? 0,
      equipmentId: displayedEquipment[0]?.id ?? 0,
    }));
    setView("chamados");
    setIsComposerOpen(true);
  };

  const createTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (authenticatedAccount?.role === "ADMIN") {
      const requesterExists = displayedUsers.some((user) => user.id === ticketDraft.userId);
      const equipmentExists = displayedEquipment.some((item) => item.id === ticketDraft.equipmentId);

      if (!requesterExists || !equipmentExists) {
        showNotice("Selecione uma pessoa e um equipamento cadastrados.");
        return;
      }

      setIsSubmittingTicket(true);
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
        setTicketDraft((current) => ({
          ...current,
          title: "",
          description: "",
          priority: "Média",
          userId: displayedUsers[0]?.id ?? 0,
          equipmentId: displayedEquipment[0]?.id ?? 0,
        }));
        setIsComposerOpen(false);
        showNotice(`Chamado #${nextTicket.id} criado.`);
      } catch (error) {
        showNotice(error instanceof Error ? error.message : "Não foi possível criar o chamado.");
      } finally {
        setIsSubmittingTicket(false);
      }
      return;
    }

    const nextId = Math.max(...tickets.map((ticket) => ticket.id)) + 1;
    const newTicket: Ticket = { id: nextId, title: ticketDraft.title.trim(), description: ticketDraft.description.trim(), userId: Number(ticketDraft.userId), equipmentId: Number(ticketDraft.equipmentId), priority: ticketDraft.priority, status: "Aberto", openedAt: "agora", updatedAt: "agora" };
    setTickets((current) => [newTicket, ...current]);
    setSelectedTicketId(newTicket.id);
    setTicketDraft((current) => ({ ...current, title: "", description: "", priority: "Média" }));
    setIsComposerOpen(false);
    setView("chamados");
    showNotice(`Chamado #${newTicket.id} criado apenas nesta demonstração.`);
  };

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (authenticatedAccount?.role !== "ADMIN") {
      showNotice("Entre como administrador para criar contas.");
      return;
    }

    try {
      const createdUser = await authenticatedRequest<{ id: number; nome: string; email: string; setor: string }> (
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
      const nextUser: User = { id: createdUser.id, name: createdUser.nome, email: createdUser.email, sector: createdUser.setor };
      setAccounts((current) => [nextUser, ...current.filter((user) => user.id !== nextUser.id)]);
      setUserDraft({ name: "", email: "", sector: "", phone: "", password: "" });
      showNotice(`A conta de ${nextUser.name} foi criada. Ela já pode entrar com o e-mail e a senha inicial.`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    }
  };

  const createEquipment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (authenticatedAccount?.role === "ADMIN") {
      try {
        const createdEquipment = await authenticatedRequest<ApiEquipment>("/api/equipamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: equipmentDraft.name,
            patrimonio: equipmentDraft.asset,
            tipo: equipmentDraft.kind,
          }),
        });
        setAccountEquipment((current) => [createdEquipment, ...current]);
        setEquipmentDraft({ name: "", asset: "", kind: "" });
        showNotice(`${createdEquipment.nome} foi cadastrado.`);
      } catch (error) {
        showNotice(error instanceof Error ? error.message : "Não foi possível cadastrar o equipamento.");
      }
      return;
    }

    const nextEquipment: Equipment = { id: Math.max(...equipment.map((item) => item.id)) + 1, ...equipmentDraft, owner: "Sem responsável" };
    setEquipment((current) => [nextEquipment, ...current]);
    setEquipmentDraft({ name: "", asset: "", kind: "" });
    showNotice(`${nextEquipment.name} foi adicionado à lista local.`);
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
        <div className="sidebar-bottom"><div className="admin-avatar" aria-hidden="true">{authenticatedAccount ? initials(authenticatedAccount.nome) : "RS"}</div><div><strong>{authenticatedAccount?.nome ?? "Ruan Silva"}</strong><span>{authenticatedAccount ? "Administrador" : "Demonstração"}</span></div></div>
      </aside>

      <main className="desk-main">
        <header className="desk-topbar">
          <div><p className="crumb">Central / {navigation.find(([itemView]) => itemView === view)?.[1]}</p><h1>{view === "dashboard" ? `Bom dia, ${authenticatedAccount?.nome.split(" ")[0] ?? "Ruan"}.` : navigation.find(([itemView]) => itemView === view)?.[1]}</h1></div>
          <div className="topbar-actions">{!authenticatedAccount && <span className="demo-badge">Dados de demonstração</span>}<button className="primary-button" onClick={openTicketComposer} type="button"><span aria-hidden="true">+</span> Novo chamado</button>{authenticatedAccount && <button className="quiet-button" onClick={() => { clearAuthSession(); window.location.assign("/login"); }} type="button">Sair</button>}</div>
        </header>
        {notice && <div className="toast" role="status">{notice}</div>}

        {view === "dashboard" && <section className="page-enter" aria-labelledby="overview-heading">
          <div className="overview-heading"><div><p className="section-kicker">ACOMPANHAMENTO DE HOJE</p><h2 id="overview-heading">Fila de atendimento</h2></div><p>{authenticatedAccount ? "Resumo dos chamados cadastrados no sistema." : "Resumo baseado nos chamados cadastrados nesta tela."}</p></div>
          <div className="metrics-grid">
            <article className="metric emphasis"><span>Em aberto</span><strong>{openTickets.length}</strong><small>{tickets.filter((ticket) => ticket.status === "Aberto").length} novos aguardando triagem</small></article>
            <article className="metric"><span>Em atendimento</span><strong>{tickets.filter((ticket) => ticket.status === "Em atendimento").length}</strong><small>atualizados na última hora</small></article>
            <article className="metric"><span>Aguardando retorno</span><strong>{tickets.filter((ticket) => ticket.status === "Aguardando retorno").length}</strong><small>dependem de uma confirmação</small></article>
            <article className="metric"><span>Resolvidos</span><strong>{tickets.filter((ticket) => ticket.status === "Resolvido").length}</strong><small>{authenticatedAccount ? "cadastros no sistema" : "nos dados de demonstração"}</small></article>
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
          {isComposerOpen && <form className="composer" onSubmit={createTicket}>
            <div className="composer-heading"><div><p className="section-kicker">NOVO REGISTRO</p><h3>Abrir chamado</h3></div><button className="close-button" onClick={() => setIsComposerOpen(false)} type="button" aria-label="Fechar formulário">×</button></div>
            <div className="form-grid">
              <label className="field field-wide">Título<input required value={ticketDraft.title} onChange={(event) => setTicketDraft({ ...ticketDraft, title: event.target.value })} placeholder="Descreva o pedido em uma frase" /></label>
              <label className="field">Solicitante<select required value={ticketDraft.userId || ""} onChange={(event) => setTicketDraft({ ...ticketDraft, userId: Number(event.target.value) })}><option value="" disabled>Selecione uma pessoa</option>{displayedUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.sector}</option>)}</select></label>
              <label className="field">Equipamento<select required value={ticketDraft.equipmentId || ""} onChange={(event) => setTicketDraft({ ...ticketDraft, equipmentId: Number(event.target.value) })}><option value="" disabled>Selecione um equipamento</option>{displayedEquipment.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.asset}</option>)}</select></label>
              {authenticatedAccount?.role === "ADMIN" && !displayedUsers.length && <p className="field-hint">Cadastre uma pessoa antes de abrir um chamado.</p>}
              {authenticatedAccount?.role === "ADMIN" && !displayedEquipment.length && <p className="field-hint">Cadastre um equipamento antes de abrir um chamado.</p>}
              <label className="field">Prioridade<select value={ticketDraft.priority} onChange={(event) => setTicketDraft({ ...ticketDraft, priority: event.target.value as Priority })}>{priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
              <label className="field field-wide">Descrição<textarea required value={ticketDraft.description} onChange={(event) => setTicketDraft({ ...ticketDraft, description: event.target.value })} placeholder="Inclua o que aconteceu e como isso afeta o trabalho." rows={3} /></label>
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
              <label className="field edit-title">Título<input disabled={savingTicketId === selectedTicket.id} value={selectedTicket.title} onChange={(event) => updateTicket(selectedTicket.id, { title: event.target.value })} onBlur={(event) => { void persistTicketChanges(selectedTicket.id, { title: event.target.value }); }} /></label>
              <div className="detail-controls"><label className="field">Status<select disabled={savingTicketId === selectedTicket.id} value={selectedTicket.status} onChange={(event) => { const status = event.target.value as TicketStatus; updateTicket(selectedTicket.id, { status }); void persistTicketChanges(selectedTicket.id, { status }); }}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label><label className="field">Prioridade<select disabled={savingTicketId === selectedTicket.id} value={selectedTicket.priority} onChange={(event) => { const priority = event.target.value as Priority; updateTicket(selectedTicket.id, { priority }); void persistTicketChanges(selectedTicket.id, { priority }); }}>{priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}</select></label></div>
              <label className="field edit-description">Descrição<textarea disabled={savingTicketId === selectedTicket.id} value={selectedTicket.description} rows={3} onChange={(event) => updateTicket(selectedTicket.id, { description: event.target.value })} onBlur={(event) => { void persistTicketChanges(selectedTicket.id, { description: event.target.value }); }} /></label>
              <div className="timeline" aria-label="Histórico do chamado"><p className="section-kicker">HISTÓRICO</p><div><span className="timeline-dot active" /><p><strong>Chamado atualizado</strong><small>Alterações são mantidas apenas nesta tela.</small></p><time>agora</time></div><div><span className="timeline-dot" /><p><strong>Chamado aberto</strong><small>Solicitação registrada por {ticketRequester?.name}.</small></p><time>{selectedTicket.openedAt}</time></div></div>
            </aside>}
          </div>
        </section>}

        {view === "pessoas" && <section className="page-enter management-view" aria-labelledby="users-heading">
          <div className="view-heading"><div><p className="section-kicker">CONTAS DE ACESSO</p><h2 id="users-heading">Pessoas solicitantes</h2></div><span>{authenticatedAccount?.role === "ADMIN" ? `${accounts.length} cadastradas` : "Acesso restrito"}</span></div>
          <div className="management-layout">
            {authenticatedAccount?.role === "ADMIN" ? (
              <form className="entity-form" onSubmit={createUser}>
                <p className="section-kicker">NOVA CONTA</p><h3>Criar acesso de solicitante</h3>
                <label className="field">Nome completo<input required value={userDraft.name} onChange={(event) => setUserDraft({ ...userDraft, name: event.target.value })} autoComplete="name" /></label>
                <label className="field">E-mail<input required type="email" value={userDraft.email} onChange={(event) => setUserDraft({ ...userDraft, email: event.target.value })} autoComplete="email" /></label>
                <label className="field">Setor<input required value={userDraft.sector} onChange={(event) => setUserDraft({ ...userDraft, sector: event.target.value })} /></label>
                <label className="field">Telefone<input required type="tel" value={userDraft.phone} onChange={(event) => setUserDraft({ ...userDraft, phone: event.target.value })} autoComplete="tel" /></label>
                <label className="field">Senha inicial<input required type="password" minLength={8} maxLength={72} value={userDraft.password} onChange={(event) => setUserDraft({ ...userDraft, password: event.target.value })} autoComplete="new-password" /></label>
                <button className="primary-button full-button" type="submit">Criar conta</button>
              </form>
            ) : (
              <div className="entity-form"><p className="section-kicker">ACESSO RESTRITO</p><h3>Somente o administrador pode criar contas</h3><p className="detail-description">Entre com a conta administrativa para cadastrar novos solicitantes.</p><Link className="primary-button full-button" to="/login">Entrar como administrador</Link></div>
            )}
            <div className="directory-list">{authenticatedAccount?.role === "ADMIN" ? accounts.map((user) => <article className="directory-row" key={user.id}><span className="person-avatar large">{initials(user.name)}</span><div><h3>{user.name}</h3><p>{user.email}</p></div><span>{user.sector}</span></article>) : <p className="empty-state">Lista disponível para administradores.</p>}</div>
          </div>
        </section>}

        {view === "equipamentos" && <section className="page-enter management-view" aria-labelledby="equipment-heading">
          <div className="view-heading"><div><p className="section-kicker">{authenticatedAccount ? "INVENTÁRIO" : "INVENTÁRIO LOCAL"}</p><h2 id="equipment-heading">Equipamentos</h2></div><span>{displayedEquipment.length} cadastrados</span></div>
          <div className="management-layout">
            <form className="entity-form" onSubmit={createEquipment}>
              <p className="section-kicker">NOVO ATIVO</p><h3>Adicionar equipamento</h3>
              <label className="field">Nome<input required value={equipmentDraft.name} onChange={(event) => setEquipmentDraft({ ...equipmentDraft, name: event.target.value })} placeholder="Ex.: Notebook Lenovo" /></label>
              <label className="field">Patrimônio<input required value={equipmentDraft.asset} onChange={(event) => setEquipmentDraft({ ...equipmentDraft, asset: event.target.value })} placeholder="Ex.: NT-0422" /></label>
              <label className="field">Tipo<select required value={equipmentDraft.kind} onChange={(event) => setEquipmentDraft({ ...equipmentDraft, kind: event.target.value })}><option value="" disabled>Selecione um tipo</option><option>Computador</option><option>Impressora</option><option>Scanner</option><option>Monitor</option><option>Celular</option></select></label>
              <button className="primary-button full-button" type="submit">Adicionar equipamento</button>
            </form>
            <div className="directory-list equipment-list">{displayedEquipment.map((item) => <article className="directory-row" key={item.id}><span className="asset-mark">{item.kind.slice(0, 1)}</span><div><h3>{item.name}</h3><p>{item.asset} · {item.owner}</p></div><span>{item.kind}</span></article>)}</div>
          </div>
        </section>}
      </main>
    </div>
  );
}
