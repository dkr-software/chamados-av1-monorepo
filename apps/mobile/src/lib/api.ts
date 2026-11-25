import { Platform } from "react-native";

const fallbackApiUrl = Platform.select({
  android: "http://10.0.2.2:3000",
  default: "http://localhost:3000",
});

export const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? fallbackApiUrl ?? "http://localhost:3000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
  signal?: AbortSignal;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${apiUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError("Não foi possível conectar à API. Confira o endereço e tente novamente.", 0);
  }

  const result = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) {
    throw new ApiError(result.message ?? "Não foi possível concluir a operação.", response.status);
  }

  return result as T;
}

export function formatApiError(error: unknown) {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente.";
}
