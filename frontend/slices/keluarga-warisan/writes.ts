"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { type FormField } from "@/frontend/shared";
import { useRunWrite } from "@/frontend/shared/run-write";

// Heir (ahli waris) create/edit/delete bound to toast + server audit log. The
// mutations are requirePrincipal server-side; a non-principal hits Forbidden and
// gets a friendly warn toast instead of a crash. On add/edit failure we re-throw
// so FormModal keeps the form open for retry.

const COLORS = [
  "var(--color-mk-blue)",
  "var(--color-mk-green)",
  "var(--color-mk-orange)",
  "var(--color-mk-purple)",
  "var(--color-mk-red)",
  "var(--color-gold)",
];

// Shared field set for both create and edit. share/age/next/mandate are display
// strings; readiness is a 0–100 percent. Matches the heirs table validators.
export const HEIR_FIELDS: FormField[] = [
  { name: "name", label: "Nama", required: true, placeholder: "mis. Andra W." },
  { name: "role", label: "Peran", required: true, placeholder: "mis. Putra · CEO Energi" },
  { name: "share", label: "Bagian kepemilikan", required: true, placeholder: "mis. 28%" },
  { name: "readiness", label: "Kesiapan (%)", type: "number", required: true, step: "1", placeholder: "0–100" },
  { name: "mandate", label: "Mandat", required: true, placeholder: "mis. Energi & Tambang" },
  { name: "age", label: "Usia", placeholder: "mis. 38 th" },
  { name: "next", label: "Milestone berikut", placeholder: "mis. Pelatihan dewan (Q3)" },
  { name: "color", label: "Warna", type: "select", options: COLORS },
];

// Seed a heir doc into the FormModal `initial` record (drops server-managed
// keys: _id, _creationTime, order). Inverse of toArgs for the edit flow.
export function heirInitial(h: Doc<"heirs">): Record<string, string | number> {
  return {
    name: h.name,
    role: h.role,
    share: h.share,
    readiness: h.readiness,
    mandate: h.mandate,
    age: h.age,
    next: h.next,
    color: h.color,
  };
}

// Translate a raw form record into heir create args (trim + clamp readiness).
function toArgs(v: Record<string, string>) {
  const readiness = Math.max(0, Math.min(100, Math.round(Number(v.readiness) || 0)));
  return {
    name: v.name.trim(),
    role: v.role.trim(),
    share: v.share.trim(),
    readiness,
    mandate: v.mandate.trim(),
    age: v.age?.trim() || "—",
    next: v.next?.trim() || "—",
    color: v.color || undefined,
  };
}

export function useHeirWrites() {
  const create = useMutation(api.features.family.mutations.createHeir);
  const update = useMutation(api.features.family.mutations.updateHeir);
  const remove = useMutation(api.features.family.mutations.removeHeir);
  const run = useRunWrite();

  const add = async (v: Record<string, string>) => {
    const args = toArgs(v);
    return run({
      call: () => create(args),
      ok: `Ahli waris ${args.name} ditambahkan`,
      log: [`Ahli waris ditambahkan · ${args.name}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal",
    });
  };

  const edit = async (id: Id<"heirs">, v: Record<string, string>) => {
    const args = toArgs(v);
    return run({
      call: () => update({ id, ...args }),
      ok: `Ahli waris ${args.name} diperbarui`,
      log: [`Ahli waris diperbarui · ${args.name}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal",
    });
  };

  const del = async (id: Id<"heirs">, name: string) =>
    run({
      call: () => remove({ id }),
      ok: `${name} dihapus`,
      okTone: "warn",
      log: [`Ahli waris dihapus · ${name}`, "Principal"],
      warn: "Gagal menghapus — perlu akses principal",
    });

  return { add, edit, del };
}
