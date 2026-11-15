"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  /** A plain question naming the action, e.g. "Claim this piece?". */
  title: string;
  /** What will happen, in plain words. */
  children: ReactNode;
  /** Named for the action, e.g. "Claim this piece". */
  confirmLabel: string;
  /** Shown on the confirm button while the action runs. */
  busyLabel?: string;
  /** Named for staying put, e.g. "Keep my claim". */
  cancelLabel: string;
  tone?: "cardinal" | "gold";
  /** Runs the action. The dialog stays open, with its buttons disabled, until this settles. */
  onConfirm: () => void | Promise<void>;
  /** Called when the dialog closes for any reason: cancel, Escape, or after the action. */
  onClose: () => void;
  /** Where focus goes afterwards if the control that opened the dialog is gone (for example, its row was removed). */
  fallbackFocus?: RefObject<HTMLElement | null>;
};

/**
 * The step before an action that commits something or cannot easily be undone.
 * A native modal dialog: focus moves inside and cannot leave, Escape cancels,
 * and focus returns to the control that opened it.
 */
export function ConfirmDialog({ open, title, children, confirmLabel, busyLabel, cancelLabel, tone = "cardinal", onConfirm, onClose, fallbackFocus }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      d.showModal();
      cancelRef.current?.focus(); // focus starts on the safe choice
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  // After closing, and after the page has redrawn, put focus back.
  function restoreFocus() {
    requestAnimationFrame(() => {
      const from = opener.current;
      opener.current = null;
      if (from?.isConnected && !from.hasAttribute("disabled")) from.focus();
      else fallbackFocus?.current?.focus();
    });
  }

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      ref.current?.close();
    }
  }

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={(e) => {
        if (busy) e.preventDefault(); // Escape does nothing while the action is running
      }}
      onClose={(e) => {
        if (e.target !== e.currentTarget) return;
        onClose();
        restoreFocus();
      }}
      onKeyDown={(e) => {
        // Keep Tab inside the dialog, so focus never wanders to the browser's own controls.
        if (e.key !== "Tab") return;
        const stops = [...(ref.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]") ?? [])];
        if (stops.length === 0) return;
        const first = stops[0];
        const last = stops[stops.length - 1];
        const at = document.activeElement;
        if (e.shiftKey && (at === first || !ref.current?.contains(at))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (at === last || !ref.current?.contains(at))) {
          e.preventDefault();
          first.focus();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) ref.current?.close(); // a tap on the backdrop cancels
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[460px] rounded-[14px] border-2 border-black bg-white p-0 text-left text-black shadow-[6px_6px_0_var(--black)] backdrop:bg-black/60"
    >
      {open && (
        <div className="space-y-4 p-4">
          <h2 id={titleId} className="text-[24px] font-bold leading-[1.12] tracking-[-0.01em]">{title}</h2>
          <div id={bodyId} className="space-y-2 text-[16px] font-normal leading-normal">{children}</div>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
            <button ref={cancelRef} type="button" disabled={busy} onClick={() => ref.current?.close()} className="btn btn-plain">
              {cancelLabel}
            </button>
            <button type="button" disabled={busy} onClick={confirm} className={cn("btn", tone === "gold" ? "btn-gold" : "btn-cardinal")}>
              {busy ? (busyLabel ?? "Working...") : confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
