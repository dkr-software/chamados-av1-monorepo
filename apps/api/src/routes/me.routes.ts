import { Router } from "express";
import { repositories } from "../container";
import { criarChamadoUsuarioSchema } from "../models/validations/chamado.validation";

export const meRouter = Router();

meRouter.get("/equipamentos", async (_req, res) => {
  res.json(await repositories.equipamento.findAll());
});

meRouter.get("/chamados", async (req, res) => {
  const userId = req.auth?.userId;

  if (!userId) {
    res.status(403).json({ message: "Acesso permitido somente a usuários" });
    return;
  }

  res.json(await repositories.chamado.findByUsuarioId(userId));
});

meRouter.post("/chamados", async (req, res) => {
  const userId = req.auth?.userId;

  if (!userId) {
    res.status(403).json({ message: "Acesso permitido somente a usuários" });
    return;
  }

  // O vínculo vem do token, então o cliente não consegue abrir chamados em nome alheio.
  const data = criarChamadoUsuarioSchema.parse(req.body);
  const chamado = await repositories.chamado.create({ ...data, usuarioId: userId });
  res.status(201).json(chamado);
});