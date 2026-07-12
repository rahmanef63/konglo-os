import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import { Pill } from "./pill";

type Tone = "up" | "down" | "flat";

const TONE: Record<Tone, string> = {
  up: "text-[color:var(--color-mk-green)]",
  down: "text-destructive",
  flat: "text-muted-foreground",
};

// Headline KPI tile = prototype <Stat>. `accent` paints a gold top-rule for the
// hero figure of a screen; `hint` is free text (delta / context) toned up/down.
// `sample` flags a tile whose value/hint is illustrative (non-live) data —
// renders a "data contoh" pill pinned top-right inside the tile (the GlassCard is
// already `relative`), replacing the old absolute-positioned overlay wrapper.
export function StatTile({
  label,
  value,
  hint,
  tone = "flat",
  accent = false,
  sample = false,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  accent?: boolean;
  sample?: boolean;
}) {
  return (
    <GlassCard
      className={cn(
        "relative overflow-hidden p-4 transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md",
        accent && "border-[color:var(--color-gold)]/45",
      )}
    >
      {accent && (
        <span className="absolute inset-x-0 top-0 h-[3px] bg-[color:var(--color-gold)]" />
      )}
      {sample && (
        <Pill className="pointer-events-none absolute right-2 top-2">data contoh</Pill>
      )}
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 font-display text-2xl font-bold leading-tight text-foreground">
        {value}
      </div>
      {hint && <div className={cn("mt-1 text-xs font-medium", TONE[tone])}>{hint}</div>}
    </GlassCard>
  );
}

// Responsive KPI strip: 2-up on mobile, 4-up on desktop.
export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}
