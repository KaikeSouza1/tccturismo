import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(150),
  adminName: z.string().trim().min(2).max(150),
  adminEmail: z.string().trim().email().max(180),
  adminPassword: z.string().min(6).max(100),
});
