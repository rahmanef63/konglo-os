"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRunWrite } from "@/frontend/shared/run-write";
import { PALETTE } from "./data";

// Kesehatan writes (medical team + schedule) bound to toast + server audit log.
// Every mutation is requireFeatureWrite("kesehatan") server-side, and "kesehatan"
// is in NO non-principal ROLE_MENU → cfo/staf are blocked at the read gate. A
// Forbidden surfaces as a friendly warn toast and the error is re-thrown so the
// FormModal keeps the form open (mirrors portofolio-bisnis). No crash, no console
// noise beyond FormModal's own caught log.
const WARN_SAVE = "Gagal menyimpan — perlu akses principal";
const WARN_DEL = "Gagal menghapus — perlu akses principal";

// Cycle the accent palette by current list length so new rows alternate colors.
function pickColor(count: number) {
  return PALETTE[count % PALETTE.length];
}

export function useKesehatanWrites(teamCount: number, scheduleCount: number) {
  const createTeam = useMutation(api.features.kesehatan.mutations.createMedicalTeam);
  const updateTeam = useMutation(api.features.kesehatan.mutations.updateMedicalTeam);
  const removeTeam = useMutation(api.features.kesehatan.mutations.removeMedicalTeam);
  const createSchedule = useMutation(api.features.kesehatan.mutations.createSchedule);
  const updateSchedule = useMutation(api.features.kesehatan.mutations.updateSchedule);
  const removeSchedule = useMutation(api.features.kesehatan.mutations.removeSchedule);
  const run = useRunWrite();

  const addTeam = (v: Record<string, string>) =>
    run({
      call: () => createTeam({ name: v.name, role: v.role, color: pickColor(teamCount) }),
      ok: `${v.name} ditambahkan ke tim medis`,
      log: [`Tim medis ditambahkan · ${v.name}`, "Principal"],
      warn: WARN_SAVE,
    });

  const editTeam = (id: Id<"healthMedicalTeam">, v: Record<string, string>) =>
    run({
      call: () => updateTeam({ id, name: v.name, role: v.role }),
      ok: `${v.name} diperbarui`,
      log: [`Tim medis diperbarui · ${v.name}`, "Principal"],
      warn: WARN_SAVE,
    });

  const delTeam = (id: Id<"healthMedicalTeam">, name: string) =>
    run({
      call: () => removeTeam({ id }),
      ok: `${name} dihapus dari tim medis`,
      okTone: "warn",
      log: [`Tim medis dihapus · ${name}`, "Principal"],
      warn: WARN_DEL,
    });

  const addSchedule = (v: Record<string, string>) =>
    run({
      call: () =>
        createSchedule({
          date: v.date,
          title: v.title,
          location: v.location,
          color: pickColor(scheduleCount),
        }),
      ok: `Janji "${v.title}" ditambahkan`,
      log: [`Jadwal kesehatan ditambahkan · ${v.title}`, "Principal"],
      warn: WARN_SAVE,
    });

  const editSchedule = (id: Id<"healthSchedule">, v: Record<string, string>) =>
    run({
      call: () => updateSchedule({ id, date: v.date, title: v.title, location: v.location }),
      ok: `Janji "${v.title}" diperbarui`,
      log: [`Jadwal kesehatan diperbarui · ${v.title}`, "Principal"],
      warn: WARN_SAVE,
    });

  const delSchedule = (id: Id<"healthSchedule">, title: string) =>
    run({
      call: () => removeSchedule({ id }),
      ok: `Janji "${title}" dihapus`,
      okTone: "warn",
      log: [`Jadwal kesehatan dihapus · ${title}`, "Principal"],
      warn: WARN_DEL,
    });

  return { addTeam, editTeam, delTeam, addSchedule, editSchedule, delSchedule };
}
