export interface LoginRequest {
  email: string;
  senha: string;
}

export interface AuthenticatedAdministrator {
  id: number;
  nome: string;
  email: string;
}

export interface AuthenticatedUser {
  id: number;
  nome: string;
  email: string;
}

interface LoginResponseBase {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export type LoginResponse = LoginResponseBase & (
  | { role: "ADMIN"; administrador: AuthenticatedAdministrator }
  | { role: "USER"; usuario: AuthenticatedUser }
);
