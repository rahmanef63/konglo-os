"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useToast, type FormField } from "@/frontend/shared";
import { useRunWrite } from "@/frontend/shared/run-write";

const ALLOC_LIST = api.features.office.queries.listAllocations;


// Form schemas + initial-value mappers live here (alongside the write contract)
// so screen.tsx stays under the rr 200-line cap. netWorth/liabilitas are entered
// in Triliun (T) and scaled ×1e12 on save / ÷1e12 when pre-filling.
export const FIG_FIELDS: FormField[] = [
  { name: "netWorth", label: "Kekayaan bersih (Rp T)", type: "number", step: "0.1", required: true },
  { name: "liabilitas", label: "Liabilitas (Rp T)", type: "number", step: "0.1", required: true },
  { name: "debtRatio", label: "Rasio utang (%)", type: "number", step: "0.1", required: true },
  { name: "netWorthChange", label: "Perubahan (%, boleh −)", type: "number", step: "0.1", required: true },
];
export const ALLOC_FIELDS: FormField[] = [
  { name: "label", label: "Nama alokasi", type: "text", required: true },
  { name: "value", label: "Nilai (Rp)", type: "number", step: "1", required: true },
  { name: "accent", label: "Warna (token CSS)", type: "text", placeholder: "var(--color-gold)" },
];

export function figInitial(fig: Doc<"officeFigures">): Record<string, number> {
  return {
    netWorth: +(fig.netWorth / 1e12).toFixed(1),
    liabilitas: +(fig.liabilitas / 1e12).toFixed(1),
    debtRatio: fig.debtRatio,
    netWorthChange: fig.netWorthChange,
  };
}
export function allocInitial(a: Doc<"allocations">): Record<string, string | number> {
  return { label: a.label, value: a.value, accent: a.accent ?? "" };
}

// Office figures + allocation writes for Kekayaan & Kas. Mirrors
// portofolio-bisnis/writes.ts: useMutation + toast + audit log. The mutations are
// requireFeatureWrite(kekayaan-kas) server-side, so a staf caller gets the warn
// toast and the modal stays open (FormModal swallows the throw → no close).
//
// CONTRACT (matches convex/features/office/mutations.ts guards):
//   netWorth, liabilitas  → money, >= 0 (Rupiah)
//   netWorthChange        → signed delta, finite (may be negative)
//   debtRatio             → percent, [0,100]
//   allocation.value      → money, >= 0 (Rupiah; the donut sizes by proportion)
//
// Client mirrors these so an invalid entry is caught before the round-trip.

const finite = (n: number) => Number.isFinite(n);
const money = (n: number) => finite(n) && n >= 0;
const percent = (n: number) => finite(n) && n >= 0 && n <= 100;

export interface FigureValues {
  netWorth: number;
  netWorthChange: number;
  liabilitas: number;
  debtRatio: number;
}

export function useKekayaanWrites() {
  const setFigures = useMutation(api.features.office.mutations.setFigures);
  // upsert is create-or-update; the optimistic insert only fires on the CREATE
  // path (no slug) so an edit never double-renders the slice. Convex auto-rolls
  // back the temp row if the insert is rejected.
  const upsert = useMutation(api.features.office.mutations.upsertAllocation).withOptimisticUpdate(
    (store, args) => {
      if (args.slug) return; // edit path — leave the cache to the server round-trip
      const existing = store.getQuery(ALLOC_LIST);
      if (!existing) return;
      // eslint-disable-next-line react-hooks/purity -- deferred to mutation dispatch, not render
      const now = Date.now();
      const order = existing.reduce((m, a) => Math.max(m, a.order), 0) + 1;
      const optimistic: Doc<"allocations"> = {
        _id: `optimistic-${now}` as Id<"allocations">,
        _creationTime: now,
        slug: `optimistic-${now}`,
        label: args.label,
        value: args.value,
        accent: args.accent,
        order,
        version: 1,
      };
      store.setQuery(ALLOC_LIST, {}, [...existing, optimistic]);
    },
  );
  const removeAlloc = useMutation(api.features.office.mutations.removeAllocation).withOptimisticUpdate(
    (store, args) => {
      const existing = store.getQuery(ALLOC_LIST);
      if (!existing) return;
      store.setQuery(ALLOC_LIST, {}, existing.filter((a) => a._id !== args.id));
    },
  );
  const toast = useToast();
  const run = useRunWrite();

  // netWorth/liabilitas are entered in Triliun (T); convert to absolute Rupiah.
  // expectedVersion = the live figures' version so a concurrent edit is rejected
  // with a friendly conflict warn (form stays open) instead of clobbering.
  const saveFigures = async (v: Record<string, string>, expectedVersion?: number) => {
    const fig: FigureValues = {
      netWorth: Number(v.netWorth) * 1e12,
      netWorthChange: Number(v.netWorthChange),
      liabilitas: Number(v.liabilitas) * 1e12,
      debtRatio: Number(v.debtRatio),
    };
    if (!money(fig.netWorth) || !money(fig.liabilitas)) {
      toast("Aset & liabilitas tidak boleh negatif", "warn");
      throw new Error("invalid money");
    }
    if (!finite(fig.netWorthChange) || !percent(fig.debtRatio)) {
      toast("Perubahan/rasio utang tidak valid (rasio 0–100)", "warn");
      throw new Error("invalid figure");
    }
    return run({
      call: () => setFigures({ ...fig, expectedVersion }),
      ok: "Angka kekayaan diperbarui",
      log: [`Kekayaan diperbarui · ${(fig.netWorth / 1e12).toFixed(1)} T`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal/cfo",
      conflict: true,
    });
  };

  // Allocation slice upsert. `value` is the slice's worth in Rupiah (money, >= 0)
  // per the server contract. slug omitted on create → server derives it from the
  // label. expectedVersion only matters on the edit path (slug present).
  const saveAllocation = async (
    v: Record<string, string>,
    slug: string | undefined,
    expectedVersion?: number,
  ) => {
    const value = Number(v.value);
    if (!money(value)) {
      toast("Nilai alokasi tidak boleh negatif", "warn");
      throw new Error("invalid allocation value");
    }
    const accent = v.accent?.trim() || "var(--color-gold)";
    return run({
      call: () => upsert({ slug, label: v.label, value, accent, expectedVersion: slug ? expectedVersion : undefined }),
      ok: slug ? `Alokasi ${v.label} diperbarui` : `Alokasi ${v.label} ditambahkan`,
      log: [`Alokasi ${slug ? "diperbarui" : "ditambahkan"} · ${v.label}`, "Principal"],
      warn: "Gagal menyimpan alokasi — perlu akses principal/cfo",
      conflict: true,
    });
  };

  const removeAllocation = (id: string, label: string) =>
    run({
      call: () => removeAlloc({ id }),
      ok: `Alokasi ${label} dihapus`,
      okTone: "warn",
      log: [`Alokasi dihapus · ${label}`],
      warn: "Gagal menghapus — perlu akses principal/cfo",
    });

  return { saveFigures, saveAllocation, removeAllocation };
}
