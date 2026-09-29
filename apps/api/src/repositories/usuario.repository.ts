import type { PrismaClient } from "../generated/prisma/client";
import type { z } from "zod";
import type {
  atualizarUsuarioSchema,
  criarUsuarioSchema,
} from "../models/validations/usuario.validation";

export class UsuarioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll() {
    return this.prisma.usuario.findMany();
  }

  findById(id: number) {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  create(data: z.infer<typeof criarUsuarioSchema>) {
    return this.prisma.usuario.create({ data });
  }

  update(id: number, data: z.infer<typeof atualizarUsuarioSchema>) {
    return this.prisma.usuario.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.usuario.delete({ where: { id } });
  }
}
