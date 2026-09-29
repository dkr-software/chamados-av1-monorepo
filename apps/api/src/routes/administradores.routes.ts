import { Router } from "express";
import { repositories } from "../container";
import { hashPassword } from "../lib/password";
import {
  atualizarAdministradorSchema,
  buscarAdministradorSchema,
  criarAdministradorSchema,
} from "../models/validations/administrador.validation";

export const administradoresRouter = Router();

administradoresRouter.get("/", async (_req, res) => {
  res.json(await repositories.administrador.findAll());
});

administradoresRouter.get("/:id", async (req, res) => {
  const { id } = buscarAdministradorSchema.parse({ id: req.params.id });
  const administrador = await repositories.administrador.findById(id);

  if (!administrador) {
    res.status(404).json({ message: "Administrador não encontrado" });
    return;
  }

  res.json(administrador);
});

administradoresRouter.post("/", async (req, res) => {
  const { senha, ...data } = criarAdministradorSchema.parse(req.body);
  const administrador = await repositories.administrador.create({
    ...data,
    senhaHash: await hashPassword(senha),
  });
  res.status(201).json(administrador);
});

administradoresRouter.patch("/:id", async (req, res) => {
  const { id } = buscarAdministradorSchema.parse({ id: req.params.id });
  const { senha, ...data } = atualizarAdministradorSchema.parse(req.body);
  const atual = await repositories.administrador.findById(id);

  if (!atual) {
    res.status(404).json({ message: "Administrador não encontrado" });
    return;
  }

  if (id === req.auth?.adminId && data.ativo === false) {
    res.status(409).json({ message: "Não é possível desativar a própria conta" });
    return;
  }

  if (atual.ativo && data.ativo === false && await repositories.administrador.countActive() <= 1) {
    res.status(409).json({ message: "Mantenha ao menos um administrador ativo" });
    return;
  }

  const administrador = await repositories.administrador.update(id, {
    ...data,
    ...(senha ? { senhaHash: await hashPassword(senha) } : {}),
  });
  res.json(administrador);
});

administradoresRouter.delete("/:id", async (req, res) => {
  const { id } = buscarAdministradorSchema.parse({ id: req.params.id });
  const administrador = await repositories.administrador.findById(id);

  if (!administrador) {
    res.status(404).json({ message: "Administrador não encontrado" });
    return;
  }

  if (id === req.auth?.adminId) {
    res.status(409).json({ message: "Não é possível excluir a própria conta" });
    return;
  }

  if (administrador.ativo && await repositories.administrador.countActive() <= 1) {
    res.status(409).json({ message: "Mantenha ao menos um administrador ativo" });
    return;
  }

  await repositories.administrador.delete(id);
  res.status(204).end();
});
