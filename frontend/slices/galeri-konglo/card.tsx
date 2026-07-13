"use client";

import { Building2, Users } from "lucide-react";
import { GlassCard, Pill } from "@/frontend/shared";
import type { KongloGroup } from "./types";

// One conglomerate card in the gallery grid. Whole card is the tap target →
// opens the group's dashboard sheet.
export function KongloCard({
  group,
  onOpen,
}: {
  group: KongloGroup;
  onOpen: (id: string) => void;
}) {
  const lead = group.people[0];
  return (
    <button
      type="button"
      onClick={() => onOpen(group.id)}
      className="group w-full text-left"
      aria-label={`Buka dasbor ${group.name}`}
    >
      <GlassCard className="h-full p-4 transition-[transform,box-shadow,border-color] duration-200 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:shadow-md group-hover:border-[color:var(--color-gold)]/45 group-focus-visible:border-[color:var(--color-gold)]">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate font-display text-base font-bold text-foreground">
            {group.name}
          </h3>
          {group.founded && (
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
              sejak {group.founded}
            </span>
          )}
        </div>
        {lead && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {lead.role}: {lead.name}
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {group.sectors.slice(0, 3).map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
          {group.sectors.length > 3 && <Pill>+{group.sectors.length - 3}</Pill>}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Building2 aria-hidden className="h-3.5 w-3.5" />
            {group.companies.length} perusahaan
          </span>
          <span className="inline-flex items-center gap-1">
            <Users aria-hidden className="h-3.5 w-3.5" />
            {group.people.length} tokoh
          </span>
          {group.netWorth && (
            <span className="ml-auto font-medium text-[color:var(--color-gold)]">
              ~US${group.netWorth.valueBUSD} M
            </span>
          )}
        </div>
      </GlassCard>
    </button>
  );
}
