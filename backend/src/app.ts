import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { attractionsRouter } from "./modules/attractions/attractions.routes";
import { visitsRouter } from "./modules/visits/visits.routes";
import { achievementsRouter } from "./modules/achievements/achievements.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { organizationsRouter } from "./modules/organizations/organizations.routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

export const app = express();

// API consumida por origens diferentes (app mobile e painel admin rodam em
// portas/dominios distintos do backend), entao imagens e outras respostas
// precisam poder ser embutidas cross-origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/attractions", attractionsRouter);
app.use("/api/visits", visitsRouter);
app.use("/api/achievements", achievementsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/organizations", organizationsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
