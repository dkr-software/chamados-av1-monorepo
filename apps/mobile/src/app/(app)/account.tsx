import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { useAuth } from "@/contexts/auth-context";
import { colors } from "@/theme/colors";

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function AccountScreen() {
  const { session, logout } = useAuth();
  const name = session?.account.nome ?? "Solicitante";

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.page}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials(name)}</Text></View>
        <Text selectable style={styles.name}>{name}</Text>
        <Text selectable style={styles.email}>{session?.account.email}</Text>
        <View style={styles.role}><Text style={styles.roleText}>SOLICITANTE</Text></View>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Sua conta</Text>
        <Text style={styles.infoText}>Seus chamados ficam associados a esta conta. Só você pode consultar as solicitações que abriu.</Text>
      </View>
      <View style={styles.logout}><AppButton title="Sair da conta" onPress={() => void logout()} variant="secondary" /></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 20, gap: 15 },
  profileCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, alignItems: "center", padding: 25, gap: 9 },
  avatar: { width: 70, height: 70, borderRadius: 24, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginBottom: 5 },
  avatarText: { color: colors.white, fontSize: 23, fontWeight: "800" },
  name: { color: colors.ink, fontSize: 20, fontWeight: "800", textAlign: "center" },
  email: { color: colors.muted, fontSize: 13, textAlign: "center" },
  role: { marginTop: 4, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: colors.accentSoft, borderRadius: 999 },
  roleText: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  infoCard: { padding: 17, borderRadius: 18, backgroundColor: colors.warm, gap: 7 },
  infoTitle: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  infoText: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  logout: { marginTop: "auto" },
});
