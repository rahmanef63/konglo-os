"use client";

import { SectionCard, PillToggleRow, Avatar, Skeleton, EmptyState, GoldButton } from "@/frontend/shared";
import { rp, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { safeColor } from "@/lib/safe-css";
import { SORT_LABELS, type Sub } from "./data";

// "Kinerja Anak Usaha" panel: sort toolbar + loading skeleton / empty state /
// drill-down rows. Extracted from screen.tsx to keep that file <200 lines (rr).
// `loading` = query still undefined; `cos` = already sorted live rows.
export function CoList({
  cos,
  loading,
  sort,
  onSort,
  onAdd,
  onOpen,
}: {
  cos: Sub[];
  loading: boolean;
  sort: string;
  onSort: (key: string) => void;
  // Omitted in demo (read-only) → the add button is hidden.
  onAdd?: () => void;
  onOpen: (c: Sub) => void;
}) {
  return (
    <SectionCard
      title="Kinerja Anak Usaha"
      sub="Ketuk untuk drill-down P&L"
      action={
        <div className="flex flex-wrap justify-end gap-1.5">
          {onAdd && <GoldButton onClick={onAdd} />}
          <PillToggleRow options={SORT_LABELS} value={sort} onChange={onSort} />
        </div>
      }
    >
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[60px] w-full rounded-xl" />
          ))}
        </div>
      ) : cos.length === 0 ? (
        <EmptyState message="Belum ada anak usaha. Tambahkan entitas pertama grup." />
      ) : (
        <div className="space-y-2">
          {cos.map((c) => (
            <button
              key={c.slug}
              onClick={() => onOpen(c)}
              style={{ borderLeftColor: safeColor(c.color) }}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border border-l-4 bg-muted/30 p-3 text-left transition-colors hover:bg-muted/60"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={c.name} color={c.color} size={36} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{c.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {c.sector} · milik {c.ownership}%
                  </span>
                </span>
              </span>
              <span className="text-right">
                <span className="block whitespace-nowrap text-sm font-semibold text-foreground">{rp(c.revenue)}</span>
                <span
                  className={cn(
                    "block text-xs font-medium",
                    c.trend >= 0 ? "text-[color:var(--color-mk-green)]" : "text-destructive",
                  )}
                >
                  {pct(c.trend)} margin
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
