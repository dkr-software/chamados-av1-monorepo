import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { administradoresRouter } from "./administradores.routes";
import { authRouter } from "./auth.routes";
import { chamadosRouter } from "./chamados.routes";
import { equipamentosRouter } from "./equipamentos.routes";
import { usuariosRouter } from "./usuarios.routes";

const router = Router();
const protectedRouter = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
router.use("/auth", authRouter);

protectedRouter.get("/", (req, res) => {
  res.json({ status: "authenticated", adminId: req.auth?.adminId });
});
protectedRouter.use("/administradores", administradoresRouter);
protectedRouter.use("/chamados", chamadosRouter);
protectedRouter.use("/equipamentos", equipamentosRouter);
protectedRouter.use("/usuarios", usuariosRouter);

router.use("/api", authMiddleware, protectedRouter);

export default router;
