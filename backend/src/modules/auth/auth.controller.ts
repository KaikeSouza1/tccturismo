import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.validation";
import { getUserProfile, loginUser, registerUser } from "./auth.service";
import { ApiError } from "../../utils/ApiError";

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await registerUser(input);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);
  res.json(result);
}

export async function me(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  const user = await getUserProfile(req.auth.sub);
  res.json(user);
}
