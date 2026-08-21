import { z } from "zod";

export const optionItemSchema = z.object({
  key: z.string().min(1).max(2),
  text: z.string().min(1),
});

export const questionTypeSchema = z.enum([
  "MULTIPLE_CHOICE",
  "TRUE_FALSE_NOT_GIVEN",
  "MATCHING_HEADINGS",
  "SENTENCE_COMPLETION",
  "MAP_LABELING",
]);

const baseQuestionSchema = z.object({
  id: z.string().uuid().optional(), // absent on create
  order: z.number().int().min(1),
  points: z.number().min(0).default(1),
  prompt: z.string().optional(),
});

export const multipleChoiceQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("MULTIPLE_CHOICE"),
  allowMultipleSelect: z.boolean().default(false),
  options: z.array(optionItemSchema).min(2),
  correctAnswer: z.union([z.string(), z.array(z.string()).min(1)]),
});

export const trueFalseNotGivenQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("TRUE_FALSE_NOT_GIVEN"),
  statement: z.string().min(1),
  correctAnswer: z.enum(["TRUE", "FALSE", "NOT_GIVEN"]),
});

export const matchingHeadingsQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("MATCHING_HEADINGS"),
  paragraphLabel: z.string().min(1),
  correctAnswer: z.string().min(1),
});

export const sentenceCompletionQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("SENTENCE_COMPLETION"),
  textWithBlank: z.string().min(1).refine((v) => v.includes("___"), {
    message: "textWithBlank must contain a '___' placeholder",
  }),
  maxWords: z.number().int().min(1).default(3),
  correctAnswer: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  caseSensitive: z.boolean().default(false),
});

export const mapLabelingQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("MAP_LABELING"),
  labelPointId: z.string().min(1),
  correctAnswer: z.string().min(1),
});

export const questionSchema = z.discriminatedUnion("type", [
  multipleChoiceQuestionSchema,
  trueFalseNotGivenQuestionSchema,
  matchingHeadingsQuestionSchema,
  sentenceCompletionQuestionSchema,
  mapLabelingQuestionSchema,
]);

const mapPointSchema = z.object({
  id: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const questionGroupDataSchema = z
  .object({
    headings: z.array(optionItemSchema).optional(),
    mapImageUrl: z.string().url().optional(),
    mapPoints: z.array(mapPointSchema).optional(),
    options: z.array(optionItemSchema).optional(),
  })
  .optional();

export const questionGroupSchema = z
  .object({
    id: z.string().uuid().optional(),
    order: z.number().int().min(1),
    type: questionTypeSchema,
    instructions: z.string().min(1),
    passageId: z.string().uuid().optional(),
    audioTrackId: z.string().uuid().optional(),
    groupData: questionGroupDataSchema,
    questions: z.array(questionSchema).min(1),
  })
  .superRefine((group, ctx) => {
    // Auto-grading rule: every question in a group must match the group's own type
    // — a mismatched question type here would silently corrupt scoring later.
    for (const [i, question] of group.questions.entries()) {
      if (question.type !== group.type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Question at index ${i} has type ${question.type}, expected ${group.type}`,
          path: ["questions", i, "type"],
        });
      }
    }
    if (group.type === "MATCHING_HEADINGS" && !group.groupData?.headings?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MATCHING_HEADINGS groups require groupData.headings",
        path: ["groupData", "headings"],
      });
    }
    if (group.type === "MAP_LABELING" && (!group.groupData?.mapImageUrl || !group.groupData?.mapPoints?.length || !group.groupData?.options?.length)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MAP_LABELING groups require groupData.mapImageUrl, mapPoints, and options",
        path: ["groupData"],
      });
    }
  });

export const passageSchema = z.object({
  id: z.string().uuid().optional(),
  order: z.number().int().min(1),
  title: z.string().min(1),
  bodyText: z.string().min(1),
});

export const audioTrackSchema = z.object({
  id: z.string().uuid().optional(),
  order: z.number().int().min(1),
  title: z.string().min(1),
  audioUrl: z.string().url(),
  durationSeconds: z.number().int().min(1),
  transcript: z.string().optional(),
});

export const writingTaskSchema = z.object({
  id: z.string().uuid().optional(),
  taskNumber: z.union([z.literal(1), z.literal(2)]),
  prompt: z.string().min(1),
  imageUrl: z.string().url().optional(),
  minWords: z.number().int().min(1),
  timeLimitMinutes: z.number().int().min(1),
});

export const speakingPartSchema = z.object({
  id: z.string().uuid().optional(),
  partNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  cueCardText: z.string().optional(),
  prepTimeSeconds: z.number().int().min(0).optional(),
  speakingTimeSeconds: z.number().int().min(0).optional(),
  questions: z.array(z.string().min(1)),
});

export const moduleSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["LISTENING", "READING", "WRITING", "SPEAKING"]),
  order: z.number().int().min(1),
  timeLimitMinutes: z.number().int().min(1),
  passages: z.array(passageSchema).optional(),
  audioTracks: z.array(audioTrackSchema).optional(),
  questionGroups: z.array(questionGroupSchema).optional(),
  writingTasks: z.array(writingTaskSchema).optional(),
  speakingParts: z.array(speakingPartSchema).optional(),
});

export const createTestSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["ACADEMIC", "GENERAL"]),
  isPublished: z.boolean().default(false),
});

export const updateTestSchema = createTestSchema.partial();

export type CreateTestInput = z.infer<typeof createTestSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
export type QuestionGroupInput = z.infer<typeof questionGroupSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type QuestionType = z.infer<typeof questionTypeSchema>;
