"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Dependency-free overlay primitive: bottom sheet on mobile, centered dialog
// on sm+. Handles ESC, backdrop click, body scroll-lock, focus trap. Theme tokens only.
const FOCUSABLE =
  'a[href],area[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Trap Tab within `panel` while `open`: focus the first focusable on open,
// cycle focus at the edges, and restore focus to the trigger on close.
function useFocusTrap(
  open: boolean,
  panel: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const node = panel.current;
    if (!node) return;
    const restoreTo = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Initial focus: first focusable inside the panel, else the panel itself.
    const first = focusables()[0];
    (first ?? node).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = focusables();
      if (els.length === 0) {
        e.preventDefault();
        node.focus();
        return;
      }
      const firstEl = els[0];
      const lastEl = els[els.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstEl || active === node)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("keydown", onKey);
      restoreTo?.focus?.();
    };
  }, [open, panel]);
}

export function Modal({
  open,
  onClose,
  children,
  label = "Dialog",
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label?: string;
  // Applied to the portal root — e.g. "dark" so a dialog opened from the
  // force-dark landing renders in dark tokens too (the portal escapes the subtree).
  className?: string;
}) {
  // SSR-safe portal: server + first client render both yield null, so there's
  // no hydration mismatch (React #418). Portal mounts only after effect runs.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // sheet (bottom) until sm, dialog (centered) from sm up
  const wrap = "items-end justify-center sm:items-center sm:p-4";
  const panelAnim = "animate-sheet sm:animate-dialog";
  const panelShape =
    "w-full rounded-t-2xl pb-[env(safe-area-inset-bottom)] sm:max-w-md sm:rounded-2xl sm:pb-0";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className={`${className} fixed inset-0 z-50 flex ${wrap} bg-black/60 animate-overlay`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`glass relative ${panelShape} ${panelAnim} shadow-2xl outline-none`}
      >
        {/* iOS-style drag grabber (mobile bottom-sheet only). */}
        <div aria-hidden className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-muted-foreground/30 sm:hidden" />
        <button
          type="button"
          aria-label="Tutup"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
