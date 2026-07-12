"use client";

import type { ReactNode } from "react";
import { Modal } from "./modal";
import { safeColor } from "@/lib/safe-css";

// Drill-down detail surface (bottom sheet on mobile, centered dialog on sm+).
// Wraps Modal with the prototype openSheet anatomy: eyebrow → title → subtitle
// → body → actions. Accent tints the eyebrow + a thin top rule.
export function DetailSheet({
  open,
  onClose,
  eyebrow,
  title,
  subtitle,
  accent = "var(--color-gold)",
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  accent?: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose} label={title}>
      <span
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl"
        style={{ background: safeColor(accent) ?? "var(--color-gold)" }}
      />
      <div className="max-h-[82vh] overflow-y-auto p-5 pr-12 sm:p-6 sm:pr-12">
        {eyebrow && (
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: safeColor(accent) ?? "var(--color-gold)" }}
          >
            {eyebrow}
          </div>
        )}
        <h2 className="mt-1 font-display text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        {children && <div className="mt-4">{children}</div>}
        {actions && <div className="mt-5 flex flex-wrap justify-end gap-2">{actions}</div>}
      </div>
    </Modal>
  );
}
