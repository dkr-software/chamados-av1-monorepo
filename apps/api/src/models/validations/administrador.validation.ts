import { z } from "zod";
import { novaSenhaSchema } from "./authentication.validation";

const administradorFields = {
  nome: z.string().trim().min(1, "O nome é obrigatório"),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
  senha: novaSenhaSchema,
  ativo: z.boolean(),
};

export const criarAdministradorSchema = z.object(administradorFields).pick({
  nome: true,
  email: true,
  senha: true,
});

export const atualizarAdministradorSchema = z
  .object(administradorFields)
  .omit({ senha: true })
  .extend({ senha: administradorFields.senha.optional() })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Informe ao menos um campo para atualizar");

export const buscarAdministradorSchema = z.object({
  id: z.coerce.number().int().positive("O ID deve ser um número positivo"),
});
