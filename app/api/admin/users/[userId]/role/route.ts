import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";
import { changeUserRole } from "@/lib/admin/changeUserRole";

const changeRoleSchema = z.object({
  role: z.enum(["STUDENT", "CONTENT_EDITOR", "ADMIN"]),
});

function toPublicUser(user: { id: string; name: string; email: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/**
 * PATCH /api/admin/users/:userId/role
 * ADMIN-only (not CONTENT_EDITOR — role management is more sensitive than
 * content editing). Refuses to demote the last remaining ADMIN and records
 * every change in the audit log; see lib/admin/changeUserRole.ts.
 */
export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.admin);
    const actor = await requireRole("ADMIN");

    const { role: nextRole } = changeRoleSchema.parse(await request.json());

    const targetUser = await prisma.user.findUnique({ where: { id: params.userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === nextRole) {
      return NextResponse.json({ user: toPublicUser(targetUser) });
    }

    const updated = await prisma.$transaction((tx) => changeUserRole({ tx, actor, targetUser, nextRole }));

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (error) {
    return handleApiError(error);
  }
}
