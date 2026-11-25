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
import { formatBrazilianPhone } from "@/lib/formatters";
import type { AdminUserProfileValues, RegistrationValues } from "@/lib/validation";
import { adminUserProfileSchema, registrationSchema, sectors } from "@/lib/validation";
import type { AdminUser } from "@/lib/types";
import { colors } from "@/theme/colors";

const sectorOptions = sectors.map((sector) => ({ label: sector, value: sector }));

export default function AdminUsersScreen() {
  const { session, logout } = useAuth();
  const { users, loading, refreshing, error: loadError, refresh } = useAdminData();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const createForm = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { nome: "", email: "", setor: "", telefone: "", senha: "" },
  });
  const editForm = useForm<AdminUserProfileValues>({
    resolver: zodResolver(adminUserProfileSchema),
    defaultValues: { nome: "", email: "", setor: "", telefone: "" },
  });
  const editingUser = users.find((user) => user.id === editingId);

  const handleError = (cause: unknown) => {
    setActionError(formatApiError(cause));
    if (cause instanceof ApiError && cause.status === 401) void logout();
  };

  const createUser = createForm.handleSubmit(async (values) => {
    Keyboard.dismiss();
    setActionError("");
    try {
      await request<AdminUser>("/api/usuarios", { method: "POST", token: session?.accessToken, body: values });
      createForm.reset({ nome: "", email: "", setor: "", telefone: "", senha: "" });
      setShowCreate(false);
      setNotice("A conta foi criada e já pode entrar com o e-mail e a senha inicial.");
      refresh();
    } catch (cause) {
      handleError(cause);
    }
  });

  const updateUser = editForm.handleSubmit(async (values) => {
    if (!editingId) return;
    Keyboard.dismiss();
    setActionError("");
    try {
      await request<AdminUser>(`/api/usuarios/${editingId}`, { method: "PATCH", token: session?.accessToken, body: values });
      setNotice("Os dados da pessoa foram atualizados.");
      setEditingId(null);
      refresh();
    } catch (cause) {
      handleError(cause);
    }
  });

  const startEditing = (user: AdminUser) => {
    editForm.reset({ nome: user.nome, email: user.email, setor: user.setor, telefone: formatBrazilianPhone(user.telefone) });
    setEditingId(user.id);
    setShowCreate(false);
  };

  const deleteUser = (user: AdminUser) => {
    Alert.alert("Excluir pessoa", `Deseja excluir ${user.nome}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => {
        setActionError("");
        void request<void>(`/api/usuarios/${user.id}`, { method: "DELETE", token: session?.accessToken })
          .then(() => { setNotice(`${user.nome} foi excluída.`); refresh(); })
          .catch(handleError);
      } },
    ]);
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>CONTAS DE ACESSO</Text>
        <Text style={styles.title}>Pessoas solicitantes</Text>
        <Text style={styles.subtitle}>{users.length} contas cadastradas.</Text>
      </View>
      {loadError ? <View style={styles.errorState}><Notice message={loadError} /><AppButton title="Tentar novamente" onPress={refresh} variant="secondary" /></View> : null}
      {actionError ? <Notice message={actionError} /> : null}
      {notice ? <Notice message={notice} tone="success" /> : null}
      <AppButton title={showCreate ? "Cancelar cadastro" : "Criar conta"} onPress={() => { setShowCreate((value) => !value); setEditingId(null); setActionError(""); }} variant="secondary" />
      {showCreate ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Novo acesso de solicitante</Text>
          <Controller control={createForm.control} name="nome" render={({ field }) => <FormField label="Nome completo" value={field.value} onChangeText={field.onChange} error={createForm.formState.errors.nome?.message} autoCapitalize="words" />} />
          <Controller control={createForm.control} name="email" render={({ field }) => <FormField label="E-mail" value={field.value} onChangeText={field.onChange} error={createForm.formState.errors.email?.message} keyboardType="email-address" autoCapitalize="none" />} />
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Setor</Text>
            <Controller control={createForm.control} name="setor" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} placeholder="Selecione um setor" options={sectorOptions} />} />
            {createForm.formState.errors.setor?.message ? <Text style={styles.error}>{createForm.formState.errors.setor.message}</Text> : null}
          </View>
          <Controller control={createForm.control} name="telefone" render={({ field }) => <FormField label="Telefone" value={field.value} onChangeText={(value) => field.onChange(formatBrazilianPhone(value))} error={createForm.formState.errors.telefone?.message} placeholder="(00) 00000-0000" keyboardType="phone-pad" textContentType="telephoneNumber" />} />
          <Controller control={createForm.control} name="senha" render={({ field }) => <FormField label="Senha inicial" value={field.value} onChangeText={field.onChange} error={createForm.formState.errors.senha?.message} secureTextEntry textContentType="newPassword" />} />
          <AppButton title={createForm.formState.isSubmitting ? "Criando…" : "Criar conta"} onPress={createUser} loading={createForm.formState.isSubmitting} />
        </View>
      ) : null}
      {editingUser ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Editar {editingUser.nome}</Text>
          <Controller control={editForm.control} name="nome" render={({ field }) => <FormField label="Nome completo" value={field.value} onChangeText={field.onChange} error={editForm.formState.errors.nome?.message} autoCapitalize="words" />} />
          <Controller control={editForm.control} name="email" render={({ field }) => <FormField label="E-mail" value={field.value} onChangeText={field.onChange} error={editForm.formState.errors.email?.message} keyboardType="email-address" autoCapitalize="none" />} />
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Setor</Text>
            <Controller control={editForm.control} name="setor" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} placeholder="Selecione um setor" options={sectorOptions} />} />
            {editForm.formState.errors.setor?.message ? <Text style={styles.error}>{editForm.formState.errors.setor.message}</Text> : null}
          </View>
          <Controller control={editForm.control} name="telefone" render={({ field }) => <FormField label="Telefone" value={field.value} onChangeText={(value) => field.onChange(formatBrazilianPhone(value))} error={editForm.formState.errors.telefone?.message} placeholder="(00) 00000-0000" keyboardType="phone-pad" textContentType="telephoneNumber" />} />
          <AppButton title={editForm.formState.isSubmitting ? "Salvando…" : "Salvar alterações"} onPress={updateUser} loading={editForm.formState.isSubmitting} />
          <AppButton title="Cancelar" onPress={() => setEditingId(null)} variant="quiet" />
        </View>
      ) : null}
      {loading && users.length === 0 ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.subtitle}>Carregando pessoas…</Text></View> : null}
    </View>
  );

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      data={users}
      keyExtractor={(user) => String(user.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
      ListEmptyComponent={!loading && !loadError ? <View style={styles.empty}><Text style={styles.emptyTitle}>Nenhuma pessoa cadastrada</Text><Text style={styles.subtitle}>Crie uma conta para que alguém possa abrir chamados.</Text></View> : null}
      renderItem={({ item }) => (
        <View style={styles.userCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{item.nome.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</Text></View>
          <View style={styles.userInfo}>
            <Text selectable style={styles.userName}>{item.nome}</Text>
            <Text selectable style={styles.userMeta}>{item.email}</Text>
            <Text style={styles.userMeta}>{item.setor} · {item.telefone}</Text>
          </View>
          <View style={styles.actions}>
            <AppButton title="Editar" onPress={() => startEditing(item)} variant="secondary" />
            <AppButton title="Excluir" onPress={() => deleteUser(item)} variant="quiet" />
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
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  title: { color: colors.ink, fontSize: 24, lineHeight: 31, fontWeight: "800" },
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
  userCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 17 },
  avatar: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.accentSoft },
  avatarText: { color: colors.accent, fontSize: 14, fontWeight: "800" },
  userInfo: { flex: 1, gap: 3 },
  userName: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  userMeta: { color: colors.muted, fontSize: 10 },
  actions: { gap: 5 },
});
