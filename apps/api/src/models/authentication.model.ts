export interface LoginRequest {
  email: string;
  senha: string;
}

export interface AuthenticatedAdministrator {
  id: number;
  nome: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  administrador: AuthenticatedAdministrator;
}
