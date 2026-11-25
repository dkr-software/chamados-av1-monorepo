import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { AdminTicketCard } from "@/components/admin-ticket-card";
import { AppButton } from "@/components/app-button";
import { Notice } from "@/components/notice";
import { useAdminData } from "@/contexts/admin-data-context";
import { useAuth } from "@/contexts/auth-context";
import { colors } from "@/theme/colors";

export default function AdminDashboard() {
  const { session } = useAuth();
  const { tickets, users, equipment, loading, refreshing, error, refresh } = useAdminData();
  const router = useRouter();
  const hasData = tickets.length > 0 || users.length > 0 || equipment.length > 0;
  const showContent = hasData || (!loading && !error);
  const openTickets = tickets.filter((ticket) => ticket.status !== "Resolvido");
  const metrics = [
    { label: "Em aberto", value: tickets.filter((ticket) => ticket.status === "Aberto").length, hint: "aguardando triagem", tone: colors.orange },
    { label: "Em atendimento", value: tickets.filter((ticket) => ticket.status === "Em atendimento").length, hint: "em andamento", tone: colors.accent },
    { label: "Aguardando retorno", value: tickets.filter((ticket) => ticket.status === "Aguardando retorno").length, hint: "dependem de resposta", tone: "#70579A" },
    { label: "Resolvidos", value: tickets.filter((ticket) => ticket.status === "Resolvido").length, hint: "finalizados", tone: colors.success },
  ];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
      contentContainerStyle={styles.page}
    >
      <View style={styles.welcome}>
        <Text style={styles.eyebrow}>CENTRAL DE SERVIÇOS</Text>
        <Text style={styles.title}>Olá, {session?.account.nome.trim().split(/\s+/)[0]}.</Text>
        <Text style={styles.subtitle}>Acompanhe a fila e mantenha os chamados em movimento.</Text>
      </View>
      {error ? <View style={styles.errorState}><Notice message={error} /><AppButton title="Tentar novamente" onPress={refresh} variant="secondary" /></View> : null}
      {loading && !hasData ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.subtitle}>Carregando dados administrativos…</Text></View> : null}

      {showContent ? <>
      <View style={styles.metrics}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metric}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={[styles.metricValue, { color: metric.tone }]}>{metric.value}</Text>
            <Text style={styles.metricHint}>{metric.hint}</Text>
          </View>
        ))}
      </View>

      <View style={styles.resourceRow}>
        <View style={styles.resource}><Text style={styles.resourceValue}>{users.length}</Text><Text style={styles.resourceLabel}>pessoas</Text></View>
        <View style={styles.resource}><Text style={styles.resourceValue}>{equipment.length}</Text><Text style={styles.resourceLabel}>equipamentos</Text></View>
        <AppButton title="Abrir chamados" onPress={() => router.push("/(admin)/tickets")} variant="secondary" />
      </View>

      <View style={styles.sectionHeader}>
        <View><Text style={styles.sectionTitle}>Próximos chamados</Text><Text style={styles.sectionHint}>{openTickets.length} aguardando ou em atendimento</Text></View>
        <Text style={styles.link} onPress={() => router.push("/(admin)/tickets")}>Ver todos</Text>
      </View>
      {loading && tickets.length === 0 ? null : openTickets.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyTitle}>Fila tranquila</Text><Text style={styles.emptyText}>Novos chamados aparecerão aqui para triagem.</Text></View>
      ) : openTickets.slice(0, 4).map((ticket) => (
        <AdminTicketCard key={ticket.id} ticket={ticket} requester={users.find((user) => user.id === ticket.usuarioId)} equipment={equipment.find((item) => item.id === ticket.equipamentoId)} />
      ))}
      <View style={styles.actions}>
        <AppButton title="Gerenciar pessoas" onPress={() => router.push("/(admin)/users")} variant="secondary" />
        <AppButton title="Gerenciar equipamentos" onPress={() => router.push("/(admin)/equipment")} variant="quiet" />
      </View>
      </> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 16 },
  welcome: { gap: 5, paddingVertical: 5 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 35, fontWeight: "800", letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  loading: { alignItems: "center", gap: 10, paddingVertical: 18 },
  errorState: { gap: 9 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: { width: "48%", minHeight: 112, padding: 14, gap: 3, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16 },
  metricLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  metricValue: { fontSize: 27, fontWeight: "800", fontVariant: ["tabular-nums"] },
  metricHint: { color: colors.muted, fontSize: 10 },
  resourceRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: colors.accent, borderRadius: 16 },
  resource: { flex: 1, gap: 2 },
  resourceValue: { color: colors.white, fontSize: 19, fontWeight: "800", fontVariant: ["tabular-nums"] },
  resourceLabel: { color: "#D8E9E0", fontSize: 10, fontWeight: "600" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 3 },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  sectionHint: { color: colors.muted, fontSize: 11, marginTop: 3 },
  link: { color: colors.accent, fontSize: 12, fontWeight: "700", padding: 6 },
  empty: { padding: 19, gap: 5, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line },
  emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  actions: { gap: 9, paddingTop: 4 },
});
