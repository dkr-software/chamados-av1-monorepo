export interface Equipamento {
    id: number;
    nome: string;
    patrimonio: string;
    tipo: TipoEquipamento;
    descricao: string;
    dataCriacao: Date;
}

export enum TipoEquipamento {
    Computador = "Computador",
    Impressora = "Impressora",
    Scanner = "Scanner",
    Monitor = "Monitor",
    Celular = "Celular",
}