import type { PrismaClient, Role, User } from "@prisma/client";
import { logAction } from "@/lib/audit/logAction";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export class LastAdminError extends Error {
  constructor() {
    super("Cannot remove the last remaining admin.");
    this.name = "LastAdminError";
  }
}

interface ChangeUserRoleInput {
  tx: TxClient;
  actor: Pick<User, "id" | "name" | "email">;
  targetUser: Pick<User, "id" | "role" | "email">;
  nextRole: Role;
}

/**
 * Changes a user's role, refusing to demote the last remaining ADMIN — that
 * would lock every admin-only screen/action with no way back short of a
 * direct database write — and records the change in the audit log in the
 * same transaction as the update, so the two can never diverge.
 */
export async function changeUserRole({ tx, actor, targetUser, nextRole }: ChangeUserRoleInput) {
  if (targetUser.role === "ADMIN" && nextRole !== "ADMIN") {
    const remainingAdmins = await tx.user.count({ where: { role: "ADMIN" } });
    if (remainingAdmins <= 1) throw new LastAdminError();
  }

  const updated = await tx.user.update({ where: { id: targetUser.id }, data: { role: nextRole } });

  await logAction(tx, {
    actor,
    action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
    targetType: "User",
    targetId: targetUser.id,
    metadata: { previousRole: targetUser.role, newRole: nextRole, targetEmail: targetUser.email },
  });

  return updated;
}
