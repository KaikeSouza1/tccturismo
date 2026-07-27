import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError";

const MULTER_ERROR_MESSAGES: Partial<Record<string, string>> = {
  LIMIT_FILE_SIZE: "Imagem muito grande. O limite e 4MB.",
  LIMIT_UNEXPECTED_FILE: "Campo de arquivo inesperado.",
};

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Rota nao encontrada: ${req.method} ${req.path}` });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Dados invalidos",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof MulterError) {
    res.status(400).json({ error: MULTER_ERROR_MESSAGES[err.code] ?? err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
}
