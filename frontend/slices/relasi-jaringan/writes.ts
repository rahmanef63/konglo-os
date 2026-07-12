"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRunWrite } from "@/frontend/shared/run-write";

// Contact create/delete bound to toast + server audit log. requireAdmin
// server-side; non-admin gets the warn toast and the form stays open to retry.
export function useContactWrites() {
  const create = useMutation(api.features.contacts.mutations.create);
  const update = useMutation(api.features.contacts.mutations.update);
  const remove = useMutation(api.features.contacts.mutations.remove);
  const run = useRunWrite();

  const add = (v: Record<string, string>) =>
    run({
      call: () =>
        create({
          name: v.name,
          role: v.role,
          tier: v.tier,
          warmth: v.warmth || "Netral",
          last: v.last || "baru saja",
        }),
      ok: `Kontak ${v.name} ditambahkan`,
      log: [`Kontak ditambahkan · ${v.name}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses admin",
    });

  const edit = (id: Id<"contacts">, v: Record<string, string>) =>
    run({
      call: () =>
        update({
          id,
          name: v.name,
          role: v.role,
          tier: v.tier,
          warmth: v.warmth || "Netral",
          last: v.last || "baru saja",
        }),
      ok: `Kontak ${v.name} diperbarui`,
      log: [`Kontak diperbarui · ${v.name}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses admin",
    });

  const del = (id: Id<"contacts">, name: string) =>
    run({
      call: () => remove({ id }),
      ok: `${name} dihapus`,
      okTone: "warn",
      log: [`Kontak dihapus · ${name}`],
      warn: "Gagal menghapus — perlu akses admin",
    });

  return { add, edit, del };
}
