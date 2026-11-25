import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

export function Notice({ message, tone = "error" }: { message: string; tone?: "error" | "success" | "info" }) {
  const palette = tone === "success"
    ? { backgroundColor: colors.successSoft, color: colors.success }
    : tone === "info"
      ? { backgroundColor: colors.accentSoft, color: colors.accentDark }
      : { backgroundColor: colors.dangerSoft, color: colors.danger };

  return (
    <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: palette.backgroundColor }]}>
      <Text selectable style={[styles.text, { color: palette.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14 },
  text: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
});
