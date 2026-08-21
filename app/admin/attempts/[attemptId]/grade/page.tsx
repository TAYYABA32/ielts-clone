import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ExaminerScoreForm } from "@/components/admin/ExaminerScoreForm";
import { getModuleTypeLabel } from "@/lib/testSequence";
import type { ModuleType } from "@/types/test";

async function loadAttempt(attemptId: string) {
  return prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: { select: { name: true, email: true } },
      test: { select: { title: true, type: true, modules: { select: { id: true, type: true } } } },
      moduleAttempts: {
        include: {
          module: { select: { type: true } },
          writingResponses: { include: { writingTask: true } },
          speakingResponses: { include: { speakingPart: true } },
        },
      },
    },
  });
}

const MODULE_DISPLAY_ORDER: ModuleType[] = ["LISTENING", "READING", "WRITING", "SPEAKING"];

export default async function GradeAttemptPage({ params }: { params: { attemptId: string } }) {
  await requireAdmin();
  const attempt = await loadAttempt(params.attemptId);
  if (!attempt) notFound();

  const moduleAttemptByType = new Map(attempt.moduleAttempts.map((ma) => [ma.module.type, ma]));
  const configuredTypes = new Set(attempt.test.modules.map((m) => m.type));

  return (
    <div className="ielts-grade-page" data-testid="grade-page">
      <header className="ielts-grade-page__header">
        <h1>{attempt.test.title}</h1>
        <p>
          Candidate: {attempt.user.name} ({attempt.user.email})
        </p>
        <p>Status: {attempt.status}</p>
        <p className="ielts-grade-page__overall-band">
          Overall Band: {attempt.overallBand !== null ? attempt.overallBand.toFixed(1) : "Pending"}
        </p>
      </header>

      {MODULE_DISPLAY_ORDER.filter((type) => configuredTypes.has(type)).map((type) => {
        const moduleAttempt = moduleAttemptByType.get(type);

        if (type === "LISTENING" || type === "READING") {
          return (
            <section key={type} className="ielts-grade-module ielts-grade-module--auto">
              <h2>{getModuleTypeLabel(type)}</h2>
              {moduleAttempt ? (
                <p>
                  Auto-graded: {moduleAttempt.rawScore}/{moduleAttempt.maxRawScore} correct — Band{" "}
                  {moduleAttempt.bandScore?.toFixed(1) ?? "—"}
                </p>
              ) : (
                <p>Not yet attempted.</p>
              )}
            </section>
          );
        }

        if (type === "WRITING") {
          const tasks = [...(moduleAttempt?.writingResponses ?? [])].sort(
            (a, b) => a.writingTask.taskNumber - b.writingTask.taskNumber
          );
          return (
            <section key={type} className="ielts-grade-module">
              <h2>Writing</h2>
              {tasks.length === 0 && <p>No writing responses submitted yet.</p>}
              {tasks.map((response) => (
                <article key={response.id} className="ielts-grade-module__response">
                  <h3>Task {response.writingTask.taskNumber}</h3>
                  <p className="ielts-grade-module__prompt">{response.writingTask.prompt}</p>
                  <div className="ielts-grade-module__essay">
                    {response.responseText.split("\n").map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                  <p className="ielts-grade-module__meta">
                    {response.wordCount} words (min {response.writingTask.minWords})
                  </p>
                </article>
              ))}
              {moduleAttempt && (
                <ExaminerScoreForm
                  attemptId={attempt.id}
                  moduleAttemptId={moduleAttempt.id}
                  moduleLabel="Writing"
                  initialBandScore={moduleAttempt.bandScore}
                  initialExaminerNotes={moduleAttempt.examinerNotes}
                />
              )}
            </section>
          );
        }

        // SPEAKING
        const parts = [...(moduleAttempt?.speakingResponses ?? [])].sort(
          (a, b) => a.speakingPart.partNumber - b.speakingPart.partNumber
        );
        return (
          <section key={type} className="ielts-grade-module">
            <h2>Speaking</h2>
            {parts.length === 0 && <p>No speaking recordings submitted yet.</p>}
            {parts.map((response) => (
              <article key={response.id} className="ielts-grade-module__response">
                <h3>Part {response.speakingPart.partNumber}</h3>
                {response.speakingPart.cueCardText && (
                  <p className="ielts-grade-module__prompt">{response.speakingPart.cueCardText}</p>
                )}
                {/* eslint-disable-next-line jsx-a11y/media-has-caption -- spoken-word recording, no caption track available */}
                <audio controls src={response.audioUrl} className="ielts-grade-module__audio" />
                <p className="ielts-grade-module__meta">Duration: {response.durationSeconds}s</p>
              </article>
            ))}
            {moduleAttempt && (
              <ExaminerScoreForm
                attemptId={attempt.id}
                moduleAttemptId={moduleAttempt.id}
                moduleLabel="Speaking"
                initialBandScore={moduleAttempt.bandScore}
                initialExaminerNotes={moduleAttempt.examinerNotes}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
