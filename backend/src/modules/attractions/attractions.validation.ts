import { z } from "zod";

export const createAttractionSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(60).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(10).max(2000).optional(),
});

export const updateAttractionSchema = createAttractionSchema.partial().extend({
  active: z.boolean().optional(),
});
