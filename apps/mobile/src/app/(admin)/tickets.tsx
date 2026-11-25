import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, FlatList, Keyboard, RefreshControl, StyleSheet, Text, View } from "react-native";
import { AdminTicketCard } from "@/components/admin-ticket-card";
import { AppButton } from "@/components/app-button";
import { FormField } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { SelectField } from "@/components/select-field";
import { useAdminData } from "@/contexts/admin-data-context";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, formatApiError, request } from "@/lib/api";
import type { AdminTicketCreateValues, AdminTicketEditValues } from "@/lib/validation";
import { adminTicketCreateSchema, adminTicketEditSchema, priorities, ticketStatuses } from "@/lib/validation";
import type { Ticket } from "@/lib/types";
import { colors } from "@/theme/colors";

const statusFilterOptions = ["Todos", ...ticketStatuses].map((status) => ({ label: status, value: status }));
const priorityOptions = priorities.map((priority) => ({ label: priority, value: priority }));
const ticketStatusOptions = ticketStatuses.map((status) => ({ label: status, value: status }));

export default function AdminTicketsScreen() {
  const { session, logout } = useAuth();
  const { tickets, users, equipment, loading, refreshing, error: loadError, refresh } = useAdminData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const createForm = useForm<AdminTicketCreateValues>({
    resolver: zodResolver(adminTicketCreateSchema),
    defaultValues: { titulo: "", descricao: "", usuarioId: 0, equipamentoId: 0, prioridade: "Média" },
  });
  const editForm = useForm<AdminTicketEditValues>({
    resolver: zodResolver(adminTicketEditSchema),
    defaultValues: { titulo: "", descricao: "", status: "Aberto", prioridade: "Média" },
  });
  const editingTicket = tickets.find((ticket) => ticket.id === editingId);
  const userOptions = users.map((user) => ({ label: `${user.nome} · ${user.setor}`, value: String(user.id) }));
  const equipmentOptions = equipment.map((item) => ({ label: `${item.nome} · ${item.patrimonio}`, value: String(item.id) }));
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const filteredTickets = tickets.filter((ticket) => {
    const requester = users.find((user) => user.id === ticket.usuarioId)?.nome ?? "";
    const item = equipment.find((entry) => entry.id === ticket.equipamentoId)?.nome ?? "";
    const matchesQuery = !normalizedQuery || [ticket.titulo, requester, item, String(ticket.id)].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
    return matchesQuery && (statusFilter === "Todos" || ticket.status === statusFilter);
  });

  const handleError = (cause: unknown) => {
    setActionError(formatApiError(cause));
    if (cause instanceof ApiError && cause.status === 401) void logout();
  };

  const createTicket = createForm.handleSubmit(async (values) => {
    Keyboard.dismiss();
    setActionError("");
    try {
      const created = await request<Ticket>("/api/chamados", {
        method: "POST",
        token: session?.accessToken,
        body: values,
      });
      setShowComposer(false);
      createForm.reset({ titulo: "", descricao: "", usuarioId: 0, equipamentoId: 0, prioridade: "Média" });
      setNotice(`Chamado #${created.id} criado.`);
      refresh();
    } catch (cause) {
      handleError(cause);
    }
  });

  const saveTicket = editForm.handleSubmit(async (values) => {
    if (!editingId) return;
    Keyboard.dismiss();
    setActionError("");
    try {
      await request<Ticket>(`/api/chamados/${editingId}`, {
        method: "PATCH",
        token: session?.accessToken,
        body: { titulo: values.titulo, descricao: values.descricao, status: values.status, prioridade: values.prioridade },
      });
      setEditingId(null);
      setNotice(`Chamado #${editingId} atualizado.`);
      refresh();
    } catch (cause) {
      handleError(cause);
    }
  });

  const startEditing = (ticket: Ticket) => {
    editForm.reset({ titulo: ticket.titulo, descricao: ticket.descricao, status: ticket.status as AdminTicketEditValues["status"], prioridade: ticket.prioridade as AdminTicketEditValues["prioridade"] });
    setEditingId(ticket.id);
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>OPERAÇÃO</Text>
        <Text style={styles.title}>Todos os chamados</Text>
        <Text style={styles.subtitle}>{tickets.length} registros no sistema.</Text>
      </View>
      {loadError ? <View style={styles.errorState}><Notice message={loadError} /><AppButton title="Tentar novamente" onPress={refresh} variant="secondary" /></View> : null}
      {actionError ? <Notice message={actionError} /> : null}
      {notice ? <Notice message={notice} tone="success" /> : null}
      <AppButton title={showComposer ? "Cancelar novo chamado" : "Novo chamado"} onPress={() => { setShowComposer((open) => !open); setActionError(""); }} variant="secondary" />
      {showComposer ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Abrir chamado</Text>
          <Controller control={createForm.control} name="titulo" render={({ field }) => <FormField label="Título" value={field.value} onChangeText={field.onChange} error={createForm.formState.errors.titulo?.message} placeholder="Descreva o pedido em uma frase" />} />
          <Controller control={createForm.control} name="descricao" render={({ field }) => <FormField label="Descrição" value={field.value} onChangeText={field.onChange} error={createForm.formState.errors.descricao?.message} placeholder="Inclua contexto e impacto" multiline />} />
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Solicitante</Text>
            <Controller control={createForm.control} name="usuarioId" render={({ field }) => <SelectField value={field.value ? String(field.value) : ""} onValueChange={(value) => field.onChange(Number(value))} placeholder="Selecione uma pessoa" options={userOptions} />} />
            {createForm.formState.errors.usuarioId?.message ? <Text style={styles.error}>{createForm.formState.errors.usuarioId.message}</Text> : null}
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Equipamento</Text>
            <Controller control={createForm.control} name="equipamentoId" render={({ field }) => <SelectField value={field.value ? String(field.value) : ""} onValueChange={(value) => field.onChange(Number(value))} placeholder="Selecione um equipamento" options={equipmentOptions} />} />
            {createForm.formState.errors.equipamentoId?.message ? <Text style={styles.error}>{createForm.formState.errors.equipamentoId.message}</Text> : null}
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Prioridade</Text>
            <Controller control={createForm.control} name="prioridade" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} placeholder="Selecione a prioridade" options={priorityOptions} />} />
          </View>
          <AppButton title={createForm.formState.isSubmitting ? "Criando…" : "Criar chamado"} onPress={createTicket} disabled={createForm.formState.isSubmitting || !users.length || !equipment.length} loading={createForm.formState.isSubmitting} />
          {(!users.length || !equipment.length) && !loading ? <Text style={styles.hint}>Cadastre ao menos uma pessoa e um equipamento antes de abrir um chamado.</Text> : null}
        </View>
      ) : null}
      <FormField label="Buscar" value={query} onChangeText={setQuery} placeholder="Título, pessoa, equipamento ou número" autoCapitalize="none" />
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Filtrar por status</Text>
        <SelectField value={statusFilter} onValueChange={setStatusFilter} placeholder="Todos os status" options={statusFilterOptions} />
      </View>
      <Text style={styles.resultCount}>{filteredTickets.length} resultados</Text>
      {loading && tickets.length === 0 ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.subtitle}>Carregando chamados…</Text></View> : null}
    </View>
  );

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      data={filteredTickets}
      keyExtractor={(ticket) => String(ticket.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
      ListEmptyComponent={!loading && !loadError ? <View style={styles.empty}><Text style={styles.emptyTitle}>{tickets.length ? "Nenhum chamado encontrado" : "Nenhum chamado cadastrado"}</Text><Text style={styles.subtitle}>{tickets.length ? "Altere a busca ou o filtro de status." : "Quando houver chamados, eles aparecerão aqui."}</Text></View> : null}
      renderItem={({ item }) => (
        <AdminTicketCard ticket={item} requester={users.find((user) => user.id === item.usuarioId)} equipment={equipment.find((entry) => entry.id === item.equipamentoId)}>
          {editingId === item.id ? (
            <View style={styles.editForm}>
              <Controller control={editForm.control} name="titulo" render={({ field }) => <FormField label="Título" value={field.value} onChangeText={field.onChange} error={editForm.formState.errors.titulo?.message} />} />
              <Controller control={editForm.control} name="descricao" render={({ field }) => <FormField label="Descrição" value={field.value} onChangeText={field.onChange} error={editForm.formState.errors.descricao?.message} multiline />} />
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Status</Text>
                <Controller control={editForm.control} name="status" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} placeholder="Selecione o status" options={ticketStatusOptions} />} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Prioridade</Text>
                <Controller control={editForm.control} name="prioridade" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} placeholder="Selecione a prioridade" options={priorityOptions} />} />
              </View>
              <AppButton title={editForm.formState.isSubmitting ? "Salvando…" : "Salvar alterações"} onPress={saveTicket} loading={editForm.formState.isSubmitting} />
              <AppButton title="Cancelar" onPress={() => setEditingId(null)} variant="quiet" />
            </View>
          ) : (
            <AppButton title="Editar chamado" onPress={() => startEditing(item)} variant="secondary" />
          )}
        </AdminTicketCard>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 30, gap: 12 },
  header: { gap: 13, paddingBottom: 2 },
  intro: { gap: 5 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 25, lineHeight: 32, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  formCard: { padding: 15, gap: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18 },
  formTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  fieldGroup: { gap: 7 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  error: { color: colors.danger, fontSize: 12 },
  hint: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  resultCount: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  errorState: { gap: 8 },
  loading: { alignItems: "center", gap: 9, paddingVertical: 18 },
  empty: { marginTop: 12, padding: 18, gap: 5, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line },
  emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  editForm: { gap: 12, paddingTop: 4 },
});
