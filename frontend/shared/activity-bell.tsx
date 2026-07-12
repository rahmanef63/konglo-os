"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "convex/react";
import { Bell } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useIsDemo } from "./use-me";
import { timeAgoID } from "@/lib/format";

const SEEN_KEY = "konglo.activity.seen";

// Topbar bell: unread dot + popover feed of the server-side audit log
// (features/activity). Opening marks everything seen (localStorage watermark).
// Popover is portaled (escapes topbar overflow/stacking) and anchored to the
// trigger; focus moves in on open and restores to the trigger on close.
export function ActivityBell() {
  // Demo never reads the real audit log — it stays empty for the demo session.
  const isDemo = useIsDemo();
  const items = useQuery(api.features.activity.queries.recent, isDemo ? "skip" : { limit: 10 });
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [seen, setSeen] = useState(0);
  const [pos, setPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setSeen(Number(localStorage.getItem(SEEN_KEY) ?? 0));
  }, []);

  // Anchor the portaled popover under the trigger (right-aligned, like top-10).
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Move focus into the popover on open; restore to the trigger on close.
  useEffect(() => {
    if (!open) return;
    const trigger = btnRef.current;
    const node = popRef.current;
    if (!node) return;
    const first = node.querySelector<HTMLElement>(
      'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',
    );
    (first ?? node).focus();
    return () => trigger?.focus();
  }, [open]);

  const unread = (items ?? []).filter((i) => i.at > seen).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const now = Date.now();
      localStorage.setItem(SEEN_KEY, String(now));
      setSeen(now);
    }
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label="Aktivitas"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className="relative grid h-11 w-11 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground sm:h-8 sm:w-8"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[color:var(--color-gold)] px-0.5 text-[9px] font-bold text-[color:var(--color-gold-ink)]">
            {unread}
          </span>
        )}
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            ref={popRef}
            role="dialog"
            aria-label="Aktivitas Terbaru"
            tabIndex={-1}
            style={{ top: pos.top, right: pos.right }}
            className="glass animate-dialog fixed z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl p-3 shadow-2xl outline-none"
          >
            <div className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-gold)]">
              Aktivitas Terbaru
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {(items ?? []).map((i) => (
                <div key={i._id} className="flex gap-2.5 rounded-lg px-1.5 py-2 hover:bg-muted/40">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-gold)]" />
                  <div className="min-w-0">
                    <div className="text-sm leading-snug text-foreground">{i.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {i.meta ? `${i.meta} · ` : ""}
                      {timeAgoID(i.at)}
                    </div>
                  </div>
                </div>
              ))}
              {items && items.length === 0 && (
                <div className="px-1.5 py-6 text-center text-sm text-muted-foreground">
                  Belum ada aktivitas.
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
