import { z } from "zod";

export const leadSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  interests: z.array(z.string().trim().min(1).max(160)).max(10).default([]),
  focusAreas: z.array(z.string().trim().min(1).max(60)).max(10).default([]),
  message: z.string().trim().max(1000).optional(),
  ctaOrigin: z.string().trim().max(160).optional(),
  referredBy: z.string().trim().max(80).optional(),
  sessionReferralCode: z.string().trim().max(80).optional(),
  researchReportLeadId: z.string().uuid().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
