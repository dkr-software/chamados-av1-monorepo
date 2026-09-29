import { Router } from "express";
import { repositories } from "../container";
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
  const data = criarUsuarioSchema.parse(req.body);
  const usuario = await repositories.usuario.create(data);
  res.status(201).json(usuario);
});

usuariosRouter.patch("/:id", async (req, res) => {
  const { id } = buscarUsuarioSchema.parse({ id: req.params.id });
  const data = atualizarUsuarioSchema.parse(req.body);
  const usuario = await repositories.usuario.update(id, data);
  res.json(usuario);
});

usuariosRouter.delete("/:id", async (req, res) => {
  const { id } = buscarUsuarioSchema.parse({ id: req.params.id });
  await repositories.usuario.delete(id);
  res.status(204).end();
});
