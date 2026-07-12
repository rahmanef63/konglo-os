"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { type FormField } from "@/frontend/shared";
import { useRunWrite } from "@/frontend/shared/run-write";

const RES_LIST = api.features.lifestyle.queries.listReservations;
const REQ_LIST = api.features.lifestyle.queries.listRequests;

// Concierge create/edit fields. Reservations are an emoji + a short label; a
// request is just the label line shown under the grid. No money fields here.
export const RESERVATION_FIELDS: FormField[] = [
  { name: "emoji", label: "Ikon", placeholder: "🛥️", required: true },
  { name: "label", label: "Jenis reservasi", placeholder: "Yacht akhir pekan", required: true },
];

export const REQUEST_FIELDS: FormField[] = [
  { name: "label", label: "Permintaan", placeholder: "Meja VIP · Restoran Lokananta", required: true },
];

// Next append order for an optimistic insert: highest existing order + 1.
function nextOrder(rows: { order: number }[]): number {
  return rows.reduce((m, r) => Math.max(m, r.order), 0) + 1;
}

// Concierge reservation + request writes bound to toast + server audit log.
// Mutations are requireFeatureWrite("hiburan-gaya-hidup") -> principal only; cfo
// and staf never even see this slice, so a blocked write means stale session ->
// friendly warn, form stays open. create + delete carry an optimistic update over
// the matching list query (Convex auto-rolls-back on reject); edit stays plain.
export function useConciergeWrites() {
  const m = api.features.lifestyle.mutations;
  const createRes = useMutation(m.createReservation).withOptimisticUpdate((store, args) => {
    const existing = store.getQuery(RES_LIST);
    if (!existing) return;
    // eslint-disable-next-line react-hooks/purity -- deferred to mutation dispatch, not render
    const now = Date.now();
    const row: Doc<"conciergeReservations"> = {
      _id: `optimistic-${now}` as Id<"conciergeReservations">,
      _creationTime: now,
      emoji: args.emoji,
      label: args.label,
      order: nextOrder(existing),
    };
    store.setQuery(RES_LIST, {}, [...existing, row]);
  });
  const updateRes = useMutation(m.updateReservation);
  const removeRes = useMutation(m.removeReservation).withOptimisticUpdate((store, args) => {
    const existing = store.getQuery(RES_LIST);
    if (!existing) return;
    store.setQuery(RES_LIST, {}, existing.filter((r) => r._id !== args.id));
  });
  const createReq = useMutation(m.createRequest).withOptimisticUpdate((store, args) => {
    const existing = store.getQuery(REQ_LIST);
    if (!existing) return;
    // eslint-disable-next-line react-hooks/purity -- deferred to mutation dispatch, not render
    const now = Date.now();
    const row: Doc<"conciergeRequests"> = {
      _id: `optimistic-${now}` as Id<"conciergeRequests">,
      _creationTime: now,
      label: args.label,
      order: nextOrder(existing),
    };
    store.setQuery(REQ_LIST, {}, [...existing, row]);
  });
  const removeReq = useMutation(m.removeRequest).withOptimisticUpdate((store, args) => {
    const existing = store.getQuery(REQ_LIST);
    if (!existing) return;
    store.setQuery(REQ_LIST, {}, existing.filter((r) => r._id !== args.id));
  });
  const run = useRunWrite();

  const addRes = (v: Record<string, string>) =>
    run({
      call: () => createRes({ emoji: v.emoji, label: v.label }),
      ok: `Reservasi ${v.label} ditambahkan`,
      log: [`Reservasi konsierge ditambahkan · ${v.label}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal",
    });

  const editRes = (id: Id<"conciergeReservations">, v: Record<string, string>) =>
    run({
      call: () => updateRes({ id, emoji: v.emoji, label: v.label }),
      ok: `Reservasi ${v.label} diperbarui`,
      log: [`Reservasi konsierge diperbarui · ${v.label}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal",
    });

  const delRes = (id: Id<"conciergeReservations">, label: string) =>
    run({
      call: () => removeRes({ id }),
      ok: `Reservasi ${label} dihapus`,
      okTone: "warn",
      log: [`Reservasi konsierge dihapus · ${label}`],
      warn: "Gagal menghapus — perlu akses principal",
    });

  const addReq = (v: Record<string, string>) =>
    run({
      call: () => createReq({ label: v.label }),
      ok: `Permintaan ${v.label} dicatat`,
      log: [`Permintaan konsierge dicatat · ${v.label}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal",
    });

  const delReq = (id: Id<"conciergeRequests">, label: string) =>
    run({
      call: () => removeReq({ id }),
      ok: `Permintaan ${label} dihapus`,
      okTone: "warn",
      log: [`Permintaan konsierge dihapus · ${label}`],
      warn: "Gagal menghapus — perlu akses principal",
    });

  return { addRes, editRes, delRes, addReq, delReq };
}
