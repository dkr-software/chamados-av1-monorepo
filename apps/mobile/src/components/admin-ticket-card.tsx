import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatAdminDate } from "@/lib/admin-formatters";
import type { AdminUser, Equipment, Ticket } from "@/lib/types";
import { colors } from "@/theme/colors";

type Props = {
  ticket: Ticket;
  requester?: AdminUser;
  equipment?: Equipment;
  children?: ReactNode;
};

const statusColors: Record<string, { background: string; text: string }> = {
  Aberto: { background: colors.warm, text: colors.orange },
  "Em atendimento": { background: colors.accentSoft, text: colors.accentDark },
  "Aguardando retorno": { background: "#F1EDF9", text: "#70579A" },
  Resolvido: { background: colors.successSoft, text: colors.success },
};

export function AdminTicketCard({ ticket, requester, equipment, children }: Props) {
  const badge = statusColors[ticket.status] ?? statusColors.Aberto;

  return (
    <View style={styles.card}>
      <View style={styles.topLine}>
        <Text style={styles.number}>CHAMADO #{ticket.id} · PRIORIDADE {ticket.prioridade.toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: badge.background }]}>
          <Text style={[styles.status, { color: badge.text }]}>{ticket.status}</Text>
        </View>
      </View>
      <Text selectable style={styles.title}>{ticket.titulo}</Text>
      <Text selectable numberOfLines={3} style={styles.description}>{ticket.descricao}</Text>
      <View style={styles.details}>
        <Text style={styles.meta}>Solicitante · {requester?.nome ?? `Conta #${ticket.usuarioId}`}</Text>
        <Text style={styles.meta}>Equipamento · {equipment?.nome ?? `Ativo #${ticket.equipamentoId}`}</Text>
        <Text style={styles.meta}>Abertura · {formatAdminDate(ticket.dataAbertura)}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  topLine: { gap: 8 },
  number: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  status: { fontSize: 11, fontWeight: "700" },
  title: { color: colors.ink, fontSize: 16, fontWeight: "800", lineHeight: 22 },
  description: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  details: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 9, gap: 4 },
  meta: { color: colors.muted, fontSize: 11 },
});
