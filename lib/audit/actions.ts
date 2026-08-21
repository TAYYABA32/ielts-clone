/**
 * Single source of truth for AuditLog.action strings — extend this as new
 * privileged actions get audited (role changes, test/module deletion, etc.)
 * rather than scattering magic strings across route handlers.
 */
export const AUDIT_ACTIONS = {
  MODULE_ATTEMPT_GRADED: "MODULE_ATTEMPT_GRADED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
