"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRunWrite } from "@/frontend/shared/run-write";
import { typeColor } from "./data";

// Property-asset create/update/delete bound to toast + server audit log. The
// mutations are requireFeatureWrite("properti-aset") server-side (cfo+principal
// pass, staf blocked) — a denied write surfaces the warn toast and FormModal
// keeps the form open (it swallows the throw) so the user can retry.
//
// value/maint/year/note are stored verbatim as pre-formatted strings (the
// `propertyAssets` columns are strings, no numeric coercion). `color` is derived
// from the chosen asset class so the gallery accent stays consistent.
export function usePropertiWrites() {
  const create = useMutation(api.features.property.mutations.create);
  const update = useMutation(api.features.property.mutations.update);
  const remove = useMutation(api.features.property.mutations.remove);
  const run = useRunWrite();

  const add = (v: Record<string, string>) =>
    run({
      call: () =>
        create({
          name: v.name,
          type: v.type,
          value: v.value,
          location: v.location,
          color: typeColor(v.type),
          maint: v.maint,
          status: v.status,
          year: v.year,
          note: v.note,
        }),
      ok: `Aset ${v.name} ditambahkan`,
      log: [`Aset ditambahkan · ${v.name}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses tulis",
    });

  const edit = (id: Id<"propertyAssets">, v: Record<string, string>) =>
    run({
      call: () =>
        update({
          id,
          name: v.name,
          type: v.type,
          value: v.value,
          location: v.location,
          color: typeColor(v.type),
          maint: v.maint,
          status: v.status,
          year: v.year,
          note: v.note,
        }),
      ok: `Aset ${v.name} diperbarui`,
      log: [`Aset diperbarui · ${v.name}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses tulis",
    });

  const del = (id: Id<"propertyAssets">, name: string) =>
    run({
      call: () => remove({ id }),
      ok: `${name} dihapus`,
      okTone: "warn",
      log: [`Aset dihapus · ${name}`],
      warn: "Gagal menghapus — perlu akses tulis",
    });

  return { add, edit, del };
}
