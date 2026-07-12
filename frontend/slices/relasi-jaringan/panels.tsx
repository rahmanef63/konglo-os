"use client";

// Static side panels for Relasi & Jaringan (slice-local presentation only).
// Split out of screen.tsx to keep the orchestrator under the ~200-line cap.
// Follow-ups + meeting log are illustrative (no meetings table yet): the demo
// user sees the in-code mock; a real user gets a neutral empty state.
import { SectionCard, EmptyState, useIsDemo } from "@/frontend/shared";
import { safeColor } from "@/lib/safe-css";
import { FOLLOWUPS, MEETING_LOG } from "./data";

export function RelasiPanels() {
  const isDemo = useIsDemo();
  return (
    <div className="space-y-4">
      <SectionCard title="Follow-up Mendesak" sample={isDemo}>
        {isDemo ? (
          <div className="space-y-2.5">
            {FOLLOWUPS.map((f) => (
              <div key={f.name} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: safeColor(f.color) }} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-foreground">{f.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{f.task}</span>
                  </span>
                </span>
                <span className="rounded-full border border-[color:var(--color-mk-green)]/50 px-2 py-0.5 text-xs text-[color:var(--color-mk-green)]">✓</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Belum ada follow-up." />
        )}
      </SectionCard>
      <SectionCard title="Log Pertemuan" sample={isDemo}>
        {isDemo ? (
          <div className="space-y-2.5">
            {MEETING_LOG.map((m) => (
              <div key={m.text} className="flex items-center gap-2.5">
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{m.date}</span>
                <span className="min-w-0 truncate text-sm text-foreground">{m.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Belum ada log pertemuan." />
        )}
      </SectionCard>
    </div>
  );
}
