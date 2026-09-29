import { Router } from "express";
import { repositories } from "../container";
import {
  atualizarChamadoSchema,
  buscarChamadoSchema,
  criarChamadoSchema,
} from "../models/validations/chamado.validation";

export const chamadosRouter = Router();

chamadosRouter.get("/", async (_req, res) => {
  res.json(await repositories.chamado.findAll());
});

chamadosRouter.get("/:id", async (req, res) => {
  const { id } = buscarChamadoSchema.parse({ id: req.params.id });
  const chamado = await repositories.chamado.findById(id);
  if (!chamado) {
    res.status(404).json({ message: "Chamado não encontrado" });
    return;
  }
  res.json(chamado);
});

chamadosRouter.post("/", async (req, res) => {
  const chamado = await repositories.chamado.create(criarChamadoSchema.parse(req.body));
  res.status(201).json(chamado);
});

chamadosRouter.patch("/:id", async (req, res) => {
  const { id } = buscarChamadoSchema.parse({ id: req.params.id });
  const data = atualizarChamadoSchema.parse(req.body);
  res.json(await repositories.chamado.update(id, data));
});

chamadosRouter.delete("/:id", async (req, res) => {
  const { id } = buscarChamadoSchema.parse({ id: req.params.id });
  await repositories.chamado.delete(id);
  res.status(204).end();
});
