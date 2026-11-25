import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { Notice } from "@/components/notice";
import { TicketCard } from "@/components/ticket-card";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, formatApiError, request } from "@/lib/api";
import type { Ticket } from "@/lib/types";
import { colors } from "@/theme/colors";

export default function TicketsScreen() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const hasLoaded = useRef(false);

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
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => { active = false; controller.abort(); };
  }, [session, logout, retryKey]));

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRetryKey((value) => value + 1)} tintColor={colors.accent} />}
      contentContainerStyle={styles.page}
    >
      <View style={styles.welcome}>
        <Text style={styles.eyebrow}>SEU ATENDIMENTO</Text>
        <Text style={styles.greeting}>Olá, {session?.account.nome.trim().split(/\s+/)[0]}.</Text>
        <Text style={styles.subtitle}>Acompanhe suas solicitações em um só lugar.</Text>
      </View>
      <View style={styles.summary}>
        <View style={styles.summaryMark}><Text style={styles.summaryGlyph}>↗</Text></View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryNumber}>{tickets.length}</Text>
          <Text style={styles.summaryLabel}>{tickets.length === 1 ? "chamado registrado" : "chamados registrados"}</Text>
        </View>
        <Text style={styles.summaryDecoration}>●</Text>
      </View>
      <View style={styles.sectionHeading}>
        <View><Text style={styles.sectionTitle}>Suas solicitações</Text><Text style={styles.sectionHint}>Atualizadas pela equipe de atendimento</Text></View>
      </View>
      {error && tickets.length > 0 ? <Notice message="Não foi possível atualizar. Exibindo os chamados carregados." tone="info" /> : null}
      {loading ? <View style={styles.state}><ActivityIndicator color={colors.accent} /><Text style={styles.stateText}>Carregando seus chamados…</Text></View> : null}
      {!loading && error ? <View style={styles.state}><Notice message={error} /><AppButton title="Tentar novamente" onPress={() => setRetryKey((value) => value + 1)} variant="secondary" /></View> : null}
      {!loading && !error && tickets.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✳</Text>
          <Text style={styles.emptyTitle}>Tudo tranquilo por aqui</Text>
          <Text style={styles.emptyText}>Quando precisar de ajuda, abra um chamado e acompanhe a resposta nesta tela.</Text>
          <AppButton title="Abrir meu primeiro chamado" onPress={() => router.push("/(app)/new-ticket")} variant="secondary" />
        </View>
      ) : null}
      {tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30, gap: 15 },
  welcome: { paddingVertical: 7, gap: 5 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  greeting: { color: colors.ink, fontSize: 29, lineHeight: 36, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  summary: { backgroundColor: colors.accent, borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", gap: 13, overflow: "hidden" },
  summaryMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  summaryGlyph: { color: colors.white, fontSize: 24, fontWeight: "700" },
  summaryCopy: { gap: 2 },
  summaryNumber: { color: colors.white, fontSize: 25, lineHeight: 29, fontWeight: "800", fontVariant: ["tabular-nums"] },
  summaryLabel: { color: "#D8E9E0", fontSize: 12, fontWeight: "600" },
  summaryDecoration: { position: "absolute", right: -14, bottom: -45, color: "rgba(255,255,255,0.07)", fontSize: 115 },
  sectionHeading: { paddingTop: 7, paddingBottom: 1 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  sectionHint: { color: colors.muted, fontSize: 11, marginTop: 3 },
  state: { paddingVertical: 27, gap: 14, alignItems: "stretch" },
  stateText: { color: colors.muted, fontSize: 13, textAlign: "center" },
  empty: { padding: 22, alignItems: "center", gap: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20 },
  emptyIcon: { width: 46, height: 46, textAlign: "center", textAlignVertical: "center", overflow: "hidden", borderRadius: 16, backgroundColor: colors.accentSoft, color: colors.accent, fontSize: 26 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: "800", textAlign: "center" },
  emptyText: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: "center" },
});
