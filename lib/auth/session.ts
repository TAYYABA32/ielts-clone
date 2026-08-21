import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Role, User } from "@prisma/client";

export class AuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Thrown when a brand-new Clerk identity (e.g. "Sign in with Google") has an
 * email that already belongs to a different clerkId — someone who
 * registered with email/password (or a different OAuth account) and is now
 * signing in with Google using the same address. Distinct from AuthError so
 * callers can show a specific, actionable message instead of a generic
 * "failed to provision user".
 */
export class OAuthEmailConflictError extends Error {
  constructor(public email: string) {
    super(`An account with the email "${email}" already exists. Sign in with your original method instead.`);
    this.name = "OAuthEmailConflictError";
  }
}

/**
 * Identity and session management live in Clerk; this app only needs a
 * local User row for the data Clerk doesn't know about (role, and
 * everything that hangs off it). Rather than wiring a Clerk webhook to
 * create that row at signup time, it's provisioned just-in-time on whatever
 * request first needs it — the extra `create` only ever runs once per user.
 */
async function getOrCreateUserForClerkId(clerkId: string): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) throw new AuthError(401, "Not authenticated");

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkId}@no-email.invalid`;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || email;

  try {
    return await prisma.user.create({ data: { clerkId, email, name, role: "STUDENT" } });
  } catch (error) {
    // Two concurrent first-requests for the same brand-new user could both
    // reach here; the unique index on clerkId means the loser of that race
    // fails with a unique-constraint error rather than duplicating the row —
    // fall back to reading what the winner just created.
    const racedUser = await prisma.user.findUnique({ where: { clerkId } });
    if (racedUser) return racedUser;

    // Not a clerkId race (no row exists under this clerkId) — if the
    // conflict was on `email` instead, this person already has an account
    // under a different clerkId (e.g. they signed up with email/password
    // and are now trying Google with the same address). That's a real,
    // nameable conflict, not a transient race.
    const isEmailConflict =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (error.meta?.target as string[] | undefined)?.includes("email");
    if (isEmailConflict) throw new OAuthEmailConflictError(email);

    throw new AuthError(401, "Failed to provision user");
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return getOrCreateUserForClerkId(userId);
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Not authenticated");
  return user;
}

export async function requireRole(...allowedRoles: Role[]): Promise<User> {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError(403, `Requires one of roles: ${allowedRoles.join(", ")}`);
  }
  return user;
}

export const requireAdmin = () => requireRole("ADMIN", "CONTENT_EDITOR");
