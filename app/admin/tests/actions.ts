"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createTestRecord } from "@/lib/admin/createTest";

/** Server Action backing the "Create test" form on /admin/tests — validates, creates an empty test shell, then sends the admin straight into the builder to add modules. */
export async function createTest(formData: FormData) {
  await requireAdmin();

  const test = await createTestRecord({
    title: formData.get("title"),
    type: formData.get("type"),
  });

  redirect(`/admin/tests/${test.id}`);
}
