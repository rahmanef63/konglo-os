"use client";

import { AlertTriangle, Eye, CircleCheck } from "lucide-react";
import { GlassCard, Eyebrow, useHonorific } from "@/frontend/shared";
import type { Signal } from "@/convex/features/office/signals";

// Sinyal Hari Ini — the decision card atop Beranda. Rule-based signals (Convex
// getSignals), ordered warn→watch→good. Renders nothing when there are no
// signals so the screen never shows an empty shell. Obsidian+gold, compact,
// scannable — the moment the owner thinks "ini bisnis saya".
const SEVERITY: Record<
  Signal["severity"],
  { icon: typeof AlertTriangle; color: string; label: string }
> = {
  warn: { icon: AlertTriangle, color: "var(--color-mk-red)", label: "Perlu keputusan" },
  watch: { icon: Eye, color: "var(--color-gold)", label: "Perlu diperhatikan" },
  good: { icon: CircleCheck, color: "var(--color-mk-green)", label: "Sehat" },
};

export function SinyalHariIni({ signals }: { signals: Signal[] }) {
  const honorific = useHonorific();
  if (!signals || signals.length === 0) return null;

  return (
    <GlassCard className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>Sinyal Hari Ini</Eyebrow>
        <span className="text-[11px] font-medium text-muted-foreground">
          {signals.length} hal yang menanti perhatian {honorific}
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {signals.map((s) => {
          const cfg = SEVERITY[s.severity];
          const Icon = cfg.icon;
          return (
            <li
              key={s.id}
              className="flex gap-3 border-l-2 pl-3"
              style={{ borderColor: cfg.color }}
            >
              <Icon
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: cfg.color }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-display text-sm font-semibold leading-snug text-foreground">
                    {s.title}
                  </p>
                  <span
                    className="shrink-0 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {s.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
