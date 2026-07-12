"use client";

import { SectionCard, Sparkline, Skeleton, EmptyState, GoldButton, useIsDemo } from "@/frontend/shared";
import { cn } from "@/lib/utils";
import type { Holding } from "./data";

const UP = "var(--color-mk-green)";
const DOWN = "var(--color-mk-red)";

// "Holdings & Watchlist" panel: + Tambah toolbar + loading skeleton / empty
// state / drill-down rows. Extracted from screen.tsx to keep that file <200
// lines (rr). `loading` = query still undefined; `rows` = live holdings docs.
export function HoldingsList({
  rows,
  loading,
  onAdd,
  onOpen,
}: {
  rows: Holding[];
  loading: boolean;
  onAdd: () => void;
  onOpen: (h: Holding) => void;
}) {
  // Demo is read-only: the shared holdings table is never mutated from the demo
  // session, so the "+ Tambah" control is disabled (backend also blocks it).
  const isDemo = useIsDemo();
  return (
    <SectionCard
      title="Holdings & Watchlist"
      sub="Ketuk instrumen untuk detail posisi"
      action={
        <GoldButton onClick={onAdd} disabled={isDemo} />
      }
    >
      <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-1 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground sm:grid-cols-[2fr_1fr_1fr_auto]">
        <span>Instrumen</span>
        <span className="text-right">Nilai</span>
        <span className="text-right">Hari ini</span>
        <span className="hidden text-right sm:block">Tren</span>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[56px] w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState message="Belum ada instrumen. Tambahkan posisi pertama portofolio." />
      ) : (
        <div className="space-y-2">
          {rows.map((h) => (
            <button
              key={h._id}
              onClick={() => onOpen(h)}
              className="grid w-full grid-cols-[2fr_1fr_1fr] items-center gap-3 rounded-xl border border-border bg-muted/30 p-2.5 text-left transition-colors hover:bg-muted/60 sm:grid-cols-[2fr_1fr_1fr_auto]"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-muted font-mono text-[11px] text-muted-foreground">
                  {h.ticker.slice(0, 2)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{h.name}</span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">{h.ticker}</span>
                </span>
              </span>
              <span className="text-right text-sm font-semibold text-foreground">{h.value}</span>
              <span className={cn("text-right text-sm font-medium", h.up ? "text-[color:var(--color-mk-green)]" : "text-destructive")}>
                {h.change}
              </span>
              <span className="hidden justify-end sm:flex">
                <Sparkline points={h.points ?? []} color={h.up ? UP : DOWN} width={64} height={26} />
              </span>
            </button>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
