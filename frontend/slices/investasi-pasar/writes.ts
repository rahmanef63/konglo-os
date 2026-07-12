"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRunWrite } from "@/frontend/shared/run-write";
import { PALETTE, DEFAULT_POINTS } from "./data";

// Holding create/update/delete bound to toast + server audit log. The mutations
// are requireFeatureWrite("investasi-pasar") server-side; a blocked user gets the
// warn toast and the form stays open. cfo + principal can write (staf is gated).
export function useInvestasiWrites(count: number) {
  const create = useMutation(api.features.holdings.mutations.create);
  const update = useMutation(api.features.holdings.mutations.update);
  const remove = useMutation(api.features.holdings.mutations.remove);
  const run = useRunWrite();

  const add = (v: Record<string, string>) =>
    run({
      call: () =>
        create({
          name: v.name,
          ticker: v.ticker,
          sector: v.sector,
          value: v.value,
          change: v.change,
          up: v.up === "Naik",
          weight: v.weight,
          avg: v.avg,
          lot: v.lot,
          points: DEFAULT_POINTS,
          color: PALETTE[count % PALETTE.length],
        }),
      ok: `Instrumen ${v.name} ditambahkan`,
      log: [`Instrumen ditambahkan · ${v.name}`, "Investasi"],
      warn: "Gagal menyimpan — perlu akses tulis",
    });

  const edit = (id: Id<"holdings">, v: Record<string, string>) =>
    run({
      call: () =>
        update({
          id,
          name: v.name,
          ticker: v.ticker,
          sector: v.sector,
          value: v.value,
          change: v.change,
          up: v.up === "Naik",
          weight: v.weight,
          avg: v.avg,
          lot: v.lot,
        }),
      ok: `Instrumen ${v.name} diperbarui`,
      log: [`Instrumen diperbarui · ${v.name}`, "Investasi"],
      warn: "Gagal menyimpan — perlu akses tulis",
    });

  const del = (id: Id<"holdings">, name: string) =>
    run({
      call: () => remove({ id }),
      ok: `${name} dihapus`,
      okTone: "warn",
      log: [`Instrumen dihapus · ${name}`],
      warn: "Gagal menghapus — perlu akses tulis",
    });

  return { add, edit, del };
}
