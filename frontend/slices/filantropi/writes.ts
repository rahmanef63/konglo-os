"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { type FormField } from "@/frontend/shared";
import { useRunWrite } from "@/frontend/shared/run-write";

// Accent palette (theme tokens) cycled across new grants.
const PALETTE = [
  "var(--color-mk-blue)",
  "var(--color-mk-red)",
  "var(--color-mk-green)",
  "var(--color-mk-orange)",
  "var(--color-mk-purple)",
];

// Fields for create/edit of a foundation grant. `progress` = % dana tersalurkan
// (the disbursement figure); `amount` stays display copy ("Rp 420 M").
export const GRANT_FIELDS: FormField[] = [
  { name: "name", label: "Nama program", placeholder: "Beasiswa …", required: true },
  { name: "category", label: "Kategori", placeholder: "Pendidikan, Kesehatan, …", required: true },
  { name: "amount", label: "Komitmen", placeholder: "Rp 420 M", required: true },
  { name: "beneficiaries", label: "Penerima manfaat", placeholder: "10.000 siswa", required: true },
  { name: "region", label: "Cakupan wilayah", placeholder: "34 provinsi", required: true },
  { name: "partner", label: "Mitra pelaksana", placeholder: "Kemendikbud", required: true },
  { name: "progress", label: "Tersalurkan (%)", type: "number", step: "1", placeholder: "72", required: true },
];

// Subset of fields shown when approving a disbursement — only the progress %.
export const DISBURSE_FIELDS: FormField[] = [
  { name: "progress", label: "Dana tersalurkan (%)", type: "number", step: "1", placeholder: "72", required: true },
];


// Grant create/disburse/delete bound to toast + server audit log. The mutations
// are requireFeatureWrite("filantropi") server-side → principal only; a blocked
// user gets the warn toast and the form stays open.
export function useFilantropiWrites(count: number) {
  const create = useMutation(api.features.filantropi.mutations.createGrant);
  const update = useMutation(api.features.filantropi.mutations.updateGrant);
  const remove = useMutation(api.features.filantropi.mutations.removeGrant);
  const run = useRunWrite();

  const add = async (v: Record<string, string>) =>
    run({
      call: () =>
        create({
          name: v.name,
          category: v.category,
          amount: v.amount,
          progress: Number(v.progress),
          color: PALETTE[count % PALETTE.length],
          beneficiaries: v.beneficiaries,
          region: v.region,
          partner: v.partner,
        }),
      ok: `Program ${v.name} ditambahkan`,
      log: [`Program filantropi ditambahkan · ${v.name}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal",
    });

  // expectedVersion = the grant's current version held by the open disburse form;
  // a concurrent update is rejected with a friendly conflict warn (form stays open).
  const disburse = async (
    id: Id<"philanthropyGrants">,
    name: string,
    v: Record<string, string>,
    expectedVersion?: number,
  ) =>
    run({
      call: () => update({ id, progress: Number(v.progress), expectedVersion }),
      ok: `Pencairan ${name} disetujui · ${v.progress}%`,
      log: [`Pencairan filantropi disetujui · ${name} (${v.progress}%)`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal",
      conflict: true,
    });

  const del = async (id: Id<"philanthropyGrants">, name: string) =>
    run({
      call: () => remove({ id }),
      ok: `Program ${name} dihapus`,
      okTone: "warn",
      log: [`Program filantropi dihapus · ${name}`],
      warn: "Gagal menghapus — perlu akses principal",
    });

  return { add, disburse, del };
}
