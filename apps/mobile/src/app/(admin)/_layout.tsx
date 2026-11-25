import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { AdminDataProvider } from "@/contexts/admin-data-context";
import { useAuth } from "@/contexts/auth-context";
import { colors } from "@/theme/colors";

export default function AdminTabs() {
  const { ready, session } = useAuth();
  if (!ready) return null;
  if (!session) return <Redirect href="/login" />;
  if (session.account.role !== "ADMIN") return <Redirect href="/(app)" />;

  return (
    <AdminDataProvider>
      <Tabs screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.ink,
        headerTitleStyle: { color: colors.ink, fontSize: 17, fontWeight: "700" },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, paddingTop: 5 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}>
        <Tabs.Screen name="index" options={{ title: "Visão geral", tabBarLabel: "Início", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "grid" : "grid-outline"} color={color} size={size} /> }} />
        <Tabs.Screen name="tickets" options={{ title: "Chamados", tabBarLabel: "Chamados", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "albums" : "albums-outline"} color={color} size={size} /> }} />
        <Tabs.Screen name="users" options={{ title: "Pessoas", tabBarLabel: "Pessoas", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "people" : "people-outline"} color={color} size={size} /> }} />
        <Tabs.Screen name="equipment" options={{ title: "Equipamentos", tabBarLabel: "Ativos", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "cube" : "cube-outline"} color={color} size={size} /> }} />
        <Tabs.Screen name="account" options={{ title: "Conta administrativa", tabBarLabel: "Conta", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "person-circle" : "person-circle-outline"} color={color} size={size} /> }} />
      </Tabs>
    </AdminDataProvider>
  );
}
