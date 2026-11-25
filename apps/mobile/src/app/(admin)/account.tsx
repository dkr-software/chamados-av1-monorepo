import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { useAuth } from "@/contexts/auth-context";
import { colors } from "@/theme/colors";

export default function AdminAccountScreen() {
  const { session, logout } = useAuth();
  const initials = session?.account.nome.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() ?? "A";

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.page}>
      <View style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <Text selectable style={styles.name}>{session?.account.nome}</Text>
        <Text selectable style={styles.email}>{session?.account.email}</Text>
        <View style={styles.role}><Text style={styles.roleText}>ADMINISTRADOR</Text></View>
      </View>
      <View style={styles.note}>
        <Text style={styles.noteTitle}>Acesso administrativo</Text>
        <Text style={styles.noteText}>Você pode acompanhar chamados e gerenciar pessoas e equipamentos cadastrados no sistema.</Text>
      </View>
      <AppButton title="Sair da conta" onPress={() => void logout()} variant="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 20, gap: 14 },
  profile: { alignItems: "center", padding: 24, gap: 8, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.line },
  avatar: { width: 74, height: 74, alignItems: "center", justifyContent: "center", borderRadius: 25, backgroundColor: colors.accentSoft },
  avatarText: { color: colors.accent, fontSize: 25, fontWeight: "800" },
  name: { color: colors.ink, fontSize: 19, fontWeight: "800", textAlign: "center" },
  email: { color: colors.muted, fontSize: 13 },
  role: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.accentSoft },
  roleText: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  note: { padding: 16, gap: 6, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line },
  noteTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  noteText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
});
