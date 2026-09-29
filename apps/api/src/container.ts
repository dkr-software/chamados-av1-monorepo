import { prisma } from "./lib/prisma";
import {
  AdministradorRepository,
  ChamadoRepository,
  EquipamentoRepository,
  UsuarioRepository,
} from "./repositories";

export const repositories = {
  administrador: new AdministradorRepository(prisma),
  chamado: new ChamadoRepository(prisma),
  equipamento: new EquipamentoRepository(prisma),
  usuario: new UsuarioRepository(prisma),
};
