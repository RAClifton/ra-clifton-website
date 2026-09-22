import { z } from "zod";

export const insightCreateSchema = z.object({
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  title: z.string().trim().min(5).max(200),
  body: z.string().trim().min(50),
  author: z.string().trim().min(2).max(120),
  image_url: z.string().trim().max(500).optional(),
});

export const insightUpdateSchema = insightCreateSchema.partial();

export const insightPublishSchema = z.object({
  status: z.enum(["draft", "published"]),
});

export type InsightInput = z.infer<typeof insightCreateSchema>;
export type InsightUpdate = z.infer<typeof insightUpdateSchema>;
