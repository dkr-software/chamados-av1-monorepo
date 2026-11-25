import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { colors } from "@/theme/colors";

export default function AppTabs() {
  const { ready, session } = useAuth();
  if (!ready) return null;
  if (!session) return <Redirect href="/login" />;
  if (session.account.role === "ADMIN") return <Redirect href="/(admin)/index" />;

  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.ink,
      headerTitleStyle: { color: colors.ink, fontSize: 17, fontWeight: "700" },
      headerShadowVisible: false,
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, paddingTop: 5 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
    }}>
      <Tabs.Screen name="index" options={{ title: "Meus chamados", tabBarLabel: "Chamados", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "albums" : "albums-outline"} color={color} size={size} /> }} />
      <Tabs.Screen name="new-ticket" options={{ title: "Abrir chamado", tabBarLabel: "Novo", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "add-circle" : "add-circle-outline"} color={color} size={size} /> }} />
      <Tabs.Screen name="account" options={{ title: "Minha conta", tabBarLabel: "Conta", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "person-circle" : "person-circle-outline"} color={color} size={size} /> }} />
    </Tabs>
  );
}
