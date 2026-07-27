import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(150),
  email: z.string().trim().email("E-mail invalido").max(180),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail invalido"),
  password: z.string().min(1, "Senha obrigatoria"),
});
