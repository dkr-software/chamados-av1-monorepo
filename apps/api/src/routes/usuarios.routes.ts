import { Router } from "express";
import { repositories } from "../container";
import { hashPassword } from "../lib/password";
import { loginSchema } from "../models/validations/authentication.validation";
import {
  atualizarUsuarioSchema,
  buscarUsuarioSchema,
  criarUsuarioSchema,
} from "../models/validations/usuario.validation";

export const usuariosRouter = Router();

usuariosRouter.get("/", async (_req, res) => {
  const usuarios = await repositories.usuario.findAll();
  res.json(usuarios);
});

usuariosRouter.get("/:id", async (req, res) => {
  const { id } = buscarUsuarioSchema.parse({ id: req.params.id });
  const usuario = await repositories.usuario.findById(id);

  if (!usuario) {
    res.status(404).json({ message: "Usuário não encontrado" });
    return;
  }

  res.json(usuario);
});

usuariosRouter.post("/", async (req, res) => {
  const { senha, ...data } = criarUsuarioSchema.parse(req.body);
  const email = loginSchema.shape.email.parse(data.email);
  const [existingUser, existingAdministrator] = await Promise.all([
    repositories.usuario.findByEmail(email),
    repositories.administrador.findLoginByEmail(email),
  ]);

  if (existingUser || existingAdministrator) {
    res.status(409).json({ message: "Já existe uma conta com este e-mail" });
    return;
  }

  // A senha em texto puro só é usada para gerar o hash; a resposta nunca inclui o hash.
  const usuario = await repositories.usuario.create({
    ...data,
    email,
    senhaHash: await hashPassword(senha),
  });
  res.status(201).json(usuario);
});

usuariosRouter.patch("/:id", async (req, res) => {
  const { id } = buscarUsuarioSchema.parse({ id: req.params.id });
  const data = atualizarUsuarioSchema.parse(req.body);

  if (data.email) {
    const [existingUser, existingAdministrator] = await Promise.all([
      repositories.usuario.findByEmail(data.email),
      repositories.administrador.findLoginByEmail(data.email),
    ]);

    if (existingAdministrator || (existingUser && existingUser.id !== id)) {
      res.status(409).json({ message: "Já existe uma conta com este e-mail" });
      return;
    }
  }

  const usuario = await repositories.usuario.update(id, data);
  res.json(usuario);
});

usuariosRouter.delete("/:id", async (req, res) => {
  const { id } = buscarUsuarioSchema.parse({ id: req.params.id });
  await repositories.usuario.delete(id);
  res.status(204).end();
});
