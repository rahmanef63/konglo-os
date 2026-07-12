"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

// Hook form for inline row-delete buttons that carry their own styling (the
// gold/destructive text links in kesehatan/concierge/kekayaan-kas can't swap to
// the outline <Button> without a visual regression). Wraps any delete callback
// with the same confirm + in-flight guard the DeleteButton applies.
export function useDeleteConfirm(
  onConfirm: () => void | Promise<void>,
  opts?: { label?: string; confirmMessage?: string },
) {
  const [pending, setPending] = useState(false);
  const run = useCallback(async () => {
    if (pending) return;
    const msg =
      opts?.confirmMessage ??
      `Hapus ${opts?.label ? `"${opts.label}"` : "item ini"}? Tindakan ini tidak dapat dibatalkan.`;
    if (!window.confirm(msg)) return;
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }, [pending, onConfirm, opts?.confirmMessage, opts?.label]);
  return { pending, run };
}

// Shared "Hapus" action for every CRUD DetailSheet/row. Fixes the double-delete
// hole: each call site used to fire `await del()` immediately and stay enabled
// during the round-trip, so a double-click double-deleted the record.
//
// Two guards, matching the data-studio DatabaseMenu UX bar:
//  1. window.confirm before firing — native is fine here (ponytail: a bespoke
//     confirm dialog buys nothing over the browser's for a destructive yes/no).
//  2. pending state disables the button while onConfirm is in flight, so the
//     second click can't land. Re-enables if the mutation rejects (retryable).
export function DeleteButton({
  onConfirm,
  label,
  confirmMessage,
  children = "Hapus",
}: {
  onConfirm: () => void | Promise<void>;
  /** Record name, woven into the default confirm prompt. */
  label?: string;
  /** Override the whole confirm string. */
  confirmMessage?: string;
  children?: React.ReactNode;
}) {
  // Reuse the hook — DeleteButton IS useDeleteConfirm wired to the outline button.
  const { pending, run } = useDeleteConfirm(onConfirm, { label, confirmMessage });
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={run}>
      {pending ? "Menghapus…" : children}
    </Button>
  );
}
