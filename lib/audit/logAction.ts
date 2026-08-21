import type { Prisma, PrismaClient, User } from "@prisma/client";
import type { AuditAction } from "./actions";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export interface LogActionInput {
  actor: Pick<User, "id" | "name" | "email">;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Durable audit trail for privileged actions. Always call this inside the
 * SAME transaction as the action being audited (pass the `tx` from that
 * transaction) — writing the log entry and the action it describes
 * atomically means the two can never diverge if either half fails.
 */
export async function logAction(tx: TxClient, input: LogActionInput): Promise<void> {
  await tx.auditLog.create({
    data: {
      actorId: input.actor.id,
      actorName: input.actor.name,
      actorEmail: input.actor.email,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
