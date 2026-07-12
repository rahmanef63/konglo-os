"use client";

import { SectionCard, DeleteButton, EmptyState, useIsDemo } from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { safeColor } from "@/lib/safe-css";
import { HOURS, SHIFTS } from "./data";

// Slice-local presentation bits, split out of screen.tsx to keep that file under
// the rr cap (mirrors how portofolio-bisnis extracts its co-list panel).

// Shared Hapus/Ubah footer for the staff + zone drill-down sheets. onDelete is
// the principal-gated write (warn-toasts on Forbidden); onEdit opens the form.
// DeleteButton wraps onDelete with native confirm + in-flight disable so a
// double-click can't double-delete a staff/zone record.
export function EditDeleteActions({ onDelete, onEdit, label }: { onDelete: () => void; onEdit: () => void; label?: string }) {
  return (
    <>
      <DeleteButton label={label} onConfirm={onDelete} />
      <Button size="sm" onClick={onEdit}>Ubah</Button>
    </>
  );
}

// Duty-roster heatmap ("Jadwal Jaga Hari Ini"). Illustrative-only: driven by the
// slice-local HOURS axis + SHIFTS on()-functions with no server source. Shown to
// the demo user as mock; a real user gets a neutral empty state (no live jadwal).
export function DutySchedule() {
  const isDemo = useIsDemo();
  return (
    <SectionCard title="Jadwal Jaga Hari Ini" sub={isDemo ? "Shift keamanan & operasional · data contoh" : "Shift keamanan & operasional"}>
      {!isDemo ? (
        <EmptyState message="Belum ada jadwal jaga." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="grid min-w-[20rem] grid-cols-8 gap-1.5">
            {HOURS.map((h) => (
              <div key={h} className="text-center font-mono text-[11px] text-muted-foreground">{h}:00</div>
            ))}
            {SHIFTS.map((shift) =>
              Array.from({ length: 8 }).map((_, i) => (
                <div key={`${shift.name}-${i}`} className="h-5 rounded-md border border-border" style={{ background: shift.on(i) ? safeColor(shift.color) : "var(--input)" }} />
              )),
            )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            {SHIFTS.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: safeColor(s.color) }} /> {s.name}
              </span>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}
