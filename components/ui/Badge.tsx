import type { ReactNode } from "react";

export type BadgeTone = "brand" | "success" | "warning" | "danger" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  neutral: "bg-gray-100 text-gray-700",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

/** Shared status pill — see DESIGN_SYSTEM.md §2. Centralizes tone-to-color mapping so every screen renders the same status the same way. */
export function Badge({ tone = "neutral", children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
