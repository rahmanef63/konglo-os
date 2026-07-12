"use client";

import { SectionCard, PersonRow, Pill, Skeleton, EmptyState, useDeleteConfirm, GoldButton, useIsDemo } from "@/frontend/shared";
import type { TeamMember, ScheduleEntry } from "./data";

// Per-row delete — a distinct control so the row tap stays "edit". Muted until
// hovered, then destructive-tinted; stops propagation so it never opens the edit.
// useDeleteConfirm adds native confirm + in-flight disable (no double-delete).
function DelBtn({ onClick, label }: { onClick: () => void | Promise<void>; label: string }) {
  const { pending, run } = useDeleteConfirm(onClick, { label });
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Hapus ${label}`}
      onClick={(ev) => {
        ev.stopPropagation();
        run();
      }}
      className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
    >
      {pending ? "…" : "Hapus"}
    </button>
  );
}

// Medical-team list: tap a row to edit; "Chat" stays a disabled 'segera hadir'
// affordance (no messaging feature yet). Skeleton/EmptyState preserved from P6.
export function TeamCard({
  team,
  onAdd,
  onEdit,
  onDelete,
}: {
  team: TeamMember[] | undefined;
  onAdd: () => void;
  onEdit: (m: TeamMember) => void;
  onDelete: (m: TeamMember) => void;
}) {
  // Demo is read-only: hide the add control (rows never render in demo — the list
  // resolves to empty upstream — so per-row edit/delete need no extra gating).
  const isDemo = useIsDemo();
  return (
    <SectionCard title="Tim Medis" sub="Konsierge pribadi" action={isDemo ? undefined : <GoldButton onClick={onAdd} />}>
      <div className="space-y-2">
        {team === undefined ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 rounded-lg" />)
        ) : team.length === 0 ? (
          <EmptyState message="Belum ada anggota tim medis." />
        ) : (
          team.map((m) => (
            <div key={m._id} className="flex items-center gap-2">
              <button
                onClick={() => onEdit(m)}
                className="min-w-0 flex-1 rounded-lg p-1 text-left transition-colors hover:bg-muted/40"
              >
                <PersonRow
                  name={m.name}
                  role={m.role}
                  color={m.color}
                  size={34}
                  right={
                    <span title="Chat · segera hadir">
                      <Pill className="opacity-50">Chat</Pill>
                    </span>
                  }
                />
              </button>
              <DelBtn label={m.name} onClick={() => onDelete(m)} />
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

// Schedule list: tap a row to edit. Skeleton/EmptyState preserved from P6.
export function ScheduleCard({
  schedule,
  onAdd,
  onEdit,
  onDelete,
}: {
  schedule: ScheduleEntry[] | undefined;
  onAdd: () => void;
  onEdit: (e: ScheduleEntry) => void;
  onDelete: (e: ScheduleEntry) => void;
}) {
  // Demo is read-only: hide the add control (rows never render in demo).
  const isDemo = useIsDemo();
  return (
    <SectionCard
      title="Jadwal Kesehatan"
      sub="Janji & sesi mendatang"
      action={isDemo ? undefined : <GoldButton onClick={onAdd} />}
    >
      <div className="space-y-2">
        {schedule === undefined ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)
        ) : schedule.length === 0 ? (
          <EmptyState message="Belum ada janji terjadwal." />
        ) : (
          schedule.map((e) => (
            <div key={e._id} className="flex items-center gap-2">
              <button
                onClick={() => onEdit(e)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left transition-colors hover:bg-muted/40"
              >
                <Pill color={e.color} className="shrink-0 font-mono">
                  {e.date}
                </Pill>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{e.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{e.location}</div>
                </div>
              </button>
              <DelBtn label={e.title} onClick={() => onDelete(e)} />
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}
