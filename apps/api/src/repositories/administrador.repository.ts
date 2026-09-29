import type { PrismaClient } from "../generated/prisma/client";
import type { z } from "zod";
import type {
  atualizarAdministradorSchema,
  criarAdministradorSchema,
} from "../models/validations/administrador.validation";

const administradorPublicSelect = {
  id: true,
  nome: true,
  email: true,
  ativo: true,
  dataCriacao: true,
  dataAtualizacao: true,
} as const;

type NovoAdministrador = Omit<z.infer<typeof criarAdministradorSchema>, "senha"> & {
  senhaHash: string;
};
type AtualizacaoAdministrador = Omit<
  z.infer<typeof atualizarAdministradorSchema>,
  "senha"
> & { senhaHash?: string };

export class AdministradorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll() {
    return this.prisma.administrador.findMany({ select: administradorPublicSelect });
  }

  findById(id: number) {
    return this.prisma.administrador.findUnique({
      where: { id },
      select: administradorPublicSelect,
    });
  }

  findLoginByEmail(email: string) {
    return this.prisma.administrador.findUnique({ where: { email } });
  }

  countActive() {
    return this.prisma.administrador.count({ where: { ativo: true } });
  }

  create(data: NovoAdministrador) {
    return this.prisma.administrador.create({
      data,
      select: administradorPublicSelect,
    });
  }

  update(id: number, data: AtualizacaoAdministrador) {
    return this.prisma.administrador.update({
      where: { id },
      data,
      select: administradorPublicSelect,
    });
  }

  delete(id: number) {
    return this.prisma.administrador.delete({
      where: { id },
      select: { id: true },
    });
  }
}
