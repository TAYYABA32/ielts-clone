import type { AttemptStatus } from "@prisma/client";
import type { BadgeTone } from "@/components/ui/Badge";

const ATTEMPT_STATUS_BADGE: Record<AttemptStatus, { label: string; tone: BadgeTone }> = {
  IN_PROGRESS: { label: "In progress", tone: "brand" },
  SUBMITTED: { label: "Submitted", tone: "success" },
  EXPIRED: { label: "Expired", tone: "warning" },
  ABANDONED: { label: "Abandoned", tone: "neutral" },
};

/** Single source of truth for how an AttemptStatus renders — see DESIGN_SYSTEM.md's "no ad hoc status colors" rule. */
export function getAttemptStatusBadge(status: AttemptStatus): { label: string; tone: BadgeTone } {
  return ATTEMPT_STATUS_BADGE[status];
}
