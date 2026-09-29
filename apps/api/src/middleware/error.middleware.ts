import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";

export const notFoundMiddleware: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Rota não encontrada" });
};

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ message: "Dados inválidos", issues: error.issues });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Registro não encontrado" });
      return;
    }

    if (error.code === "P2002" || error.code === "P2003") {
      res.status(409).json({ message: "O registro conflita com dados existentes" });
      return;
    }
  }

  console.error(error);
  res.status(500).json({ message: "Erro interno do servidor" });
};
