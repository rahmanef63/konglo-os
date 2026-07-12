"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { SectionCard, Skeleton, EmptyState, GoldButton, useIsDemo } from "@/frontend/shared";
import { rp } from "@/lib/format";
import { safeColor } from "@/lib/safe-css";

type Alloc = Doc<"allocations">;

// "Alokasi Portofolio" panel: skeleton (query undefined) / empty state / editable
// rows. Extracted from screen.tsx to keep that file <200 lines (rr). `allocations`
// is the raw query result so the panel owns its own loading/empty branching.
// Allocations are Convex-only (no illustrative mock), so a DEMO user sees the
// neutral empty state and no write controls.
export function AllocList({
  allocations,
  onAdd,
  onEdit,
  onRemove,
}: {
  allocations: Alloc[] | undefined;
  onAdd: () => void;
  onEdit: (a: Alloc) => void;
  onRemove: (id: Id<"allocations">, label: string) => void;
}) {
  const isDemo = useIsDemo();
  const rows = isDemo ? [] : allocations;
  return (
    <SectionCard
      title="Alokasi Portofolio"
      sub="Porsi tiap kelas aset · principal/cfo dapat mengubah"
      action={isDemo ? undefined : <GoldButton onClick={onAdd} />}
    >
      {rows === undefined ? (
        <div className="space-y-1">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState message="Belum ada alokasi portofolio." />
      ) : (
        <div className="space-y-1">
          {rows.map((a) => (
            <div key={a.slug} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: safeColor(a.accent) }} />
                <span className="truncate text-sm text-foreground">{a.label}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="whitespace-nowrap text-sm font-semibold text-foreground">{rp(a.value)}</span>
                <button onClick={() => onEdit(a)} className="text-xs text-muted-foreground transition-colors hover:text-foreground">Ubah</button>
                <button onClick={() => onRemove(a._id, a.label)} className="text-xs text-muted-foreground transition-colors hover:text-destructive">Hapus</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
