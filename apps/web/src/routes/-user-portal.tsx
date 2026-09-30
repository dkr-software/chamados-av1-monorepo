import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { AuthSession } from "../lib/auth";
import { authenticatedRequest, clearAuthSession } from "../lib/auth";
import { userTicketFormSchema } from "../lib/form-schemas";

type Equipment = {
  id: number;
  nome: string;
  patrimonio: string;
  tipo: string;
};

type Ticket = {
  id: number;
  titulo: string;
  descricao: string;
  prioridade: string;
  status: string;
  equipamentoId: number;
  dataAbertura: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function UserPortal({ session }: { session: AuthSession }) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const ticketForm = useForm({
    resolver: zodResolver(userTicketFormSchema),
    defaultValues: { title: "", description: "", equipmentId: "" },
  });
  const isSubmitting = ticketForm.formState.isSubmitting;

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      authenticatedRequest<Equipment[]>("/api/me/equipamentos"),
      authenticatedRequest<Ticket[]>("/api/me/chamados"),
    ])
      .then(([loadedEquipments, loadedTickets]) => {
        if (isCurrent) {
          setEquipments(loadedEquipments);
          setTickets(loadedTickets);
          ticketForm.setValue("equipmentId", loadedEquipments[0] ? String(loadedEquipments[0].id) : "");
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : "Não foi possível carregar seus chamados.");
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [session.accessToken]);

  const submitTicket = ticketForm.handleSubmit(async ({ title, description, equipmentId }) => {
    setNotice("");

    try {
      const ticket = await authenticatedRequest<Ticket>("/api/me/chamados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: title,
          descricao: description,
          equipamentoId: Number(equipmentId),
        }),
      });
      setTickets((current) => [ticket, ...current]);
      ticketForm.reset({ title: "", description: "", equipmentId });
      setNotice("Chamado registrado.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível registrar o chamado.");
    }
  });

  const signOut = () => {
    clearAuthSession();
    window.location.assign("/login");
  };

  return (
    <div className="desk-shell">
      <aside className="desk-sidebar" aria-label="Navegação do sistema">
        <div className="sidebar-top">
          <span className="workspace-label">CENTRAL DE SERVIÇOS</span>
          <div className="workspace-name"><span className="workspace-mark" aria-hidden="true">a.</span><span>atende</span></div>
        </div>
        <nav className="desk-nav"><a className="nav-item is-active" href="#my-tickets">Meus chamados</a></nav>
        <div className="sidebar-bottom">
          <div className="admin-avatar" aria-hidden="true">{session.account.nome.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div>
          <div><strong>{session.account.nome}</strong><span>Solicitante</span></div>
        </div>
      </aside>

      <main className="desk-main">
        <header className="desk-topbar">
          <div><p className="crumb">Central / Área do solicitante</p><h1>Olá, {session.account.nome.split(" ")[0]}.</h1></div>
          <div className="topbar-actions"><span className="demo-badge">Solicitante</span><button className="quiet-button" onClick={signOut} type="button">Sair</button></div>
        </header>

        <section className="page-enter user-portal-content" id="my-tickets" aria-labelledby="user-tickets-heading">
          <div className="overview-heading"><div><p className="section-kicker">SEU ATENDIMENTO</p><h2 id="user-tickets-heading">Meus chamados</h2></div><p>As solicitações e atualizações desta área pertencem à sua conta.</p></div>

          {loadError && <p className="auth-message is-error" role="alert">{loadError}</p>}
          {notice && <p className="auth-message" role="status">{notice}</p>}

          <div className="user-portal-layout">
            <form className="entity-form" noValidate onSubmit={submitTicket}>
              <p className="section-kicker">NOVA SOLICITAÇÃO</p>
              <h3>Abrir chamado</h3>
              <label className="field" htmlFor="portal-title">Assunto<input id="portal-title" {...ticketForm.register("title")} aria-invalid={Boolean(ticketForm.formState.errors.title)} />{ticketForm.formState.errors.title?.message && <span className="auth-field-error">{ticketForm.formState.errors.title.message}</span>}</label>
              <label className="field" htmlFor="portal-equipment">Equipamento
                <select id="portal-equipment" {...ticketForm.register("equipmentId")} disabled={!equipments.length || isLoading} aria-invalid={Boolean(ticketForm.formState.errors.equipmentId)}>
                  {!equipments.length && <option value="">Selecione um equipamento</option>}
                  {equipments.map((equipment) => <option key={equipment.id} value={equipment.id}>{equipment.nome} · {equipment.patrimonio}</option>)}
                </select>
              </label>
              {ticketForm.formState.errors.equipmentId?.message && <span className="auth-field-error">{ticketForm.formState.errors.equipmentId.message}</span>}
              {!isLoading && !equipments.length && <p className="field-hint">Nenhum equipamento está cadastrado. Peça ao administrador para adicioná-lo.</p>}
              <label className="field" htmlFor="portal-description">Descrição<textarea id="portal-description" {...ticketForm.register("description")} rows={4} aria-invalid={Boolean(ticketForm.formState.errors.description)} />{ticketForm.formState.errors.description?.message && <span className="auth-field-error">{ticketForm.formState.errors.description.message}</span>}</label>
              <button className="primary-button full-button" disabled={isLoading || isSubmitting || !equipments.length} type="submit">{isSubmitting ? "Enviando..." : "Enviar chamado"}</button>
            </form>

            <div className="portal-ticket-list" aria-live="polite">
              {isLoading ? <p className="empty-state">Carregando seus chamados...</p> : tickets.length ? tickets.map((ticket) => (
                <article className="portal-ticket-row" key={ticket.id}>
                  <div><span className="ticket-number">CHAMADO #{ticket.id}</span><h3>{ticket.titulo}</h3><p>{ticket.descricao}</p></div>
                  <div className="portal-ticket-meta"><span className="status status-progress">{ticket.status}</span><time>{formatDate(ticket.dataAbertura)}</time></div>
                </article>
              )) : <p className="empty-state">Você ainda não abriu chamados.</p>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
