import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, FlatList, Keyboard, RefreshControl, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/app-button";
import { FormField } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { SelectField } from "@/components/select-field";
import { useAdminData } from "@/contexts/admin-data-context";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, formatApiError, request } from "@/lib/api";
import type { AdminEquipmentValues } from "@/lib/validation";
import { adminEquipmentSchema, equipmentTypes } from "@/lib/validation";
import type { Equipment } from "@/lib/types";
import { colors } from "@/theme/colors";

const typeOptions = equipmentTypes.map((type) => ({ label: type, value: type }));

export default function AdminEquipmentScreen() {
  const { session, logout } = useAuth();
  const { equipment, loading, refreshing, error: loadError, refresh } = useAdminData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const form = useForm<AdminEquipmentValues>({
    resolver: zodResolver(adminEquipmentSchema),
    defaultValues: { nome: "", patrimonio: "", tipo: "" },
  });
  const editingEquipment = equipment.find((item) => item.id === editingId);

  const handleError = (cause: unknown) => {
    setActionError(formatApiError(cause));
    if (cause instanceof ApiError && cause.status === 401) void logout();
  };

  const saveEquipment = form.handleSubmit(async (values) => {
    Keyboard.dismiss();
    setActionError("");
    const editing = editingId !== null;
    try {
      const saved = await request<Equipment>(editing ? `/api/equipamentos/${editingId}` : "/api/equipamentos", {
        method: editing ? "PATCH" : "POST",
        token: session?.accessToken,
        body: values,
      });
      setNotice(editing ? `${saved.nome} foi atualizado.` : `${saved.nome} foi cadastrado.`);
      setEditingId(null);
      setShowForm(false);
      form.reset({ nome: "", patrimonio: "", tipo: "" });
      refresh();
    } catch (cause) {
      handleError(cause);
    }
  });

  const startEditing = (item: Equipment) => {
    form.reset({ nome: item.nome, patrimonio: item.patrimonio, tipo: item.tipo });
    setEditingId(item.id);
    setShowForm(true);
  };

  const deleteEquipment = (item: Equipment) => {
    Alert.alert("Excluir equipamento", `Deseja excluir ${item.nome}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => {
        setActionError("");
        void request<void>(`/api/equipamentos/${item.id}`, { method: "DELETE", token: session?.accessToken })
          .then(() => { setNotice(`${item.nome} foi excluído.`); refresh(); })
          .catch(handleError);
      } },
    ]);
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>INVENTÁRIO</Text>
        <Text style={styles.title}>Equipamentos</Text>
        <Text style={styles.subtitle}>{equipment.length} ativos cadastrados.</Text>
      </View>
      {loadError ? <View style={styles.errorState}><Notice message={loadError} /><AppButton title="Tentar novamente" onPress={refresh} variant="secondary" /></View> : null}
      {actionError ? <Notice message={actionError} /> : null}
      {notice ? <Notice message={notice} tone="success" /> : null}
      <AppButton title={showForm ? "Cancelar" : "Adicionar equipamento"} onPress={() => { setShowForm((value) => !value); setEditingId(null); form.reset({ nome: "", patrimonio: "", tipo: "" }); setActionError(""); }} variant="secondary" />
      {showForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingEquipment ? `Editar ${editingEquipment.nome}` : "Novo ativo"}</Text>
          <Controller control={form.control} name="nome" render={({ field }) => <FormField label="Nome" value={field.value} onChangeText={field.onChange} error={form.formState.errors.nome?.message} placeholder="Ex.: Notebook Lenovo" />} />
          <Controller control={form.control} name="patrimonio" render={({ field }) => <FormField label="Patrimônio" value={field.value} onChangeText={field.onChange} error={form.formState.errors.patrimonio?.message} placeholder="Ex.: NT-0422" autoCapitalize="characters" />} />
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tipo</Text>
            <Controller control={form.control} name="tipo" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} placeholder="Selecione um tipo" options={typeOptions} />} />
            {form.formState.errors.tipo?.message ? <Text style={styles.error}>{form.formState.errors.tipo.message}</Text> : null}
          </View>
          <AppButton title={form.formState.isSubmitting ? "Salvando…" : editingEquipment ? "Salvar alterações" : "Adicionar equipamento"} onPress={saveEquipment} loading={form.formState.isSubmitting} />
        </View>
      ) : null}
      {loading && equipment.length === 0 ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.subtitle}>Carregando equipamentos…</Text></View> : null}
    </View>
  );

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      data={equipment}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
      ListEmptyComponent={!loading && !loadError ? <View style={styles.empty}><Text style={styles.emptyTitle}>Nenhum equipamento cadastrado</Text><Text style={styles.subtitle}>Adicione um ativo para liberar a abertura de chamados.</Text></View> : null}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.typeMark}><Text style={styles.typeMarkText}>{item.tipo.slice(0, 1)}</Text></View>
          <View style={styles.info}>
            <Text selectable style={styles.name}>{item.nome}</Text>
            <Text selectable style={styles.meta}>{item.patrimonio}</Text>
            <Text style={styles.meta}>{item.tipo}{item.descricao ? ` · ${item.descricao}` : ""}</Text>
          </View>
          <View style={styles.actions}>
            <AppButton title="Editar" onPress={() => startEditing(item)} variant="secondary" />
            <AppButton title="Excluir" onPress={() => deleteEquipment(item)} variant="quiet" />
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 30, gap: 11 },
  header: { gap: 13, paddingBottom: 2 },
  intro: { gap: 5 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 25, lineHeight: 32, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  formCard: { padding: 15, gap: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18 },
  formTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  fieldGroup: { gap: 7 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  error: { color: colors.danger, fontSize: 12 },
  loading: { alignItems: "center", gap: 9, paddingVertical: 18 },
  errorState: { gap: 8 },
  empty: { padding: 18, gap: 5, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line },
  emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  card: { flexDirection: "row", alignItems: "center", gap: 11, padding: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 17 },
  typeMark: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.accentSoft },
  typeMarkText: { color: colors.accent, fontSize: 18, fontWeight: "800" },
  info: { flex: 1, gap: 3 },
  name: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 10 },
  actions: { gap: 5 },
});
