"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { type FormField } from "@/frontend/shared";
import { useRunWrite } from "@/frontend/shared/run-write";

// Accent palette (theme tokens) cycled across new events.
const PALETTE = [
  "var(--color-mk-purple)",
  "var(--color-mk-green)",
  "var(--color-mk-red)",
  "var(--color-mk-blue)",
  "var(--color-mk-orange)",
];

// Fields for create/edit of a lifestyle event. `date` is display copy
// ("04 Mei"); no money fields on this table.
export const EVENT_FIELDS: FormField[] = [
  { name: "title", label: "Nama acara", placeholder: "Gala Amal Tahunan", required: true },
  { name: "date", label: "Tanggal", placeholder: "04 Mei", required: true },
  { name: "location", label: "Lokasi & catatan", placeholder: "Hotel Mulia · black tie", required: true },
];

// Event create/update/delete bound to toast + server audit log. The mutations
// are requireFeatureWrite("hiburan-gaya-hidup") server-side → principal only; a
// blocked user gets the warn toast and the form stays open.
export function useHiburanWrites(count: number) {
  const create = useMutation(api.features.lifestyle.mutations.createEvent);
  const update = useMutation(api.features.lifestyle.mutations.updateEvent);
  const remove = useMutation(api.features.lifestyle.mutations.removeEvent);
  const run = useRunWrite();

  const add = (v: Record<string, string>) =>
    run({
      call: () =>
        create({
          title: v.title,
          date: v.date,
          location: v.location,
          color: PALETTE[count % PALETTE.length],
        }),
      ok: `Acara ${v.title} ditambahkan`,
      log: [`Acara gaya hidup ditambahkan · ${v.title}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal",
    });

  const edit = (id: Id<"lifestyleEvents">, v: Record<string, string>) =>
    run({
      call: () => update({ id, title: v.title, date: v.date, location: v.location }),
      ok: `Acara ${v.title} diperbarui`,
      log: [`Acara gaya hidup diperbarui · ${v.title}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal",
    });

  const del = (id: Id<"lifestyleEvents">, title: string) =>
    run({
      call: () => remove({ id }),
      ok: `Acara ${title} dihapus`,
      okTone: "warn",
      log: [`Acara gaya hidup dihapus · ${title}`],
      warn: "Gagal menghapus — perlu akses principal",
    });

  return { add, edit, del };
}
