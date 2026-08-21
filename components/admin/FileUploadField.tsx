"use client";

import { useState, type ChangeEvent } from "react";

interface FileUploadFieldProps {
  label: string;
  accept: "audio/*" | "image/*";
  value?: string;
  onUploaded: (url: string) => void;
}

/** Uploads a file to /api/admin/upload and reports back the resulting public URL. Used for audio tracks and map images in the Test Builder. */
export function FileUploadField({ label, accept, value, onUploaded }: FileUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Upload failed");
      }
      const { url } = await response.json();
      onUploaded(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="ielts-file-upload">
      <label className="ielts-file-upload__label">
        {label}
        <input type="file" accept={accept} onChange={handleChange} disabled={isUploading} />
      </label>
      {isUploading && <span className="ielts-file-upload__status">Uploading…</span>}
      {error && <span className="ielts-file-upload__error">{error}</span>}
      {value && !isUploading && (
        <a href={value} target="_blank" rel="noreferrer" className="ielts-file-upload__preview">
          Current file ↗
        </a>
      )}
    </div>
  );
}
