import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  sub: string;
  role: "tourist" | "admin" | "platform_admin";
  organizationId: string | null;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.jwt.expiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwt.secret, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.secret) as JwtPayload;
}
