import { z } from "zod";

export const sectors = ["Financeiro", "Operações", "Recursos Humanos", "Comercial"] as const;
export const priorities = ["Baixa", "Média", "Alta", "Crítica"] as const;
export const ticketStatuses = ["Aberto", "Em atendimento", "Aguardando retorno", "Resolvido"] as const;
export const equipmentTypes = ["Computador", "Impressora", "Scanner", "Monitor", "Celular"] as const;

function isWithinBcryptLimit(value: string) {
  return new TextEncoder().encode(value).length <= 72;
}

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe sua senha.").refine(isWithinBcryptLimit, "A senha deve ter no máximo 72 bytes."),
});

export const registrationSchema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome completo."),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  setor: z.string().refine((value) => sectors.includes(value as typeof sectors[number]), "Selecione seu setor."),
  telefone: z.string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 10 || value.length === 11, "Informe um telefone válido."),
  senha: z.string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .refine(isWithinBcryptLimit, "A senha deve ter no máximo 72 bytes."),
});

export const ticketSchema = z.object({
  titulo: z.string().trim().min(1, "Informe o assunto do chamado."),
  equipamentoId: z.string().min(1, "Selecione um equipamento.").refine(
    (value) => Number.isInteger(Number(value)) && Number(value) > 0,
    "Selecione um equipamento válido.",
  ),
  descricao: z.string().trim().min(1, "Descreva o que está acontecendo."),
});

export const adminTicketCreateSchema = z.object({
  titulo: z.string().trim().min(1, "Informe o título do chamado."),
  descricao: z.string().trim().min(1, "Informe a descrição do chamado."),
  usuarioId: z.number().int().positive("Selecione uma pessoa solicitante."),
  equipamentoId: z.number().int().positive("Selecione um equipamento."),
  prioridade: z.enum(priorities),
});

export const adminTicketEditSchema = z.object({
  titulo: z.string().trim().min(1, "Informe o título do chamado."),
  descricao: z.string().trim().min(1, "Informe a descrição do chamado."),
  status: z.enum(ticketStatuses),
  prioridade: z.enum(priorities),
});

export const adminUserProfileSchema = registrationSchema.omit({ senha: true });

export const adminEquipmentSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do equipamento."),
  patrimonio: z.string().trim().min(1, "Informe o patrimônio."),
  tipo: z.string().refine((value) => equipmentTypes.includes(value as typeof equipmentTypes[number]), "Selecione um tipo de equipamento."),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegistrationValues = z.infer<typeof registrationSchema>;
export type TicketValues = z.infer<typeof ticketSchema>;
export type AdminTicketCreateValues = z.infer<typeof adminTicketCreateSchema>;
export type AdminTicketEditValues = z.infer<typeof adminTicketEditSchema>;
export type AdminUserProfileValues = z.infer<typeof adminUserProfileSchema>;
export type AdminEquipmentValues = z.infer<typeof adminEquipmentSchema>;
