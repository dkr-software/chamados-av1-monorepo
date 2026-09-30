import { z } from "zod";
import { TipoEquipamento } from "../equipamento.model";

const equipamentoFields = {
  nome: z.string().trim().min(1, "O nome é obrigatório"),
  patrimonio: z.string().trim().min(1, "O patrimônio é obrigatório"),
  tipo: z.enum(TipoEquipamento, {
    error: "O tipo de equipamento é obrigatório",
  }),
  descricao: z.string().trim().min(1, "A descrição é obrigatória").optional(),
  dataCriacao: z.coerce.date().optional(),
};

export const criarEquipamentoSchema = z.object(equipamentoFields);
export const atualizarEquipamentoSchema = z.object(equipamentoFields).partial();

export const buscarEquipamentoSchema = z.object({
  id: z.coerce.number().int().positive("O ID do equipamento deve ser um número positivo"),
});
