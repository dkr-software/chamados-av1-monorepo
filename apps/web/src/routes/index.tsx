import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";

type View = "dashboard" | "chamados" | "pessoas" | "equipamentos";
type TicketStatus = "Aberto" | "Em atendimento" | "Aguardando retorno" | "Resolvido";
type Priority = "Baixa" | "Média" | "Alta" | "Crítica";

type User = {
  id: number;
  name: string;
  email: string;
  sector: string;
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

export const Route = createFileRoute("/")({ component: ServiceDesk });

function ServiceDesk() {
  const [view, setView] = useState<View>("dashboard");
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [equipment, setEquipment] = useState<Equipment[]>(initialEquipment);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState(1842);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | TicketStatus>("Todos");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [ticketDraft, setTicketDraft] = useState({ title: "", description: "", userId: 1, equipmentId: 1, priority: "Média" as Priority });
  const [userDraft, setUserDraft] = useState({ name: "", email: "", sector: "" });
  const [equipmentDraft, setEquipmentDraft] = useState({ name: "", asset: "", kind: "" });

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0];
  const openTickets = tickets.filter((ticket) => ticket.status !== "Resolvido");
  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return tickets.filter((ticket) => {
      const requester = users.find((user) => user.id === ticket.userId)?.name ?? "";
      const relatedEquipment = equipment.find((item) => item.id === ticket.equipmentId)?.name ?? "";
      const matchesQuery = !normalizedQuery || [ticket.title, requester, relatedEquipment, String(ticket.id)].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
      return matchesQuery && (statusFilter === "Todos" || ticket.status === statusFilter);
    });
  }, [equipment, query, statusFilter, tickets, users]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  const updateTicket = (id: number, changes: Partial<Ticket>) => {
    setTickets((current) => current.map((ticket) => (ticket.id === id ? { ...ticket, ...changes, updatedAt: "agora" } : ticket)));
  };

  const createTicket = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextId = Math.max(...tickets.map((ticket) => ticket.id)) + 1;
    const newTicket: Ticket = { id: nextId, title: ticketDraft.title.trim(), description: ticketDraft.description.trim(), userId: Number(ticketDraft.userId), equipmentId: Number(ticketDraft.equipmentId), priority: ticketDraft.priority, status: "Aberto", openedAt: "agora", updatedAt: "agora" };
    setTickets((current) => [newTicket, ...current]);
    setSelectedTicketId(newTicket.id);
    setTicketDraft((current) => ({ ...current, title: "", description: "", priority: "Média" }));
    setIsComposerOpen(false);
    setView("chamados");
    showNotice(`Chamado #${newTicket.id} criado apenas nesta demonstração.`);
  };

  const createUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextUser = { id: Math.max(...users.map((user) => user.id)) + 1, ...userDraft };
    setUsers((current) => [nextUser, ...current]);
    setUserDraft({ name: "", email: "", sector: "" });
    showNotice(`${nextUser.name} foi adicionado à lista local.`);
  };

  const createEquipment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextEquipment: Equipment = { id: Math.max(...equipment.map((item) => item.id)) + 1, ...equipmentDraft, owner: "Sem responsável" };
    setEquipment((current) => [nextEquipment, ...current]);
    setEquipmentDraft({ name: "", asset: "", kind: "" });
    showNotice(`${nextEquipment.name} foi adicionado à lista local.`);
  };

  const ticketRequester = selectedTicket ? users.find((user) => user.id === selectedTicket.userId) : undefined;
  const ticketEquipment = selectedTicket ? equipment.find((item) => item.id === selectedTicket.equipmentId) : undefined;
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
        <div className="sidebar-bottom"><div className="admin-avatar" aria-hidden="true">RS</div><div><strong>Ruan Silva</strong><span>Administrador</span></div></div>
      </aside>

      <main className="desk-main">
        <header className="desk-topbar">
          <div><p className="crumb">Central / {navigation.find(([itemView]) => itemView === view)?.[1]}</p><h1>{view === "dashboard" ? "Bom dia, Ruan." : navigation.find(([itemView]) => itemView === view)?.[1]}</h1></div>
          <div className="topbar-actions"><span className="demo-badge">Dados de demonstração</span><button className="primary-button" onClick={() => { setView("chamados"); setIsComposerOpen(true); }} type="button"><span aria-hidden="true">+</span> Novo chamado</button></div>
        </header>
        {notice && <div className="toast" role="status">{notice}</div>}

        {view === "dashboard" && <section className="page-enter" aria-labelledby="overview-heading">
          <div className="overview-heading"><div><p className="section-kicker">ACOMPANHAMENTO DE HOJE</p><h2 id="overview-heading">Fila de atendimento</h2></div><p>Resumo baseado nos chamados cadastrados nesta tela.</p></div>
          <div className="metrics-grid">
            <article className="metric emphasis"><span>Em aberto</span><strong>{openTickets.length}</strong><small>{tickets.filter((ticket) => ticket.status === "Aberto").length} novos aguardando triagem</small></article>
            <article className="metric"><span>Em atendimento</span><strong>{tickets.filter((ticket) => ticket.status === "Em atendimento").length}</strong><small>atualizados na última hora</small></article>
            <article className="metric"><span>Aguardando retorno</span><strong>{tickets.filter((ticket) => ticket.status === "Aguardando retorno").length}</strong><small>dependem de uma confirmação</small></article>
            <article className="metric"><span>Resolvidos</span><strong>{tickets.filter((ticket) => ticket.status === "Resolvido").length}</strong><small>nos dados de demonstração</small></article>
          </div>
          <div className="dashboard-layout">
            <section className="queue-panel" aria-labelledby="queue-heading">
              <div className="panel-heading"><div><p className="section-kicker">PRIORIDADE DE ATENDIMENTO</p><h2 id="queue-heading">Próximos chamados</h2></div><button className="quiet-button" onClick={() => setView("chamados")} type="button">Ver todos</button></div>
              <div className="ticket-list">
                {tickets.filter((ticket) => ticket.status !== "Resolvido").slice(0, 4).map((ticket) => {
                  const requester = users.find((user) => user.id === ticket.userId);
                  return <button className={`ticket-row ${selectedTicketId === ticket.id ? "is-selected" : ""}`} key={ticket.id} onClick={() => { setSelectedTicketId(ticket.id); setView("chamados"); }} type="button"><span className={`priority-dot ${priorityClass[ticket.priority]}`} aria-label={`Prioridade ${ticket.priority}`} /><span className="ticket-row-copy"><strong>{ticket.title}</strong><small>#{ticket.id} · {requester?.name}</small></span><span className={`status ${statusClass[ticket.status]}`}>{ticket.status}</span></button>;
                })}
              </div>
            </section>
            <section className="today-panel" aria-labelledby="today-heading"><p className="section-kicker">RITMO DO DIA</p><h2 id="today-heading">Uma fila mais clara.</h2><p>Priorize as solicitações críticas, registre o contexto e mantenha cada pessoa informada.</p><div className="today-note"><span /> Última atualização: agora</div></section>
          </div>
        </section>}

        {view === "chamados" && <section className="page-enter" aria-labelledby="tickets-heading">
          <div className="view-heading"><div><p className="section-kicker">OPERAÇÃO</p><h2 id="tickets-heading">Todos os chamados</h2></div><span>{filteredTickets.length} resultados</span></div>
          {isComposerOpen && <form className="composer" onSubmit={createTicket}>
            <div className="composer-heading"><div><p className="section-kicker">NOVO REGISTRO</p><h3>Abrir chamado</h3></div><button className="close-button" onClick={() => setIsComposerOpen(false)} type="button" aria-label="Fechar formulário">×</button></div>
            <div className="form-grid">
              <label className="field field-wide">Título<input required value={ticketDraft.title} onChange={(event) => setTicketDraft({ ...ticketDraft, title: event.target.value })} placeholder="Descreva o pedido em uma frase" /></label>
              <label className="field">Solicitante<select value={ticketDraft.userId} onChange={(event) => setTicketDraft({ ...ticketDraft, userId: Number(event.target.value) })}>{users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.sector}</option>)}</select></label>
              <label className="field">Equipamento<select value={ticketDraft.equipmentId} onChange={(event) => setTicketDraft({ ...ticketDraft, equipmentId: Number(event.target.value) })}>{equipment.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.asset}</option>)}</select></label>
              <label className="field">Prioridade<select value={ticketDraft.priority} onChange={(event) => setTicketDraft({ ...ticketDraft, priority: event.target.value as Priority })}>{priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
              <label className="field field-wide">Descrição<textarea required value={ticketDraft.description} onChange={(event) => setTicketDraft({ ...ticketDraft, description: event.target.value })} placeholder="Inclua o que aconteceu e como isso afeta o trabalho." rows={3} /></label>
            </div>
            <div className="form-actions"><button className="quiet-button" onClick={() => setIsComposerOpen(false)} type="button">Cancelar</button><button className="primary-button" type="submit">Criar chamado</button></div>
          </form>}
          <div className="filter-bar"><label className="search-field"><span>Buscar</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Título, número, pessoa ou equipamento" /></label><label className="select-field">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "Todos" | TicketStatus)}><option>Todos</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label></div>
          <div className="tickets-workspace">
            <div className="ticket-table" role="list" aria-label="Lista de chamados"><div className="table-header" aria-hidden="true"><span>Chamado</span><span>Status</span><span>Atualização</span></div>
              {filteredTickets.map((ticket) => {
                const requester = users.find((user) => user.id === ticket.userId);
                return <button className={`ticket-table-row ${selectedTicketId === ticket.id ? "is-selected" : ""}`} key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} type="button"><span className="ticket-table-title"><span className={`priority-dot ${priorityClass[ticket.priority]}`} /><span><strong>{ticket.title}</strong><small>#{ticket.id} · {requester?.name}</small></span></span><span className={`status ${statusClass[ticket.status]}`}>{ticket.status}</span><small className="updated-at">{ticket.updatedAt}</small></button>;
              })}
              {!filteredTickets.length && <p className="empty-state">Nenhum chamado corresponde aos filtros.</p>}
            </div>
            {selectedTicket && <aside className="ticket-detail" aria-labelledby="detail-title">
              <div className="detail-heading"><div><span className="ticket-number">CHAMADO #{selectedTicket.id}</span><h3 id="detail-title">{selectedTicket.title}</h3></div><span className={`status ${statusClass[selectedTicket.status]}`}>{selectedTicket.status}</span></div>
              <p className="detail-description">{selectedTicket.description}</p>
              <dl className="detail-meta"><div><dt>Solicitante</dt><dd><span className="person-avatar">{ticketRequester ? initials(ticketRequester.name) : "?"}</span>{ticketRequester?.name}</dd></div><div><dt>Equipamento</dt><dd>{ticketEquipment?.name}<small>{ticketEquipment?.asset}</small></dd></div><div><dt>Aberto em</dt><dd>{selectedTicket.openedAt}</dd></div></dl>
              <label className="field edit-title">Título<input value={selectedTicket.title} onChange={(event) => updateTicket(selectedTicket.id, { title: event.target.value })} /></label>
              <div className="detail-controls"><label className="field">Status<select value={selectedTicket.status} onChange={(event) => updateTicket(selectedTicket.id, { status: event.target.value as TicketStatus })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label><label className="field">Prioridade<select value={selectedTicket.priority} onChange={(event) => updateTicket(selectedTicket.id, { priority: event.target.value as Priority })}>{priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}</select></label></div>
              <label className="field edit-description">Descrição<textarea value={selectedTicket.description} rows={3} onChange={(event) => updateTicket(selectedTicket.id, { description: event.target.value })} /></label>
              <div className="timeline" aria-label="Histórico do chamado"><p className="section-kicker">HISTÓRICO</p><div><span className="timeline-dot active" /><p><strong>Chamado atualizado</strong><small>Alterações são mantidas apenas nesta tela.</small></p><time>agora</time></div><div><span className="timeline-dot" /><p><strong>Chamado aberto</strong><small>Solicitação registrada por {ticketRequester?.name}.</small></p><time>{selectedTicket.openedAt}</time></div></div>
            </aside>}
          </div>
        </section>}

        {view === "pessoas" && <section className="page-enter management-view" aria-labelledby="users-heading">
          <div className="view-heading"><div><p className="section-kicker">CADASTRO LOCAL</p><h2 id="users-heading">Pessoas solicitantes</h2></div><span>{users.length} cadastradas</span></div>
          <div className="management-layout"><form className="entity-form" onSubmit={createUser}><p className="section-kicker">NOVO SOLICITANTE</p><h3>Adicionar pessoa</h3><label className="field">Nome completo<input required value={userDraft.name} onChange={(event) => setUserDraft({ ...userDraft, name: event.target.value })} placeholder="Ex.: Camila Souza" /></label><label className="field">E-mail<input required type="email" value={userDraft.email} onChange={(event) => setUserDraft({ ...userDraft, email: event.target.value })} placeholder="camila@empresa.com" /></label><label className="field">Setor<input required value={userDraft.sector} onChange={(event) => setUserDraft({ ...userDraft, sector: event.target.value })} placeholder="Ex.: Administrativo" /></label><button className="primary-button full-button" type="submit">Adicionar pessoa</button></form><div className="directory-list">{users.map((user) => <article className="directory-row" key={user.id}><span className="person-avatar large">{initials(user.name)}</span><div><h3>{user.name}</h3><p>{user.email}</p></div><span>{user.sector}</span></article>)}</div></div>
        </section>}

        {view === "equipamentos" && <section className="page-enter management-view" aria-labelledby="equipment-heading">
          <div className="view-heading"><div><p className="section-kicker">INVENTÁRIO LOCAL</p><h2 id="equipment-heading">Equipamentos</h2></div><span>{equipment.length} cadastrados</span></div>
          <div className="management-layout"><form className="entity-form" onSubmit={createEquipment}><p className="section-kicker">NOVO ATIVO</p><h3>Adicionar equipamento</h3><label className="field">Nome<input required value={equipmentDraft.name} onChange={(event) => setEquipmentDraft({ ...equipmentDraft, name: event.target.value })} placeholder="Ex.: Notebook Lenovo" /></label><label className="field">Patrimônio<input required value={equipmentDraft.asset} onChange={(event) => setEquipmentDraft({ ...equipmentDraft, asset: event.target.value })} placeholder="Ex.: NT-0422" /></label><label className="field">Tipo<input required value={equipmentDraft.kind} onChange={(event) => setEquipmentDraft({ ...equipmentDraft, kind: event.target.value })} placeholder="Ex.: Notebook" /></label><button className="primary-button full-button" type="submit">Adicionar equipamento</button></form><div className="directory-list equipment-list">{equipment.map((item) => <article className="directory-row" key={item.id}><span className="asset-mark">{item.kind.slice(0, 1)}</span><div><h3>{item.name}</h3><p>{item.asset} · {item.owner}</p></div><span>{item.kind}</span></article>)}</div></div>
        </section>}
      </main>
    </div>
  );
}
