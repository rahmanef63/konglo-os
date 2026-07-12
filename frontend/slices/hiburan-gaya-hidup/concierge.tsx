"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  SectionCard,
  Pill,
  FormModal,
  Skeleton,
  DetailSheet,
  DeleteButton,
  useDeleteConfirm,
  GoldButton,
  useIsDemo,
} from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  useConciergeWrites,
  RESERVATION_FIELDS,
  REQUEST_FIELDS,
} from "./concierge-writes";

type Reservation = Doc<"conciergeReservations">;

// One recent-request row. The X delete uses useDeleteConfirm so it confirms once
// and disables in-flight (no double-delete) without losing the inline X styling.
function RequestRow({ label, onDelete }: { label: string; onDelete: () => void | Promise<void> }) {
  const { pending, run } = useDeleteConfirm(onDelete, { label });
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="min-w-0 truncate text-foreground">{label}</span>
      <span className="flex shrink-0 items-center gap-1.5">
        <Pill color="var(--color-mk-green)">✓</Pill>
        <button
          onClick={run}
          disabled={pending}
          aria-label={`Hapus permintaan ${label}`}
          className="rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  );
}

// "Reservasi Konsierge" panel: live reservation quick-actions (tap a tile to
// edit/delete, "+ Tambah" to create) + the recent-requests list (add + per-row
// delete). Replaces the former dead-end read-only grid. Extracted from
// screen.tsx to keep both files under the ~200-line cap. Writes are
// principal-only server-side; a blocked write surfaces a warn toast.
export function ConciergePanel() {
  const isDemo = useIsDemo();
  // Demo does NOT read Convex; this slice has no mock concierge rows, so both
  // lists resolve empty ([]) for the demo user (read-only, neutral state).
  const rawReservations = useQuery(
    api.features.lifestyle.queries.listReservations,
    isDemo ? "skip" : {},
  );
  const rawRequests = useQuery(
    api.features.lifestyle.queries.listRequests,
    isDemo ? "skip" : {},
  );
  const reservations: Reservation[] | undefined = isDemo ? [] : rawReservations;
  const requests: Doc<"conciergeRequests">[] | undefined = isDemo ? [] : rawRequests;
  const { addRes, editRes, delRes, addReq, delReq } = useConciergeWrites();
  const [open, setOpen] = useState<Reservation | null>(null);
  const [addRes_, setAddRes] = useState(false);
  const [edit, setEdit] = useState<Reservation | null>(null);
  const [addReq_, setAddReq] = useState(false);

  return (
    <SectionCard
      title="Reservasi Konsierge"
      sub="Permintaan cepat · ketuk untuk kelola"
      action={isDemo ? undefined : <GoldButton className="shrink-0" onClick={() => setAddRes(true)} />}
    >
      <div className="grid grid-cols-2 gap-2.5">
        {reservations === undefined
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] rounded-xl" />
            ))
          : reservations.length === 0
          ? <p className="col-span-2 py-2 text-xs text-muted-foreground">Belum ada reservasi.</p>
          : reservations.map((r) => (
              <button
                key={r._id}
                onClick={() => setOpen(r)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/60"
              >
                <span className="text-2xl">{r.emoji}</span>
                <span className="text-sm text-foreground">{r.label}</span>
              </button>
            ))}
      </div>

      <div className="mt-3 border-t border-border/60 pt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Permintaan terakhir</span>
          {!isDemo && (
            <button
              onClick={() => setAddReq(true)}
              className="rounded-full border border-gold/50 px-2 py-0.5 text-[11px] font-medium text-gold transition-colors hover:bg-gold/10"
            >
              + Catat
            </button>
          )}
        </div>
        <div className="space-y-1.5">
          {requests === undefined ? (
            <Skeleton className="h-5 w-full rounded" />
          ) : requests.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada permintaan.</p>
          ) : (
            requests.map((r) => (
              <RequestRow key={r._id} label={r.label} onDelete={() => delReq(r._id, r.label)} />
            ))
          )}
        </div>
      </div>

      <DetailSheet
        open={open !== null}
        onClose={() => setOpen(null)}
        eyebrow="Reservasi konsierge"
        title={open ? `${open.emoji} ${open.label}` : ""}
        actions={
          open && (
            <>
              <DeleteButton label={open.label} onConfirm={async () => { await delRes(open._id, open.label); setOpen(null); }} />
              <Button size="sm" onClick={() => { setEdit(open); setOpen(null); }}>
                Ubah
              </Button>
            </>
          )
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Aksi cepat konsierge. Konsierge menindaklanjuti permintaan ini 24/7.
        </p>
      </DetailSheet>

      <FormModal
        open={addRes_}
        onClose={() => setAddRes(false)}
        title="Tambah Reservasi"
        subtitle="Aksi cepat konsierge baru"
        fields={RESERVATION_FIELDS}
        onSubmit={addRes}
      />

      <FormModal
        open={edit !== null}
        onClose={() => setEdit(null)}
        title={edit ? `Ubah · ${edit.label}` : "Ubah reservasi"}
        subtitle="Perbarui aksi cepat konsierge"
        submitLabel="Simpan"
        initial={edit ? { emoji: edit.emoji, label: edit.label } : undefined}
        fields={RESERVATION_FIELDS}
        onSubmit={async (v) => { if (edit) await editRes(edit._id, v); }}
      />

      <FormModal
        open={addReq_}
        onClose={() => setAddReq(false)}
        title="Catat Permintaan"
        subtitle="Permintaan baru untuk konsierge"
        fields={REQUEST_FIELDS}
        onSubmit={addReq}
      />
    </SectionCard>
  );
}
