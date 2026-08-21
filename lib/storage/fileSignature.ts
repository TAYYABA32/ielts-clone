export type FileCategory = "image" | "audio";

// Magic-byte checks for the specific formats this app actually accepts —
// SECURITY_AUDIT.md M7 (formerly Finding 5): the previous validation trusted
// the client-supplied Content-Type header alone, so a spoofed header with
// arbitrary bytes behind it would pass. This checks the file's actual
// content against known signatures for its claimed category (image vs
// audio); it does not need to pin the exact sub-format (JPEG vs PNG, MP3 vs
// WAV) — any recognized signature for the claimed category is accepted,
// matching how the app's own MIME-prefix check ("image/", "audio/") already
// works at the category level, not the exact-subtype level.
const IMAGE_SIGNATURES: Array<(buf: Buffer) => boolean> = [
  (buf) => buf.length >= 3 && buf.readUInt8(0) === 0xff && buf.readUInt8(1) === 0xd8 && buf.readUInt8(2) === 0xff, // JPEG
  (buf) => buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), // PNG
  (buf) => buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "GIF8", // GIF87a/GIF89a
  (buf) => buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP",
];

const AUDIO_SIGNATURES: Array<(buf: Buffer) => boolean> = [
  (buf) => buf.length >= 3 && buf.subarray(0, 3).toString("ascii") === "ID3", // MP3 with an ID3 tag
  (buf) => buf.length >= 2 && buf.readUInt8(0) === 0xff && (buf.readUInt8(1) & 0xe0) === 0xe0, // MP3 frame sync, no ID3 tag
  (buf) => buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WAVE",
  (buf) => buf.length >= 4 && buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])), // WebM/Matroska (EBML) — MediaRecorder's typical output
  (buf) => buf.length >= 8 && buf.subarray(4, 8).toString("ascii") === "ftyp", // MP4/M4A
  (buf) => buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "OggS",
];

/** True if `buffer` starts with a recognized signature for `category`. Returns false (not throws) on no match — the caller decides what that means. */
export function matchesFileCategory(buffer: Buffer, category: FileCategory): boolean {
  const signatures = category === "image" ? IMAGE_SIGNATURES : AUDIO_SIGNATURES;
  return signatures.some((check) => check(buffer));
}

/** Maps a MIME-type prefix ("image/", "audio/") to the FileCategory it corresponds to, or null if this module has no signature list for it. */
export function categoryFromMimePrefix(mimeType: string): FileCategory | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return null;
}
