import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { FormField } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { SelectField } from "@/components/select-field";
import { useAuth } from "@/contexts/auth-context";
import { formatApiError } from "@/lib/api";
import { formatBrazilianPhone } from "@/lib/formatters";
import { registrationSchema, sectors } from "@/lib/validation";
import type { RegistrationValues } from "@/lib/validation";
import { colors } from "@/theme/colors";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [error, setError] = useState("");
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: { nome: "", email: "", setor: "", telefone: "", senha: "" },
  });

  const submit = async (values: RegistrationValues) => {
    Keyboard.dismiss();
    setError("");
    try {
      await register(values);
    } catch (cause) {
      setError(formatApiError(cause));
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>BEM-VINDO AO ATENDE</Text>
        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>Com seus dados, você poderá registrar e acompanhar seus chamados.</Text>
      </View>
      {error ? <Notice message={error} /> : null}
      <View style={styles.form}>
        <Controller control={control} name="nome" render={({ field }) => (
          <FormField label="Nome completo" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.nome?.message} placeholder="Como podemos chamar você?" textContentType="name" />
        )} />
        <Controller control={control} name="email" render={({ field }) => (
          <FormField label="E-mail" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.email?.message} placeholder="voce@empresa.com.br" keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" />
        )} />
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Setor</Text>
          <View style={styles.pickerCard}>
            <Controller control={control} name="setor" render={({ field }) => (
              <SelectField value={field.value} onValueChange={field.onChange} placeholder="Selecione seu setor" options={sectors.map((sector) => ({ label: sector, value: sector }))} />
            )} />
          </View>
          {errors.setor?.message ? <Text style={styles.error}>{errors.setor.message}</Text> : null}
        </View>
        <Controller control={control} name="telefone" render={({ field }) => (
          <FormField label="Telefone" value={field.value} onChangeText={(value) => field.onChange(formatBrazilianPhone(value))} onBlur={field.onBlur} error={errors.telefone?.message} placeholder="(00) 00000-0000" keyboardType="phone-pad" textContentType="telephoneNumber" />
        )} />
        <Controller control={control} name="senha" render={({ field }) => (
          <FormField label="Senha" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.senha?.message} placeholder="Pelo menos 8 caracteres" secureTextEntry textContentType="newPassword" />
        )} />
        <AppButton title="Criar minha conta" onPress={handleSubmit(submit)} loading={isSubmitting} />
      </View>
      <View style={styles.loginRow}>
        <Text style={styles.loginText}>Já tem uma conta?</Text>
        <Link href="/login" asChild><Pressable accessibilityRole="link"><Text style={styles.loginLink}>Entrar</Text></Pressable></Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 34, paddingBottom: 30, gap: 22 },
  intro: { gap: 9 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: "800", letterSpacing: 1.8 },
  title: { color: colors.ink, fontSize: 32, lineHeight: 39, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  form: { gap: 15 },
  fieldGroup: { gap: 7 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  error: { color: colors.danger, fontSize: 12 },
  pickerCard: { minHeight: 52, justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14 },
  loginRow: { flexDirection: "row", justifyContent: "center", gap: 5 },
  loginText: { color: colors.muted, fontSize: 13 },
  loginLink: { color: colors.accent, fontSize: 13, fontWeight: "800" },
});
