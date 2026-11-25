import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { Notice } from "@/components/notice";
import { useMyTickets } from "@/hooks/use-my-tickets";
import { normalizeTicketStatus } from "@/lib/admin-formatters";
import { colors } from "@/theme/colors";

const ticketStatusMetrics = [
  { label: "Aberto", color: colors.orange },
  { label: "Em atendimento", color: colors.accent },
  { label: "Aguardando retorno", color: "#70579A" },
  { label: "Resolvido", color: colors.success },
];

export default function TicketStatisticsScreen() {
  const router = useRouter();
  const { tickets, error, loading, refreshing, refresh } = useMyTickets();
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter((ticket) => normalizeTicketStatus(ticket.status) === "Resolvido").length;
  const activeTickets = totalTickets - resolvedTickets;
  const resolutionRate = totalTickets ? Math.round((resolvedTickets / totalTickets) * 100) : 0;
  const showStatistics = tickets.length > 0 || (!loading && !error);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
      contentContainerStyle={styles.page}
    >
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>SEU ATENDIMENTO</Text>
        <Text style={styles.title}>Estatísticas dos chamados</Text>
        <Text style={styles.subtitle}>Resumo das suas solicitações.</Text>
      </View>
      {loading ? <View style={styles.state}><ActivityIndicator color={colors.accent} /><Text style={styles.stateText}>Carregando seus chamados…</Text></View> : null}
      {!loading && error ? (
        <View style={styles.state}>
          {tickets.length > 0 ? <Notice message="Não foi possível atualizar. Exibindo os dados carregados." tone="info" /> : <Notice message={error} />}
          <AppButton title="Tentar novamente" onPress={refresh} variant="secondary" />
        </View>
      ) : null}
      {showStatistics ? (
        <>
          <View style={styles.summary}>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryCaption}>TOTAL REGISTRADO</Text>
              <Text selectable style={styles.summaryNumber}>{totalTickets}</Text>
              <Text style={styles.summaryLabel}>{totalTickets === 1 ? "chamado" : "chamados"}</Text>
            </View>
            <View style={styles.resolutionBadge}>
              <Text selectable style={styles.resolutionValue}>{totalTickets ? `${resolutionRate}%` : "—"}</Text>
              <Text style={styles.resolutionLabel}>taxa de resolução</Text>
            </View>
            <Text style={styles.summaryDecoration}>●</Text>
          </View>
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text selectable style={styles.metricValue}>{activeTickets}</Text>
              <Text style={styles.metricLabel}>Não resolvidos</Text>
            </View>
            <View style={styles.metric}>
              <Text selectable style={[styles.metricValue, { color: colors.success }]}>{resolvedTickets}</Text>
              <Text style={styles.metricLabel}>Resolvidos</Text>
            </View>
          </View>
          {totalTickets > 0 ? (
            <View style={styles.breakdown}>
              <Text style={styles.breakdownTitle}>Chamados por status</Text>
              {ticketStatusMetrics.map(({ label, color }) => {
                const count = tickets.filter((ticket) => normalizeTicketStatus(ticket.status) === label).length;
                const percentage = Math.round((count / totalTickets) * 100);

                return (
                  <View key={label} style={styles.statusRow}>
                    <View style={styles.statusLabelLine}>
                      <View style={[styles.statusDot, { backgroundColor: color }]} />
                      <Text style={styles.statusLabel}>{label}</Text>
                      <Text selectable style={styles.statusCount}>{count}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noStatistics}>
              <Text style={styles.noStatisticsTitle}>Ainda não há chamados</Text>
              <Text style={styles.noStatisticsText}>Abra um chamado para começar a acompanhar seus dados de atendimento.</Text>
              <AppButton title="Abrir chamado" onPress={() => router.push("/(app)/new-ticket")} variant="secondary" />
            </View>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, gap: 15 },
  intro: { gap: 5, paddingVertical: 5 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  title: { color: colors.ink, fontSize: 25, lineHeight: 32, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  state: { paddingVertical: 27, gap: 14, alignItems: "stretch" },
  stateText: { color: colors.muted, fontSize: 13, textAlign: "center" },
  summary: { backgroundColor: colors.accent, borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", overflow: "hidden" },
  summaryCopy: { gap: 1 },
  summaryCaption: { color: "#D8E9E0", fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  summaryNumber: { color: colors.white, fontSize: 25, lineHeight: 29, fontWeight: "800", fontVariant: ["tabular-nums"] },
  summaryLabel: { color: "#D8E9E0", fontSize: 12, fontWeight: "600" },
  summaryDecoration: { position: "absolute", right: -14, bottom: -45, color: "rgba(255,255,255,0.07)", fontSize: 115 },
  resolutionBadge: { alignItems: "center", justifyContent: "center", width: 86, height: 68, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.13)" },
  resolutionValue: { color: colors.white, fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
  resolutionLabel: { color: "#D8E9E0", fontSize: 9, fontWeight: "600", textAlign: "center" },
  metrics: { flexDirection: "row", gap: 10 },
  metric: { flex: 1, backgroundColor: colors.surface, borderRadius: 15, borderWidth: 1, borderColor: colors.line, padding: 13, gap: 3 },
  metricValue: { color: colors.orange, fontSize: 21, fontWeight: "800", fontVariant: ["tabular-nums"] },
  metricLabel: { color: colors.muted, fontSize: 10, fontWeight: "600" },
  breakdown: { gap: 12, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 15 },
  breakdownTitle: { color: colors.ink, fontSize: 13, fontWeight: "800", paddingBottom: 1 },
  statusRow: { gap: 6 },
  statusLabelLine: { flexDirection: "row", alignItems: "center", gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { flex: 1, color: colors.muted, fontSize: 11, fontWeight: "600" },
  statusCount: { color: colors.ink, fontSize: 11, fontWeight: "700", fontVariant: ["tabular-nums"] },
  barTrack: { height: 5, borderRadius: 999, backgroundColor: colors.background, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 999 },
  noStatistics: { gap: 10, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 17 },
  noStatisticsTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  noStatisticsText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
