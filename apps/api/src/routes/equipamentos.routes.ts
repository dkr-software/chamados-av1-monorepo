import { Router } from "express";
import { repositories } from "../container";
import {
  atualizarEquipamentoSchema,
  buscarEquipamentoSchema,
  criarEquipamentoSchema,
} from "../models/validations/equipamento.validation";

export const equipamentosRouter = Router();

equipamentosRouter.get("/", async (_req, res) => {
  res.json(await repositories.equipamento.findAll());
});

equipamentosRouter.get("/:id", async (req, res) => {
  const { id } = buscarEquipamentoSchema.parse({ id: req.params.id });
  const equipamento = await repositories.equipamento.findById(id);
  if (!equipamento) {
    res.status(404).json({ message: "Equipamento não encontrado" });
    return;
  }
  res.json(equipamento);
});

equipamentosRouter.post("/", async (req, res) => {
  const equipamento = await repositories.equipamento.create(criarEquipamentoSchema.parse(req.body));
  res.status(201).json(equipamento);
});

equipamentosRouter.patch("/:id", async (req, res) => {
  const { id } = buscarEquipamentoSchema.parse({ id: req.params.id });
  const data = atualizarEquipamentoSchema.parse(req.body);
  res.json(await repositories.equipamento.update(id, data));
});

equipamentosRouter.delete("/:id", async (req, res) => {
  const { id } = buscarEquipamentoSchema.parse({ id: req.params.id });
  await repositories.equipamento.delete(id);
  res.status(204).end();
});
