import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth/session";
import { AttemptBreakdown, type ModuleBreakdown, type QuestionRow } from "@/components/dashboard/AttemptBreakdown";
import { BandProgressChart } from "@/components/dashboard/BandProgressChart";
import { describeQuestionContext, formatAnswerValue } from "@/lib/dashboard/describeQuestion";

async function loadAttempt(attemptId: string) {
  return prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: { select: { title: true } },
      moduleAttempts: {
        include: {
          module: { select: { type: true } },
          responses: { include: { question: true }, orderBy: { question: { order: "asc" } } },
        },
      },
    },
  });
}

export default async function AttemptBreakdownPage({ params }: { params: { attemptId: string } }) {
  const user = await requireUser();
  const attempt = await loadAttempt(params.attemptId);

  if (!attempt) notFound();
  if (attempt.userId !== user.id && user.role === "STUDENT") {
    throw new AuthError(403, "Cannot view another student's attempt");
  }
  if (attempt.status !== "SUBMITTED") notFound();

  const modules: ModuleBreakdown[] = attempt.moduleAttempts.map((ma) => {
    const questionRows: QuestionRow[] = ma.responses.map((response) => ({
      questionId: response.questionId,
      order: response.question.order,
      context: describeQuestionContext(response.question),
      userAnswer: formatAnswerValue(response.userAnswer),
      correctAnswer: formatAnswerValue(response.question.correctAnswer),
      isCorrect: response.isCorrect,
      timeSpentSeconds: response.timeSpentSeconds,
      flagged: response.flagged,
    }));

    return {
      moduleAttemptId: ma.id,
      moduleType: ma.module.type,
      rawScore: ma.rawScore,
      maxRawScore: ma.maxRawScore,
      bandScore: ma.bandScore,
      timeSpentSeconds: ma.timeSpentSeconds,
      questionRows,
    };
  });

  return (
    <div className="ielts-dashboard-page">
      <AttemptBreakdown
        testTitle={attempt.test.title}
        overallBand={attempt.overallBand}
        submittedAt={attempt.submittedAt?.toISOString() ?? null}
        modules={modules}
      />
      <BandProgressChart userId={attempt.userId} />
    </div>
  );
}
