import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, formatApiError, request } from "@/lib/api";
import type { Ticket } from "@/lib/types";

export function useMyTickets() {
  const { session, logout } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const hasLoaded = useRef(false);
  const refresh = useCallback(() => setRetryKey((value) => value + 1), []);

  useFocusEffect(useCallback(() => {
    if (!session) return;
    const controller = new AbortController();
    let active = true;
    if (hasLoaded.current) setRefreshing(true);
    else setLoading(true);

    void request<Ticket[]>("/api/me/chamados", { token: session.accessToken, signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setTickets(result);
        setError("");
        hasLoaded.current = true;
      })
      .catch((cause: unknown) => {
        if (!active || (cause instanceof Error && cause.name === "AbortError")) return;
        setError(formatApiError(cause));
        if (cause instanceof ApiError && cause.status === 401) void logout();
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => { active = false; controller.abort(); };
  }, [session, logout, retryKey]));

  return { tickets, error, loading, refreshing, refresh };
}
