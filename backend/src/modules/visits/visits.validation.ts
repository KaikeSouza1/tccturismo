import { z } from "zod";

export const registerVisitSchema = z.object({
  qrToken: z.string().trim().min(4).max(64),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  clientRecordedAt: z.string().datetime().optional(),
});

export const listVisitsQuerySchema = z.object({
  attractionId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
});
