import { z } from "zod";

const chamadoFields = {
  titulo: z.string().trim().min(1, "O título é obrigatório"),
  descricao: z.string().trim().min(1, "A descrição é obrigatória"),
  prioridade: z.enum(["Baixa", "Média", "Alta"]),
  status: z.enum(["Aberto", "Em Andamento", "Fechado"]),
  equipamentoId: z.number().int().positive("O ID do equipamento deve ser um número positivo"),
  usuarioId: z.number().int().positive("O ID do usuário deve ser um número positivo"),
};

const chamadoSchema = z.object(chamadoFields);

export const criarChamadoSchema = chamadoSchema.pick({
  titulo: true,
  descricao: true,
  equipamentoId: true,
  usuarioId: true,
});

export const atualizarChamadoSchema = chamadoSchema.partial();

export const buscarChamadoSchema = z.object({
  id: z.coerce.number().int().positive("O ID do chamado deve ser um número positivo"),
});

export const deletarChamadoSchema = buscarChamadoSchema;
