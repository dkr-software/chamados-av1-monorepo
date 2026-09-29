import { Router } from "express";
import { SignJWT } from "jose";
import type { LoginResponse } from "../models/authentication.model";
import { loginSchema } from "../models/validations/authentication.validation";
import { repositories } from "../container";
import { verifyPassword } from "../lib/password";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, senha } = loginSchema.parse(req.body);
  const administrador = await repositories.administrador.findLoginByEmail(email);
  const senhaValida = administrador ? await verifyPassword(senha, administrador.senhaHash) : false;

  if (!administrador || !administrador.ativo || !senhaValida) {
    res.status(401).json({ message: "E-mail ou senha inválidos" });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    res.status(503).json({ message: "Autenticação não configurada" });
    return;
  }

  const expiresIn = 3600;
  const accessToken = await new SignJWT({ role: "ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(administrador.id))
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));

  const response: LoginResponse = {
    accessToken,
    tokenType: "Bearer",
    expiresIn,
    administrador: {
      id: administrador.id,
      nome: administrador.nome,
      email: administrador.email,
    },
  };

  res.json(response);
});
