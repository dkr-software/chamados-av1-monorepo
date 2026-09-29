import type { PrismaClient } from "../generated/prisma/client";
import type { z } from "zod";
import type {
  atualizarChamadoSchema,
  criarChamadoSchema,
} from "../models/validations/chamado.validation";

export class ChamadoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll() {
    return this.prisma.chamado.findMany();
  }

  findById(id: number) {
    return this.prisma.chamado.findUnique({ where: { id } });
  }

  findByUsuarioId(usuarioId: number) {
    return this.prisma.chamado.findMany({ where: { usuarioId } });
  }

  create(data: z.infer<typeof criarChamadoSchema>) {
    return this.prisma.chamado.create({ data });
  }

  update(id: number, data: z.infer<typeof atualizarChamadoSchema>) {
    return this.prisma.chamado.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.chamado.delete({ where: { id } });
  }
}
