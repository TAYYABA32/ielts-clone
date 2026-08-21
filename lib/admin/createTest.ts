import { prisma } from "@/lib/prisma";
import { createTestSchema } from "@/lib/validation/testSchemas";

/**
 * Shared by POST /api/admin/tests and the /admin/tests "Create test" Server
 * Action so validation and the shape written to Prisma can't drift between
 * the two entry points.
 */
export async function createTestRecord(input: unknown) {
  const data = createTestSchema.parse(input);
  return prisma.test.create({ data });
}
