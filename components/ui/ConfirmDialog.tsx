"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Shared confirmation modal, built on the native <dialog> element rather
 * than a component library — see DESIGN_SYSTEM.md's modal guidance. Native
 * <dialog>.showModal() gives focus-trapping, Escape-to-close, and a
 * ::backdrop for free.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="rounded-lg border border-gray-200 p-0 shadow-lg backdrop:bg-black/40"
    >
      <div className="w-80 max-w-full space-y-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
