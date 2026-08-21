import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { saveUploadedFile } from "@/lib/storage/saveUploadedFile";
import { recomputeOverallBand } from "@/lib/scoring/recomputeOverallBand";
import { finalizeAttemptIfComplete } from "@/lib/scoring/finalizeAttemptIfComplete";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";

const MAX_RECORDING_BYTES = 20 * 1024 * 1024; // 20MB — generous for a few minutes of compressed speech audio

/**
 * POST /api/test-attempts/:attemptId/speaking-upload
 * Multipart form: `audio` (Blob), `moduleId`, `speakingPartId`, `durationSeconds`.
 * Stores the recording and marks the Speaking module attempt as awaiting
 * examiner review, same pattern as writing-submit.
 */
export async function POST(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.upload);
    const user = await requireUser();

    const formData = await request.formData();
    const audio = formData.get("audio");
    const moduleId = formData.get("moduleId");
    const speakingPartId = formData.get("speakingPartId");
    const durationSecondsRaw = formData.get("durationSeconds");

    if (!(audio instanceof File) || typeof moduleId !== "string" || typeof speakingPartId !== "string" || typeof durationSecondsRaw !== "string") {
      return NextResponse.json({ error: "Missing required fields: audio, moduleId, speakingPartId, durationSeconds" }, { status: 400 });
    }
    const durationSeconds = Number(durationSecondsRaw);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return NextResponse.json({ error: "durationSeconds must be a positive number" }, { status: 400 });
    }

    const attempt = await prisma.testAttempt.findUnique({ where: { id: params.attemptId } });
    if (!attempt || attempt.userId !== user.id) throw new AuthError(403, "Not your test attempt");
    if (attempt.status !== "IN_PROGRESS") throw new AuthError(403, "Attempt is no longer in progress");

    const moduleRow = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!moduleRow || moduleRow.testId !== attempt.testId || moduleRow.type !== "SPEAKING") {
      return NextResponse.json({ error: "Speaking module not found on this attempt" }, { status: 404 });
    }

    const speakingPart = await prisma.speakingPart.findUnique({ where: { id: speakingPartId } });
    if (!speakingPart || speakingPart.moduleId !== moduleId) {
      return NextResponse.json({ error: "Speaking part not found on this module" }, { status: 404 });
    }

    const saved = await saveUploadedFile(audio, {
      allowedMimePrefixes: ["audio/"],
      maxBytes: MAX_RECORDING_BYTES,
      defaultExtension: ".webm",
    });

    const speakingResponse = await prisma.$transaction(async (tx) => {
      const moduleAttempt = await tx.moduleAttempt.upsert({
        where: { testAttemptId_moduleId: { testAttemptId: params.attemptId, moduleId } },
        create: { testAttemptId: params.attemptId, moduleId },
        update: {}, // never reset an existing examiner-assigned bandScore on re-upload
      });

      const response = await tx.speakingResponse.upsert({
        where: { moduleAttemptId_speakingPartId: { moduleAttemptId: moduleAttempt.id, speakingPartId } },
        create: {
          moduleAttemptId: moduleAttempt.id,
          speakingPartId,
          audioUrl: saved.url,
          durationSeconds: Math.round(durationSeconds),
          submittedAt: new Date(),
        },
        update: { audioUrl: saved.url, durationSeconds: Math.round(durationSeconds), submittedAt: new Date() },
      });

      await recomputeOverallBand(tx, params.attemptId);
      await finalizeAttemptIfComplete(tx, params.attemptId, attempt.testId);

      return response;
    });

    return NextResponse.json({ speakingResponseId: speakingResponse.id, url: saved.url }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
