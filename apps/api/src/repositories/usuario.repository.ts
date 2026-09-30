import type { PrismaClient } from "../generated/prisma/client";
import type { z } from "zod";
import type {
  atualizarUsuarioSchema,
  criarUsuarioSchema,
} from "../models/validations/usuario.validation";

const usuarioPublicSelect = {
  id: true,
  nome: true,
  email: true,
  setor: true,
  telefone: true,
} as const;

type NovoUsuario = Omit<z.infer<typeof criarUsuarioSchema>, "senha"> & { senhaHash: string };

export class UsuarioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll() {
    return this.prisma.usuario.findMany({ select: usuarioPublicSelect });
  }

  findById(id: number) {
    return this.prisma.usuario.findUnique({ where: { id }, select: usuarioPublicSelect });
  }

  findByEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email }, select: usuarioPublicSelect });
  }

  findLoginByEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  create(data: NovoUsuario) {
    return this.prisma.usuario.create({ data, select: usuarioPublicSelect });
  }

  update(id: number, data: z.infer<typeof atualizarUsuarioSchema>) {
    return this.prisma.usuario.update({ where: { id }, data, select: usuarioPublicSelect });
  }

  delete(id: number) {
    return this.prisma.usuario.delete({ where: { id }, select: { id: true } });
  }
}
