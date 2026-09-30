import { Router } from "express";
import { SignJWT } from "jose";
import type { LoginResponse } from "../models/authentication.model";
import { loginSchema } from "../models/validations/authentication.validation";
import { criarUsuarioSchema } from "../models/validations/usuario.validation";
import { repositories } from "../container";
import { hashPassword, verifyPassword } from "../lib/password";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, senha } = loginSchema.parse(req.body);
  const administrador = await repositories.administrador.findLoginByEmail(email);
  const usuario = administrador ? null : await repositories.usuario.findLoginByEmail(email);
  const role = administrador ? "ADMIN" : usuario?.senhaHash ? "USER" : null;
  const senhaValida = administrador
    ? await verifyPassword(senha, administrador.senhaHash)
    : usuario?.senhaHash
      ? await verifyPassword(senha, usuario.senhaHash)
      : false;

  if ((!administrador && !usuario) || (administrador && !administrador.ativo) || !senhaValida || !role) {
    res.status(401).json({ message: "E-mail ou senha inválidos" });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    res.status(503).json({ message: "Autenticação não configurada" });
    return;
  }

  const expiresIn = 3600;
  const accountId = administrador?.id ?? usuario?.id;
  // O papel acompanha o token para que cada rota aplique as permissões certas.
  const accessToken = await new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(accountId))
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(new TextEncoder().encode(secret));

  const response: LoginResponse = administrador
    ? {
        accessToken,
        tokenType: "Bearer",
        expiresIn,
        role: "ADMIN",
        administrador: {
          id: administrador.id,
          nome: administrador.nome,
          email: administrador.email,
        },
      }
    : {
        accessToken,
        tokenType: "Bearer",
        expiresIn,
        role: "USER",
        usuario: {
          id: usuario!.id,
          nome: usuario!.nome,
          email: usuario!.email,
        },
      };

  res.json(response);
});

authRouter.post("/register", async (req, res) => {
  const { senha, ...data } = criarUsuarioSchema.parse(req.body);
  const email = loginSchema.shape.email.parse(data.email);
  const secret = process.env.JWT_SECRET;

  if (!secret || new TextEncoder().encode(secret).length < 32) {
    res.status(503).json({ message: "Autenticação não configurada" });
    return;
  }

  const [existingUser, existingAdministrator] = await Promise.all([
    repositories.usuario.findByEmail(email),
    repositories.administrador.findLoginByEmail(email),
  ]);

  if (existingUser || existingAdministrator) {
    res.status(409).json({ message: "Já existe uma conta com este e-mail" });
    return;
  }

  const usuario = await repositories.usuario.create({
    ...data,
    email,
    senhaHash: await hashPassword(senha),
  });
  const expiresIn = 3600;
  const accessToken = await new SignJWT({ role: "USER" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(usuario.id))
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(new TextEncoder().encode(secret));

  res.status(201).json({
    accessToken,
    tokenType: "Bearer",
    expiresIn,
    role: "USER",
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
  } satisfies LoginResponse);
});
