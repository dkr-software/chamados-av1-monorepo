import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { Notice } from "@/components/notice";
import { TicketCard } from "@/components/ticket-card";
import { useAuth } from "@/contexts/auth-context";
import { useMyTickets } from "@/hooks/use-my-tickets";
import { colors } from "@/theme/colors";

export default function TicketsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { tickets, error, loading, refreshing, refresh } = useMyTickets();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
      contentContainerStyle={styles.page}
    >
      <View style={styles.welcome}>
        <Text style={styles.eyebrow}>SEU ATENDIMENTO</Text>
        <Text style={styles.greeting}>Olá, {session?.account.nome.trim().split(/\s+/)[0]}.</Text>
        <Text style={styles.subtitle}>Acompanhe suas solicitações em um só lugar.</Text>
      </View>
      <View style={styles.sectionHeading}>
        <View><Text style={styles.sectionTitle}>Suas solicitações</Text><Text style={styles.sectionHint}>Atualizadas pela equipe de atendimento</Text></View>
      </View>
      {loading ? <View style={styles.state}><ActivityIndicator color={colors.accent} /><Text style={styles.stateText}>Carregando seus chamados…</Text></View> : null}
      {!loading && error ? (
        <View style={styles.state}>
          {tickets.length > 0 ? <Notice message="Não foi possível atualizar. Exibindo os chamados carregados." tone="info" /> : <Notice message={error} />}
          <AppButton title="Tentar novamente" onPress={refresh} variant="secondary" />
        </View>
      ) : null}
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
