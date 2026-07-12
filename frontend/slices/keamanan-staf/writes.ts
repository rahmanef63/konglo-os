"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRunWrite } from "@/frontend/shared/run-write";

// keamanan-staf create/edit/delete bound to toast + server audit log. Mutations
// are requireFeatureWrite("keamanan-staf") server-side → principal-only (staf
// holds the read feature but is non-elevated; cfo lacks the feature). A Forbidden
// caller (staf/non-principal) gets a friendly warn toast and the form stays open.
export function useSecurityWrites() {
  const createStaff = useMutation(api.features.security.mutations.createStaff);
  const updateStaff = useMutation(api.features.security.mutations.updateStaff);
  const removeStaff = useMutation(api.features.security.mutations.removeStaff);
  const createZone = useMutation(api.features.security.mutations.createZone);
  const updateZone = useMutation(api.features.security.mutations.updateZone);
  const removeZone = useMutation(api.features.security.mutations.removeZone);
  const run = useRunWrite();

  // --- staffRoster ---------------------------------------------------------
  const addStaff = (v: Record<string, string>) =>
    run({
      call: () =>
        createStaff({
          name: v.name,
          role: v.role,
          status: v.status,
          color: v.color,
          location: v.location,
          shift: v.shift,
          tenure: v.tenure,
        }),
      ok: `Staf ${v.name} ditambahkan`,
      log: [`Staf ditambahkan · ${v.name}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal",
    });

  const editStaff = (id: Id<"staffRoster">, v: Record<string, string>) =>
    run({
      call: () =>
        updateStaff({
          id,
          name: v.name,
          role: v.role,
          status: v.status,
          color: v.color,
          location: v.location,
          shift: v.shift,
          tenure: v.tenure,
        }),
      ok: `Staf ${v.name} diperbarui`,
      log: [`Staf diperbarui · ${v.name}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal",
    });

  const delStaff = (id: Id<"staffRoster">, name: string) =>
    run({
      call: () => removeStaff({ id }),
      ok: `${name} dihapus dari roster`,
      okTone: "warn",
      log: [`Staf dihapus · ${name}`],
      warn: "Gagal menghapus — perlu akses principal",
    });

  // --- securityZones -------------------------------------------------------
  const addZone = (v: Record<string, string>) =>
    run({
      call: () => createZone({ label: v.label, status: v.status, color: v.color }),
      ok: `Zona ${v.label} ditambahkan`,
      log: [`Zona keamanan ditambahkan · ${v.label}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal",
    });

  const editZone = (id: Id<"securityZones">, v: Record<string, string>) =>
    run({
      call: () => updateZone({ id, label: v.label, status: v.status, color: v.color }),
      ok: `Zona ${v.label} diperbarui`,
      log: [`Zona keamanan diperbarui · ${v.label}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses principal",
    });

  const delZone = (id: Id<"securityZones">, label: string) =>
    run({
      call: () => removeZone({ id }),
      ok: `Zona ${label} dihapus`,
      okTone: "warn",
      log: [`Zona keamanan dihapus · ${label}`],
      warn: "Gagal menghapus — perlu akses principal",
    });

  return { addStaff, editStaff, delStaff, addZone, editZone, delZone };
}
