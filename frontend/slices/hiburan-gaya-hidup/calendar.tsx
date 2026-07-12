"use client";

// Static lifestyle calendar for Hiburan & Gaya Hidup (slice-local presentation).
// Split out of screen.tsx to keep the orchestrator under the ~200-line cap.
// The illustrative month scale ('data contoh') is DEMO-only; a real user sees a
// plain, empty scale (no fabricated events) until live data exists.
import { SectionCard, Pill, useIsDemo } from "@/frontend/shared";
import { DAYS, CALENDAR_EVENTS } from "./data";

export function LifestyleCalendar() {
  const isDemo = useIsDemo();
  // Demo shows the illustrative heatmap; a real user gets an empty scale.
  const marks: Record<number, string> = isDemo ? CALENDAR_EVENTS : {};
  return (
    <SectionCard
      title="Kalender Gaya Hidup"
      sub={isDemo ? "Mei 2026 · data contoh" : "Mei 2026"}
      action={
        <div className="flex gap-1.5">
          <Pill>‹</Pill>
          <Pill>›</Pill>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] text-muted-foreground">{d}</div>
        ))}
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            className="relative min-h-[42px] rounded-lg border border-border p-1.5 text-left"
            style={{ background: marks[i] ? "var(--muted)" : "transparent" }}
          >
            <span className="text-[11px] text-muted-foreground">{i + 1}</span>
            {marks[i] && (
              <span
                className="absolute inset-x-1.5 bottom-1.5 h-1.5 rounded-full"
                style={{ background: marks[i] }}
              />
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
