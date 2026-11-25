import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { FormField } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { useAuth } from "@/contexts/auth-context";
import { formatApiError } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import type { LoginValues } from "@/lib/validation";
import { colors } from "@/theme/colors";

export default function LoginScreen() {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", senha: "" },
  });

  const submit = async (values: LoginValues) => {
    Keyboard.dismiss();
    setError("");
    try {
      await login(values.email, values.senha);
    } catch (cause) {
      setError(formatApiError(cause));
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
      <View style={styles.brandRow}>
        <View style={styles.mark}><Text style={styles.markText}>a.</Text></View>
        <Text style={styles.brand}>atende</Text>
      </View>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>CENTRAL DE SERVIÇOS</Text>
        <Text style={styles.title}>Tudo certo por aqui?</Text>
        <Text style={styles.subtitle}>Entre para acompanhar suas solicitações e pedir ajuda quando precisar.</Text>
      </View>
      <View style={styles.form}>
        {error ? <Notice message={error} /> : null}
        <Controller control={control} name="email" render={({ field }) => (
          <FormField label="E-mail" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.email?.message} placeholder="voce@empresa.com.br" keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" />
        )} />
        <Controller control={control} name="senha" render={({ field }) => (
          <FormField label="Senha" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.senha?.message} placeholder="Sua senha" secureTextEntry textContentType="password" />
        )} />
        <AppButton title="Entrar na minha conta" onPress={handleSubmit(submit)} loading={isSubmitting} />
      </View>
      <View style={styles.signupRow}>
        <Text style={styles.signupText}>Ainda não tem cadastro?</Text>
        <Link href="/register" asChild>
          <Pressable accessibilityRole="link"><Text style={styles.signupLink}>Criar conta</Text></Pressable>
        </Link>
      </View>
      <Text style={styles.footnote}>Seu atendimento, mais simples e perto de você.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 44, paddingBottom: 32, gap: 34 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  markText: { color: colors.white, fontSize: 21, fontWeight: "800" },
  brand: { color: colors.ink, fontSize: 20, fontWeight: "800", letterSpacing: -0.6 },
  intro: { gap: 10 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: "800", letterSpacing: 1.8 },
  title: { color: colors.ink, fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23, maxWidth: 330 },
  form: { gap: 17 },
  signupRow: { flexDirection: "row", justifyContent: "center", gap: 5 },
  signupText: { color: colors.muted, fontSize: 13 },
  signupLink: { color: colors.accent, fontSize: 13, fontWeight: "800" },
  footnote: { marginTop: "auto", textAlign: "center", color: colors.muted, fontSize: 12 },
});
