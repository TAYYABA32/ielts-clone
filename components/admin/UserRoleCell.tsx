"use client";

import { useState } from "react";
import type { Role } from "@prisma/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const ROLE_OPTIONS: Role[] = ["STUDENT", "CONTENT_EDITOR", "ADMIN"];
const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Student",
  CONTENT_EDITOR: "Content Editor",
  ADMIN: "Admin",
};

interface UserRoleCellProps {
  userId: string;
  userName: string;
  initialRole: Role;
}

/** Role <select> for one user row — optimistically applies the change on confirm, rolling back if the server rejects it (e.g. last-admin protection). */
export function UserRoleCell({ userId, userName, initialRole }: UserRoleCellProps) {
  const [role, setRole] = useState<Role>(initialRole);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!pendingRole) return;
    const previousRole = role;
    const nextRole = pendingRole;

    setIsSaving(true);
    setError(null);
    setRole(nextRole); // optimistic — reverted in the catch block below on failure

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? `Failed to update role (status ${response.status})`);
      }
    } catch (err) {
      setRole(previousRole);
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setIsSaving(false);
      setPendingRole(null);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <select
        value={role}
        onChange={(e) => setPendingRole(e.target.value as Role)}
        disabled={isSaving}
        aria-label={`Change role for ${userName}`}
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {ROLE_LABELS[option]}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-danger-700" role="alert">
          {error}
        </span>
      )}

      <ConfirmDialog
        open={pendingRole !== null}
        title="Change role?"
        description={
          pendingRole
            ? `Change ${userName}'s role from ${ROLE_LABELS[role]} to ${ROLE_LABELS[pendingRole]}? This takes effect immediately.`
            : ""
        }
        confirmLabel="Change role"
        isConfirming={isSaving}
        onConfirm={handleConfirm}
        onCancel={() => setPendingRole(null)}
      />
    </div>
  );
}
