import "dotenv/config";
import { hashPassword } from "../src/lib/password";
import { prisma } from "../src/lib/prisma";
import { criarAdministradorSchema } from "../src/models/validations/administrador.validation";

try {
  const [nome, email, senha] = [
    process.env.ADMIN_NOME,
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_SENHA,
  ];

  const dados = criarAdministradorSchema.parse({ nome, email, senha });

  if (await prisma.administrador.count()) {
    console.log("Já existe um administrador; nenhuma conta foi alterada.");
  } else {
    await prisma.administrador.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senhaHash: await hashPassword(dados.senha),
      },
    });
    console.log("Administrador inicial criado.");
  }
} finally {
  await prisma.$disconnect();
}
