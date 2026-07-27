import type { NextFunction, Request, Response } from "express";
import { verifyToken, type JwtPayload } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import type { UserRole } from "../types";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Token de acesso ausente");
  }

  const token = header.slice("Bearer ".length);
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    throw ApiError.unauthorized("Token invalido ou expirado");
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      throw ApiError.unauthorized();
    }
    if (!roles.includes(req.auth.role)) {
      throw ApiError.forbidden("Perfil sem permissao para este recurso");
    }
    next();
  };
}
