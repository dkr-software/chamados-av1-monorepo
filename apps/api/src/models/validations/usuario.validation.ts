import { z } from "zod";

const usuarioFields = {
  nome: z.string().trim().min(1, "O nome é obrigatório"),
  email: z.string().trim().email("Informe um e-mail válido"),
  setor: z.string().trim().min(1, "O setor é obrigatório"),
  telefone: z.string().trim().min(8, "Informe um telefone válido").max(20),
};

export const criarUsuarioSchema = z.object(usuarioFields);
export const atualizarUsuarioSchema = z.object(usuarioFields).partial();

export const buscarUsuarioSchema = z.object({
  id: z.coerce.number().int().positive("O ID do usuário deve ser um número positivo"),
});

export const deletarUsuarioSchema = buscarUsuarioSchema;
