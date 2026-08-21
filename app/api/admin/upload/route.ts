import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { saveUploadedFile } from "@/lib/storage/saveUploadedFile";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB — generous for a full listening-section MP3

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.upload);
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing 'file' field" }, { status: 400 });
    }

    const saved = await saveUploadedFile(file, {
      allowedMimePrefixes: ["audio/", "image/"],
      maxBytes: MAX_FILE_BYTES,
      defaultExtension: file.type.startsWith("audio/") ? ".mp3" : ".jpg",
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
