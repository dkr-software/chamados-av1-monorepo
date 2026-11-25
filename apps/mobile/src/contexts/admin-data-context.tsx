import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import { ApiError, formatApiError, request } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { normalizeTicketPriority, normalizeTicketStatus } from "@/lib/admin-formatters";
import type { AdminUser, Equipment, Ticket } from "@/lib/types";

type AdminData = {
  tickets: Ticket[];
  users: AdminUser[];
  equipment: Equipment[];
  loading: boolean;
  refreshing: boolean;
  error: string;
  refresh: () => void;
};

const AdminDataContext = createContext<AdminData | null>(null);

export function AdminDataProvider({ children }: PropsWithChildren) {
  const { session, logout } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoaded = useRef(false);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    if (!session || session.account.role !== "ADMIN") return;

    const controller = new AbortController();
    let active = true;
    if (hasLoaded.current) setRefreshing(true);
    else setLoading(true);
    setError("");

    const options = { token: session.accessToken, signal: controller.signal };
    void Promise.all([
      request<Ticket[]>("/api/chamados", options),
      request<AdminUser[]>("/api/usuarios", options),
      request<Equipment[]>("/api/equipamentos", options),
    ])
      .then(([loadedTickets, loadedUsers, loadedEquipment]) => {
        if (!active) return;
        setTickets(loadedTickets.map((ticket) => ({
          ...ticket,
          status: normalizeTicketStatus(ticket.status),
          prioridade: normalizeTicketPriority(ticket.prioridade),
        })));
        setUsers(loadedUsers);
        setEquipment(loadedEquipment);
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
  }, [session, logout, refreshKey]);

  const value = useMemo(() => ({ tickets, users, equipment, loading, refreshing, error, refresh }), [tickets, users, equipment, loading, refreshing, error, refresh]);
  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error("useAdminData precisa ser usado dentro de AdminDataProvider.");
  return context;
}
