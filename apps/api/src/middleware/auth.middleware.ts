import type { RequestHandler } from "express";
import { jwtVerify } from "jose";

declare global {
  namespace Express {
    interface Request {
      auth?: { adminId: number; role: "ADMIN" };
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
    const adminId = Number(payload.sub);

    if (!Number.isSafeInteger(adminId) || adminId <= 0 || payload.role !== "ADMIN") {
      res.status(401).json({ message: "Token inválido" });
      return;
    }

    req.auth = { adminId, role: "ADMIN" };
    next();
  } catch {
    res.status(401).json({ message: "Token inválido ou expirado" });
  }
};
