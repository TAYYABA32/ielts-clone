import { randomUUID } from "node:crypto";
import path from "node:path";
import { getSupabaseAdmin } from "./supabaseClient";
import { categoryFromMimePrefix, matchesFileCategory } from "./fileSignature";

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "uploads";

export class UploadValidationError extends Error {
  constructor(public status: 400 | 413 | 415, message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

interface SaveUploadedFileOptions {
  allowedMimePrefixes: string[];
  maxBytes: number;
  defaultExtension: string;
}

interface SavedFile {
  url: string;
  mimeType: string;
  sizeBytes: number;
}

// Supabase Storage — same project as the Postgres database (see
// .env.example), so files persist across redeploys/serverless cold starts,
// unlike the local-disk write this replaced. Shared by the admin
// content-upload route and the candidate speaking-recording upload route so
// the validation/storage policy never drifts between the two; every
// caller's contract (File in, { url } out) is unchanged.
export async function saveUploadedFile(file: File, options: SaveUploadedFileOptions): Promise<SavedFile> {
  if (!options.allowedMimePrefixes.some((prefix) => file.type.startsWith(prefix))) {
    throw new UploadValidationError(415, `Unsupported file type: ${file.type}`);
  }
  if (file.size > options.maxBytes) {
    throw new UploadValidationError(413, `File exceeds ${Math.round(options.maxBytes / (1024 * 1024))}MB limit`);
  }

  const extension = path.extname(file.name) || options.defaultExtension;
  const objectPath = `${randomUUID()}${extension}`;

  const supabase = getSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());

  // Content-sniff against the claimed category (image/audio) rather than
  // trusting the client-supplied Content-Type alone — SECURITY_AUDIT.md M7.
  const category = categoryFromMimePrefix(file.type);
  if (category && !matchesFileCategory(buffer, category)) {
    throw new UploadValidationError(415, `File content does not match declared type: ${file.type}`);
  }

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(objectPath, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);

  return { url: data.publicUrl, mimeType: file.type, sizeBytes: file.size };
}
