import { z } from "zod";

export const confidenceChoiceSchema = z.enum([
  "not_sure",
  "somewhat_sure",
  "very_sure",
]);

const responseTextSchema = z
  .string()
  .trim()
  .min(20, "Please explain your thinking in at least one complete sentence.")
  .max(2_000, "Please keep your response under 2,000 characters.");

export const studentSubmissionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("initial"),
    responseText: responseTextSchema,
    confidenceChoice: confidenceChoiceSchema,
    clientTimestamp: z.string().datetime().optional(),
  }),
  z.object({
    action: z.literal("revision"),
    responseText: responseTextSchema,
    confidenceChoice: confidenceChoiceSchema,
    clientTimestamp: z.string().datetime().optional(),
  }),
  z.object({
    action: z.literal("transfer"),
    responseText: responseTextSchema,
    confidenceChoice: confidenceChoiceSchema,
    clientTimestamp: z.string().datetime().optional(),
  }),
  z.object({
    action: z.literal("survey"),
    clarity: z.number().int().min(1).max(5),
    pressure: z.number().int().min(1).max(5),
    helpfulness: z.number().int().min(1).max(5),
    openComment: z.string().trim().max(1_000).default(""),
  }),
]);

export const joinSchema = z.object({
  joinCode: z.string().trim().min(4).max(12),
  participantCode: z.string().trim().min(4).max(32),
});

export const teacherSessionSchema = z.object({
  title: z.string().trim().min(4).max(120),
  participantCount: z.number().int().min(2).max(40),
  durationMinutes: z.number().int().min(8).max(25).default(15),
});

