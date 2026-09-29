import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi";
import router from "./routes/index";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middleware/error.middleware";

export const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.get("/openapi.json", (_req, res) => res.json(openApiDocument));
server.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
server.use(router);
server.use(notFoundMiddleware);
server.use(errorMiddleware);

const port = Number(process.env.PORT ?? 3000);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
