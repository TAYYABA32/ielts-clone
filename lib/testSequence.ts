import { prisma } from "@/lib/prisma";
import type { ModuleType } from "@/types/test";

/** Canonical candidate-facing order. Independent of the admin-configurable Module.order field (which only controls display order within the Test Builder). */
export const CANDIDATE_MODULE_SEQUENCE: ModuleType[] = ["LISTENING", "READING", "WRITING", "SPEAKING"];

export function getNextModuleType(current: ModuleType): ModuleType | null {
  const index = CANDIDATE_MODULE_SEQUENCE.indexOf(current);
  if (index === -1 || index === CANDIDATE_MODULE_SEQUENCE.length - 1) return null;
  return CANDIDATE_MODULE_SEQUENCE[index + 1] ?? null;
}

export function getModuleTypeLabel(type: ModuleType): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

interface ModuleRouteInput {
  attemptId: string;
  moduleType: ModuleType;
  moduleId: string;
}

export function getModuleRoute({ attemptId, moduleType, moduleId }: ModuleRouteInput): string {
  switch (moduleType) {
    case "LISTENING":
    case "READING":
      return `/test/attempts/${attemptId}/modules/${moduleId}`;
    case "WRITING":
      return `/test/attempts/${attemptId}/writing`;
    case "SPEAKING":
      return `/test/attempts/${attemptId}/speaking`;
  }
}

export interface NextModuleInfo {
  href: string;
  label: string;
}

/**
 * Walks CANDIDATE_MODULE_SEQUENCE forward from `currentType` to find the next
 * module that actually exists on this test (a test doesn't have to define
 * all four), and returns where to send the candidate next. Returns null once
 * there's nothing left — the caller should show a "test complete" state.
 */
export async function resolveNextModuleHref(
  testId: string,
  attemptId: string,
  currentType: ModuleType
): Promise<NextModuleInfo | null> {
  let next = getNextModuleType(currentType);
  while (next) {
    const moduleRow = await prisma.module.findFirst({ where: { testId, type: next } });
    if (moduleRow) {
      return { href: getModuleRoute({ attemptId, moduleType: next, moduleId: moduleRow.id }), label: getModuleTypeLabel(next) };
    }
    next = getNextModuleType(next);
  }
  return null;
}
