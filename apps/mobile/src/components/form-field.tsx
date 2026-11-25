import { StyleSheet, Text, TextInput, View } from "react-native";
import type { KeyboardTypeOptions, TextInputProps } from "react-native";
import { colors } from "@/theme/colors";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  textContentType?: TextInputProps["textContentType"];
  multiline?: boolean;
  error?: string;
};

export function FormField({ label, error, multiline = false, ...inputProps }: Props) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={inputProps.autoCapitalize ?? "sentences"}
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        style={[styles.input, multiline && styles.multiline, error && styles.invalid]}
        textAlignVertical={multiline ? "top" : "center"}
        {...inputProps}
      />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 7 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  input: { minHeight: 52, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.surface, color: colors.ink, fontSize: 15 },
  multiline: { minHeight: 124, paddingTop: 14 },
  invalid: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 12 },
});
