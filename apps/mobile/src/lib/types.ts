export type Account = {
  id: number;
  nome: string;
  email: string;
  role: "USER" | "ADMIN";
};

export type AuthSession = {
  accessToken: string;
  expiresAt: number;
  account: Account;
};

export type Equipment = {
  id: number;
  nome: string;
  patrimonio: string;
  tipo: string;
  descricao: string | null;
};

export type AdminUser = {
  id: number;
  nome: string;
  email: string;
  setor: string;
  telefone: string;
};

export type Ticket = {
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

type AuthResponseBase = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

export type AuthResponse = AuthResponseBase & (
  | { role: "USER"; usuario: { id: number; nome: string; email: string }; administrador?: never }
  | { role: "ADMIN"; administrador: { id: number; nome: string; email: string }; usuario?: never }
);
