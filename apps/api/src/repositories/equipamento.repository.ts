import type { PrismaClient } from "../generated/prisma/client";
import type { z } from "zod";
import type {
  atualizarEquipamentoSchema,
  criarEquipamentoSchema,
} from "../models/validations/equipamento.validation";

export class EquipamentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll() {
    return this.prisma.equipamento.findMany();
  }

  findById(id: number) {
    return this.prisma.equipamento.findUnique({ where: { id } });
  }

  create(data: z.infer<typeof criarEquipamentoSchema>) {
    return this.prisma.equipamento.create({ data });
  }

  update(id: number, data: z.infer<typeof atualizarEquipamentoSchema>) {
    return this.prisma.equipamento.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.equipamento.delete({ where: { id } });
  }
}
