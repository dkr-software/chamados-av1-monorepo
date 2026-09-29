export interface Chamado {
    id: number;
    titulo: string;
    descricao: string;
    prioridade: PrioridadeChamado;
    status: StatusChamado;
    equipamentoId: number;
    usuarioId: number;
    dataAbertura: Date;
    dataFechamento?: Date;
}

export type StatusChamado = "Aberto" | "Em Andamento" | "Fechado";
export type PrioridadeChamado = "Baixa" | "Média" | "Alta";