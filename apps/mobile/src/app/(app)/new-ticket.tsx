import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { FormField } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { SelectField } from "@/components/select-field";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, formatApiError, request } from "@/lib/api";
import type { Equipment, Ticket } from "@/lib/types";
import { ticketSchema } from "@/lib/validation";
import type { TicketValues } from "@/lib/validation";
import { colors } from "@/theme/colors";

export default function NewTicketScreen() {
  const { session, logout } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [equipmentError, setEquipmentError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: { titulo: "", equipamentoId: "", descricao: "" },
  });
  const equipmentId = watch("equipamentoId");
  const equipmentOptions = equipments.map((item) => ({ label: `${item.nome} · ${item.patrimonio}`, value: String(item.id) }));

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setEquipmentError("");

    void request<Equipment[]>("/api/me/equipamentos", { token: session.accessToken, signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setEquipments(result);
      })
      .catch((cause: unknown) => {
        if (!active || (cause instanceof Error && cause.name === "AbortError")) return;
        setEquipmentError(formatApiError(cause));
        if (cause instanceof ApiError && cause.status === 401) void logout();
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; controller.abort(); };
  }, [session, logout, reloadKey]);

  const submit = async (values: TicketValues) => {
    Keyboard.dismiss();
    setSubmitError("");
    setSuccess("");
    if (!session) return;

    try {
      const ticket = await request<Ticket>("/api/me/chamados", {
        method: "POST",
        token: session.accessToken,
        body: { titulo: values.titulo, descricao: values.descricao, equipamentoId: Number(values.equipamentoId) },
      });
      reset({ titulo: "", equipamentoId: values.equipamentoId, descricao: "" });
      setSuccess(`Chamado #${ticket.id} aberto. Ele já aparece na sua lista.`);
    } catch (cause) {
      setSubmitError(formatApiError(cause));
      if (cause instanceof ApiError && cause.status === 401) void logout();
    }
  };

  const selectedEquipment = equipments.find((item) => String(item.id) === equipmentId);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>NOVA SOLICITAÇÃO</Text>
        <Text style={styles.title}>Como podemos ajudar?</Text>
        <Text style={styles.subtitle}>Conte um pouco sobre o problema para nossa equipe encontrar a melhor solução.</Text>
      </View>
      {success ? <Notice message={success} tone="success" /> : null}
      {submitError ? <Notice message={submitError} /> : null}
      <View style={styles.form}>
        <Controller control={control} name="titulo" render={({ field }) => (
          <FormField label="Assunto" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.titulo?.message} placeholder="Ex.: Computador não inicia" />
        )} />
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Equipamento</Text>
          {loading ? <View style={styles.loadState}><ActivityIndicator color={colors.accent} /><Text style={styles.hint}>Carregando equipamentos…</Text></View> : null}
          {!loading && equipmentError ? <View style={styles.inlineState}><Notice message={equipmentError} /><AppButton title="Recarregar" onPress={() => setReloadKey((value) => value + 1)} variant="secondary" /></View> : null}
          {!loading && !equipmentError && equipments.length === 0 ? <Notice message="Nenhum equipamento disponível. Peça à equipe para cadastrar um equipamento." tone="info" /> : null}
          {!loading && !equipmentError && equipments.length > 0 ? (
            <View style={styles.pickerCard}>
              <Controller control={control} name="equipamentoId" render={({ field }) => (
                <SelectField value={field.value} onValueChange={field.onChange} placeholder="Selecione o equipamento" options={equipmentOptions} />
              )} />
            </View>
          ) : null}
          {errors.equipamentoId?.message ? <Text style={styles.error}>{errors.equipamentoId.message}</Text> : null}
          {selectedEquipment ? <Text style={styles.hint}>{selectedEquipment.tipo}{selectedEquipment.descricao ? ` · ${selectedEquipment.descricao}` : ""}</Text> : null}
        </View>
        <Controller control={control} name="descricao" render={({ field }) => (
          <FormField label="Descrição" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.descricao?.message} placeholder="Quando começou? O que você já tentou?" multiline />
        )} />
        <Text style={styles.helper}>Sua solicitação será vinculada à sua conta e ficará visível em Meus chamados.</Text>
        <AppButton title="Enviar chamado" onPress={handleSubmit(submit)} loading={isSubmitting} disabled={loading || Boolean(equipmentError) || equipments.length === 0} />
      </View>
      <Link href="/(app)" asChild><Pressable accessibilityRole="link" style={styles.backLink}><Text style={styles.backText}>← Voltar para meus chamados</Text></Pressable></Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 11, paddingBottom: 30, gap: 19 },
  intro: { gap: 8 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  title: { color: colors.ink, fontSize: 27, lineHeight: 34, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  form: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 17, gap: 16 },
  fieldGroup: { gap: 7 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  error: { color: colors.danger, fontSize: 12 },
  pickerCard: { minHeight: 52, justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14 },
  loadState: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10 },
  inlineState: { gap: 10 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  helper: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  backLink: { alignSelf: "center", padding: 8 },
  backText: { color: colors.accent, fontSize: 13, fontWeight: "700" },
});
