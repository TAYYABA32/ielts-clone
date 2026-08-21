import { describe, expect, it } from "vitest";
import { categoryFromMimePrefix, matchesFileCategory } from "./fileSignature";

describe("categoryFromMimePrefix", () => {
  it("maps image/* and audio/* to their category", () => {
    expect(categoryFromMimePrefix("image/jpeg")).toBe("image");
    expect(categoryFromMimePrefix("audio/mpeg")).toBe("audio");
  });

  it("returns null for a prefix with no known signature list", () => {
    expect(categoryFromMimePrefix("video/mp4")).toBeNull();
    expect(categoryFromMimePrefix("application/pdf")).toBeNull();
  });
});

describe("matchesFileCategory — image", () => {
  it("recognizes a JPEG signature", () => {
    expect(matchesFileCategory(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), "image")).toBe(true);
  });

  it("recognizes a PNG signature", () => {
    expect(matchesFileCategory(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]), "image")).toBe(true);
  });

  it("recognizes a GIF signature", () => {
    expect(matchesFileCategory(Buffer.from("GIF89a", "ascii"), "image")).toBe(true);
  });

  it("recognizes a WEBP signature", () => {
    const buf = Buffer.concat([Buffer.from("RIFF", "ascii"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBP", "ascii")]);
    expect(matchesFileCategory(buf, "image")).toBe(true);
  });

  it("rejects arbitrary bytes with no recognized image signature", () => {
    expect(matchesFileCategory(Buffer.from("this is not an image"), "image")).toBe(false);
  });

  it("rejects an audio signature when checked against the image category", () => {
    expect(matchesFileCategory(Buffer.from("ID3\x03\x00\x00\x00"), "image")).toBe(false);
  });
});

describe("matchesFileCategory — audio", () => {
  it("recognizes an MP3 with an ID3 tag", () => {
    expect(matchesFileCategory(Buffer.from("ID3\x03\x00\x00\x00", "binary"), "audio")).toBe(true);
  });

  it("recognizes an MP3 frame sync with no ID3 tag", () => {
    expect(matchesFileCategory(Buffer.from([0xff, 0xfb, 0x90, 0x00]), "audio")).toBe(true);
  });

  it("recognizes a WAV signature", () => {
    const buf = Buffer.concat([Buffer.from("RIFF", "ascii"), Buffer.from([0, 0, 0, 0]), Buffer.from("WAVE", "ascii")]);
    expect(matchesFileCategory(buf, "audio")).toBe(true);
  });

  it("recognizes a WebM/EBML signature (MediaRecorder's typical output)", () => {
    expect(matchesFileCategory(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x00]), "audio")).toBe(true);
  });

  it("recognizes an MP4/M4A ftyp signature", () => {
    const buf = Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x18]), Buffer.from("ftyp", "ascii"), Buffer.from("M4A ", "ascii")]);
    expect(matchesFileCategory(buf, "audio")).toBe(true);
  });

  it("recognizes an OGG signature", () => {
    expect(matchesFileCategory(Buffer.from("OggS", "ascii"), "audio")).toBe(true);
  });

  it("rejects arbitrary bytes with no recognized audio signature", () => {
    expect(matchesFileCategory(Buffer.from("not audio content at all"), "audio")).toBe(false);
  });

  it("rejects a buffer too short to contain any signature", () => {
    expect(matchesFileCategory(Buffer.from([0xff]), "audio")).toBe(false);
    expect(matchesFileCategory(Buffer.alloc(0), "image")).toBe(false);
  });
});
