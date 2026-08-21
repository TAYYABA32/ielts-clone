import type { ModuleInput } from "@/lib/validation/testSchemas";

const DEFAULT_TIME_LIMITS: Record<ModuleInput["type"], number> = {
  LISTENING: 30,
  READING: 60,
  WRITING: 60,
  SPEAKING: 14,
};

const MODULE_ORDER: Record<ModuleInput["type"], number> = {
  LISTENING: 1,
  READING: 2,
  WRITING: 3,
  SPEAKING: 4,
};

export function createDefaultModule(type: ModuleInput["type"]): ModuleInput {
  return {
    type,
    order: MODULE_ORDER[type],
    timeLimitMinutes: DEFAULT_TIME_LIMITS[type],
    passages: type === "READING" ? [] : undefined,
    audioTracks: type === "LISTENING" ? [] : undefined,
    questionGroups: type === "READING" || type === "LISTENING" ? [] : undefined,
    writingTasks: type === "WRITING" ? [] : undefined,
    speakingParts: type === "SPEAKING" ? [] : undefined,
  };
}
