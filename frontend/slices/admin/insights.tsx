"use client";

import { AlertTriangle, Eye, CircleCheck } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SectionCard, Skeleton } from "@/frontend/shared";
import type { AdminInsight } from "@/convex/features/rbac/insights";

// Saran & Kritik — deterministic access/usage recommendations for the principal
// (Convex getAdminInsights, warn→watch→good) in the admin SectionCard visual
// language. Rule-based, no LLM.
const SEVERITY: Record<
  AdminInsight["severity"],
  { icon: typeof AlertTriangle; color: string; label: string }
> = {
  warn: { icon: AlertTriangle, color: "var(--color-mk-red)", label: "Perlu tindakan" },
  watch: { icon: Eye, color: "var(--color-gold)", label: "Perlu diperhatikan" },
  good: { icon: CircleCheck, color: "var(--color-mk-green)", label: "Sehat" },
};

export function AdminInsights() {
  const items = useQuery(api.features.rbac.insights.getAdminInsights);
  return (
    <SectionCard
      title="Saran & Kritik"
      sub="Rekomendasi otomatis atas struktur akses & aktivitas — berbasis aturan, tanpa AI."
    >
      {items === undefined ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => {
            const cfg = SEVERITY[s.severity];
            const Icon = cfg.icon;
            return (
              <li key={s.id} className="flex gap-3 border-l-2 pl-3" style={{ borderColor: cfg.color }}>
                <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: cfg.color }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug text-foreground">{s.title}</p>
                    <span
                      className="shrink-0 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
