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
  participantCount: z.number().int().min(1).max(40),
  durationMinutes: z.number().int().min(8).max(25).default(15),
});

const participantTagSchema = z
  .string()
  .trim()
  .min(2)
  .max(24)
  .regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, hyphens, or underscores.");

export const teacherUsabilityEventSchema = z.object({
  runId: z.string().uuid(),
  participantTag: participantTagSchema,
  taskId: z.string().trim().min(2).max(80),
  eventType: z.string().trim().min(2).max(80),
  durationMs: z.number().int().min(0).max(7_200_000).nullable().default(null),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const teacherContentDraftSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  gradeBand: z.string().trim().min(2).max(160).optional(),
  scopeBoundary: z.string().trim().min(10).max(2_000).optional(),
  initialPrompt: z.string().trim().min(20).max(4_000),
  nearTransferPrompt: z.string().trim().min(20).max(4_000).optional(),
  completionPromptId: z.string().trim().min(2).max(120).optional(),
  ideaIds: z.array(z.string().trim().min(2).max(120)).min(1).max(10).optional(),
  ideaLabels: z.record(z.string(), z.string().trim().min(2).max(160)).default({}),
  ideaDescriptions: z.record(z.string(), z.string().trim().min(4).max(1_000)),
  ideaTeacherActions: z.record(z.string(), z.string().trim().max(1_000)).default({}),
  misconceptionIds: z.array(z.string().trim().min(2).max(120)).max(12).optional(),
  misconceptionLabels: z.record(z.string(), z.string().trim().min(2).max(160)).default({}),
  misconceptionDescriptions: z.record(
    z.string(),
    z.string().trim().min(4).max(1_000),
  ),
  misconceptionTeacherActions: z.record(z.string(), z.string().trim().max(1_000)).default({}),
  followUpIds: z.array(z.string().trim().min(2).max(120)).min(1).max(20).optional(),
  followUpTitles: z.record(z.string(), z.string().trim().min(2).max(160)).default({}),
  followUpPrompts: z.record(z.string(), z.string().trim().min(4).max(2_000)),
  followUpTargetIds: z.record(
    z.string(),
    z.array(z.string().trim().min(2).max(120)).min(1).max(22),
  ).default({}),
});

export const teacherAuthoredSessionSchema = teacherSessionSchema.extend({
  authoringDraft: teacherContentDraftSchema,
});

export const teacherDemoSessionSchema = z.object({
  runId: z.string().uuid(),
  participantTag: participantTagSchema,
  authoringDraft: teacherContentDraftSchema,
});

export const teacherUsabilitySubmissionSchema = z.object({
  runId: z.string().uuid(),
  participantTag: participantTagSchema,
  startedAt: z.string().datetime(),
  authoringDraft: teacherContentDraftSchema,
  reviews: z.array(z.object({
    sampleId: z.string().trim().min(2).max(24),
    judgment: z.enum(["agree", "needs_revision", "unsure"]),
    correction: z.string().trim().max(1_000),
  })).min(5).max(30),
  classSummary: z.object({
    primaryPatternId: z.string().trim().min(2).max(120),
    interpretation: z.string().trim().min(10).max(2_000),
    nextAction: z.string().trim().min(10).max(2_000),
    confidence: z.number().int().min(1).max(5),
  }),
  susResponses: z.array(z.number().int().min(1).max(5)).length(10),
  summaryUsefulness: z.number().int().min(1).max(5),
  promptControl: z.number().int().min(1).max(5),
  openFeedback: z.string().trim().max(4_000),
  taskMetrics: z.array(z.object({
    taskId: z.enum(["authoring", "classification_review", "class_summary", "survey"]),
    durationMs: z.number().int().min(0).max(7_200_000),
    completed: z.boolean(),
  })).length(4),
});
