import type { RequestHandler } from "express";
import { jwtVerify } from "jose";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        id: number;
        role: "ADMIN" | "USER";
        adminId?: number;
        userId?: number;
      };
    }
  }
}

export const authMiddleware: RequestHandler = async (req, res, next) => {
  const match = req.get("authorization")?.match(/^Bearer\s+(.+)$/i);
  const secret = process.env.JWT_SECRET;

  if (!match) {
    res.status(401).json({ message: "Bearer token ausente ou inválido" });
    return;
  }

  if (!secret || new TextEncoder().encode(secret).length < 32) {
    res.status(503).json({ message: "Autenticação não configurada" });
    return;
  }

  try {
    const { payload } = await jwtVerify(
      match[1],
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"], requiredClaims: ["exp", "sub"] },
    );
    const id = Number(payload.sub);
    const role = payload.role;

    if (!Number.isSafeInteger(id) || id <= 0 || (role !== "ADMIN" && role !== "USER")) {
      res.status(401).json({ message: "Token inválido" });
      return;
    }

    // As rotas usam a identidade validada do token, nunca um ID enviado no corpo.
    req.auth = role === "ADMIN"
      ? { id, adminId: id, role }
      : { id, userId: id, role };
    next();
  } catch {
    res.status(401).json({ message: "Token inválido ou expirado" });
  }
};

export const adminOnly: RequestHandler = (req, res, next) => {
  if (req.auth?.role !== "ADMIN") {
    res.status(403).json({ message: "Acesso permitido somente a administradores" });
    return;
  }

  next();
};

export const userOnly: RequestHandler = (req, res, next) => {
  if (req.auth?.role !== "USER") {
    res.status(403).json({ message: "Acesso permitido somente a usuários" });
    return;
  }

  next();
};
