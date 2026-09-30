import { z } from "zod";
import { sectors } from "./sectors";

const priorities = ["Baixa", "Média", "Alta", "Crítica"] as const;
const equipmentTypes = ["Computador", "Impressora", "Scanner", "Monitor", "Celular"] as const;
const ticketStatuses = ["Aberto", "Em atendimento", "Aguardando retorno", "Resolvido"] as const;

export function createAuthFormSchema(isRegistration: boolean) {
  return z.object({
    name: z.string(),
    email: z.string().trim().min(1, "Informe seu e-mail.").email("Informe um e-mail válido."),
    sector: z.string(),
    phone: z.string(),
    password: z.string(),
  }).superRefine((values, context) => {
    if (isRegistration && !values.name.trim()) {
      context.addIssue({ code: "custom", path: ["name"], message: "Informe seu nome completo." });
    }
    if (isRegistration && !sectors.includes(values.sector as typeof sectors[number])) {
      context.addIssue({ code: "custom", path: ["sector"], message: "Selecione um setor." });
    }
    if (isRegistration && values.phone.trim().length < 8) {
      context.addIssue({ code: "custom", path: ["phone"], message: "Informe um telefone válido." });
    } else if (isRegistration && values.phone.trim().length > 20) {
      context.addIssue({ code: "custom", path: ["phone"], message: "O telefone deve ter no máximo 20 caracteres." });
    }
    if (!values.password) {
      context.addIssue({ code: "custom", path: ["password"], message: "Informe sua senha." });
    } else {
      if (isRegistration && values.password.length < 8) {
        context.addIssue({ code: "custom", path: ["password"], message: "A senha deve ter pelo menos 8 caracteres." });
      }
      if (new TextEncoder().encode(values.password).length > 72) {
        context.addIssue({ code: "custom", path: ["password"], message: "A senha deve ter no máximo 72 bytes." });
      }
    }
  });
}

export const adminTicketFormSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do chamado."),
  description: z.string().trim().min(1, "Informe a descrição do chamado."),
  userId: z.number().int().positive("Selecione uma pessoa."),
  equipmentId: z.number().int().positive("Selecione um equipamento."),
  priority: z.enum(priorities),
});

export const userAccountFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome completo."),
  email: z.string().trim().email("Informe um e-mail válido."),
  sector: z.string().refine((sector) => sectors.includes(sector as typeof sectors[number]), "Selecione um setor."),
  phone: z.string().trim().min(8, "Informe um telefone válido.").max(20, "O telefone deve ter no máximo 20 caracteres."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.")
    .refine((password) => new TextEncoder().encode(password).length <= 72, "A senha deve ter no máximo 72 bytes."),
});

export const userProfileFormSchema = userAccountFormSchema.omit({ password: true });

export const equipmentFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do equipamento."),
  asset: z.string().trim().min(1, "Informe o patrimônio."),
  kind: z.string().refine((kind) => equipmentTypes.includes(kind as typeof equipmentTypes[number]), "Selecione um tipo de equipamento."),
});

export const userTicketFormSchema = z.object({
  title: z.string().trim().min(1, "Informe o assunto."),
  description: z.string().trim().min(1, "Informe a descrição."),
  equipmentId: z.string().refine((id) => Number.isInteger(Number(id)) && Number(id) > 0, "Selecione um equipamento."),
});

export const ticketEditFormSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do chamado."),
  description: z.string().trim().min(1, "Informe a descrição do chamado."),
  status: z.enum(ticketStatuses),
  priority: z.enum(priorities),
});
