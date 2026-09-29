import { Buffer } from "node:buffer";
import { z } from "zod";

const passwordWithinBcryptLimit = (password: string) => Buffer.byteLength(password, "utf8") <= 72;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
  senha: z
    .string()
    .min(1, "A senha é obrigatória")
    .refine(passwordWithinBcryptLimit, "A senha deve ter no máximo 72 bytes"),
});

export const novaSenhaSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .refine(passwordWithinBcryptLimit, "A senha deve ter no máximo 72 bytes");
