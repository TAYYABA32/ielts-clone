import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { CANDIDATE_MODULE_SEQUENCE, getModuleTypeLabel } from "@/lib/testSequence";
import { startOrResumeAttempt } from "./actions";
import type { ModuleType } from "@/types/test";

type ModuleStatus = "not-configured" | "not-started" | "attempted";

export default async function TestStartPage({ params }: { params: { testId: string } }) {
  const user = await requireUser();

  const test = await prisma.test.findUnique({
    where: { id: params.testId },
    include: { modules: { select: { type: true } } },
  });
  if (!test || !test.isPublished) notFound();

  const configuredTypes = new Set(test.modules.map((m) => m.type));

  const latestAttempt = await prisma.testAttempt.findFirst({
    where: { userId: user.id, testId: test.id },
    orderBy: { startedAt: "desc" },
    include: { moduleAttempts: { include: { module: { select: { type: true } } } } },
  });

  const attemptedTypes = new Set(latestAttempt?.moduleAttempts.map((ma) => ma.module.type) ?? []);

  const moduleStatus = (type: ModuleType): ModuleStatus => {
    if (!configuredTypes.has(type)) return "not-configured";
    if (attemptedTypes.has(type)) return "attempted";
    return "not-started";
  };

  const isInProgress = latestAttempt?.status === "IN_PROGRESS";
  const isSubmitted = latestAttempt?.status === "SUBMITTED";

  return (
    <div className="ielts-test-start" data-testid="test-start-page">
      <header className="ielts-test-start__header">
        <h1>{test.title}</h1>
        <p>IELTS {test.type === "ACADEMIC" ? "Academic" : "General Training"}</p>
      </header>

      {isSubmitted && (
        <p className="ielts-test-start__notice">
          You already completed this test. Overall band: {latestAttempt.overallBand?.toFixed(1) ?? "Pending"}.{" "}
          <Link href={`/dashboard/attempts/${latestAttempt.id}`}>View results</Link>
        </p>
      )}

      <form action={startOrResumeAttempt.bind(null, test.id, null)} className="ielts-test-start__primary-action">
        <button type="submit">{isInProgress ? "Resume Full Test" : isSubmitted ? "Retake Full Test" : "Start Full Test"}</button>
        <p className="ielts-test-start__hint">
          Runs Listening → Reading → Writing → Speaking in sequence, picking up wherever you left off.
        </p>
      </form>

      <section className="ielts-test-start__modules">
        <h2>Or practice a single module</h2>
        <ul>
          {CANDIDATE_MODULE_SEQUENCE.map((type) => {
            const status = moduleStatus(type);
            return (
              <li key={type} className={`ielts-test-start__module ielts-test-start__module--${status}`}>
                <span className="ielts-test-start__module-name">{getModuleTypeLabel(type)}</span>
                <span className="ielts-test-start__module-status">
                  {status === "not-configured" && "Not available for this test"}
                  {status === "not-started" && "Not started"}
                  {status === "attempted" && "Already attempted"}
                </span>
                {status !== "not-configured" && (
                  <form action={startOrResumeAttempt.bind(null, test.id, type)}>
                    <button type="submit">{status === "attempted" ? "Redo this module" : "Start this module"}</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
