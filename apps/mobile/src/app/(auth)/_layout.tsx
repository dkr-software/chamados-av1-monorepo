import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/contexts/auth-context";

export default function AuthLayout() {
  const { ready, session } = useAuth();
  if (!ready) return null;
  if (session) return <Redirect href={session.account.role === "ADMIN" ? "/(admin)/index" : "/(app)"} />;

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
