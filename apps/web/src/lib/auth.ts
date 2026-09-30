export type AuthRole = "ADMIN" | "USER";

export type AuthenticatedAccount = {
  id: number;
  nome: string;
  email: string;
  role: AuthRole;
};

type LoginResponseBase = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

type LoginResponse = LoginResponseBase & (
  | { role: "ADMIN"; administrador: Omit<AuthenticatedAccount, "role"> }
  | { role: "USER"; usuario: Omit<AuthenticatedAccount, "role"> }
);

export type AuthSession = {
  accessToken: string;
  expiresAt: number;
  account: AuthenticatedAccount;
};

const sessionStorageKey = "atende:auth-session";

export async function loginAccount(email: string, password: string): Promise<LoginResponse> {
  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
  let response: Response;

  try {
    response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), senha: password }),
    });
  } catch {
    throw new Error("Não foi possível conectar à API de autenticação.");
  }

  const result = await response.json().catch(() => ({})) as {
    message?: string;
    accessToken?: unknown;
    expiresIn?: unknown;
    role?: unknown;
    administrador?: unknown;
    usuario?: unknown;
  };

  if (!response.ok) {
    if (result.message === "Erro interno do servidor") {
      throw new Error("A API encontrou um erro ao consultar o acesso. Verifique a configuração do banco de dados.");
    }

    throw new Error(result.message ?? "Não foi possível entrar.");
  }

  if (
    typeof result.accessToken !== "string" ||
    typeof result.expiresIn !== "number" ||
    !Number.isFinite(result.expiresIn) ||
    (result.role !== "ADMIN" && result.role !== "USER")
  ) {
    throw new Error("A API retornou uma resposta de autenticação inválida.");
  }

  const account = (result.role === "ADMIN" ? result.administrador : result.usuario) as
    | Partial<Omit<AuthenticatedAccount, "role">>
    | undefined;

  if (
    !account ||
    typeof account.id !== "number" ||
    typeof account.nome !== "string" ||
    typeof account.email !== "string"
  ) {
    throw new Error("A API retornou uma resposta de autenticação inválida.");
  }

  return result as LoginResponse;
}

export function saveAuthSession(login: LoginResponse) {
  const account = login.role === "ADMIN" ? login.administrador : login.usuario;
  const session: AuthSession = {
    accessToken: login.accessToken,
    expiresAt: Date.now() + login.expiresIn * 1000,
    account: { ...account, role: login.role },
  };

  // A sessão fica só nesta aba e acompanha o prazo de validade enviado pela API.
  window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

export function clearAuthSession() {
  window.sessionStorage.removeItem(sessionStorageKey);
}

export function getAuthSession(): AuthSession | null {
  const serializedSession = window.sessionStorage.getItem(sessionStorageKey);

  if (!serializedSession) {
    return null;
  }

  try {
    const session = JSON.parse(serializedSession) as AuthSession;

    if (
      !session.accessToken ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now() ||
      typeof session.account?.id !== "number" ||
      !session.account.nome ||
      (session.account.role !== "ADMIN" && session.account.role !== "USER")
    ) {
      clearAuthSession();
      return null;
    }

    return session;
  } catch {
    clearAuthSession();
    return null;
  }
}

export async function authenticatedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = getAuthSession();

  if (!session) {
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, { ...init, headers });
  } catch {
    throw new Error("Não foi possível conectar à API.");
  }

  if (response.status === 401) {
    // Depois de um 401, não há motivo para manter um token que a API já recusou.
    clearAuthSession();
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  const result = response.status === 204 ? null : await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result?.message ?? "Não foi possível concluir a operação.");
  }

  return result as T;
}