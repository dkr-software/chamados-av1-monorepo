export function normalizeTicketStatus(status: string) {
  if (status === "Em Andamento" || status === "Em atendimento") return "Em atendimento";
  if (status === "Fechado" || status === "Resolvido") return "Resolvido";
  if (status === "Aguardando retorno") return "Aguardando retorno";
  return "Aberto";
}

export function normalizeTicketPriority(priority: string) {
  return ["Baixa", "Média", "Alta", "Crítica"].includes(priority) ? priority : "Média";
}

export function formatAdminDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}
