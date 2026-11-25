import { StyleSheet, Text, View } from "react-native";
import type { Ticket } from "@/lib/types";
import { colors } from "@/theme/colors";

const statusColors: Record<string, { background: string; text: string }> = {
  Aberto: { background: colors.warm, text: colors.orange },
  "Em atendimento": { background: colors.accentSoft, text: colors.accentDark },
  "Em Andamento": { background: colors.accentSoft, text: colors.accentDark },
  "Aguardando retorno": { background: "#F1EDF9", text: "#70579A" },
  Resolvido: { background: colors.successSoft, text: colors.success },
  Fechado: { background: colors.successSoft, text: colors.success },
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const badge = statusColors[ticket.status] ?? { background: colors.warm, text: colors.orange };

  return (
    <View style={styles.card}>
      <View style={styles.topLine}>
        <Text style={styles.number}>CHAMADO #{ticket.id}</Text>
        <View style={[styles.badge, { backgroundColor: badge.background }]}>
          <Text style={[styles.status, { color: badge.text }]}>{ticket.status}</Text>
        </View>
      </View>
      <Text selectable style={styles.title}>{ticket.titulo}</Text>
      <Text selectable numberOfLines={3} style={styles.description}>{ticket.descricao}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>Equipamento {ticket.equipamentoId}</Text>
        <Text style={styles.meta}>{formatDate(ticket.dataAbertura)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 20, padding: 17, gap: 11 },
  topLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  number: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  status: { fontSize: 11, fontWeight: "700" },
  title: { color: colors.ink, fontSize: 17, fontWeight: "700", lineHeight: 23 },
  description: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  footer: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 11, flexDirection: "row", justifyContent: "space-between", gap: 8 },
  meta: { color: colors.muted, fontSize: 11 },
});
