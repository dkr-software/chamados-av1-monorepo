import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors } from "@/theme/colors";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "quiet";
};

export function AppButton({ title, onPress, disabled = false, loading = false, variant = "primary" }: Props) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : variant === "secondary" ? styles.secondary : styles.quiet,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      {loading ? <ActivityIndicator color={isPrimary ? colors.white : colors.accent} /> : (
        <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, paddingHorizontal: 20, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.accentSoft },
  quiet: { backgroundColor: "transparent" },
  label: { fontSize: 15, fontWeight: "700", letterSpacing: 0.1 },
  primaryLabel: { color: colors.white },
  secondaryLabel: { color: colors.accentDark },
  disabled: { opacity: 0.58 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
