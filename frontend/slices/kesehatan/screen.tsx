"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  StatGrid,
  StatTile,
  SectionCard,
  LineChart,
  Ring,
  Skeleton,
  EmptyState,
  FormModal,
  useIsDemo,
} from "@/frontend/shared";
import { TeamCard, ScheduleCard } from "./lists";
import { useKesehatanWrites } from "./writes";
import {
  VITALS_TREND,
  VITAL_STATS,
  READINESS,
  STATS,
  TEAM_FIELDS,
  SCHEDULE_FIELDS,
  teamInitial,
  scheduleInitial,
  type TeamMember,
  type ScheduleEntry,
} from "./data";

// Kesehatan — vitals + concierge medical. Team & schedule are live Convex with
// full CRUD (principal-only via requireFeatureWrite); vitals trend + readiness +
// summary KPIs stay slice-local presentation ('data contoh'). List rendering and
// the editable rows live in ./lists; write side-effects in ./writes (rr <200).
export default function Screen() {
  // Demo user reads the in-code mock (vitals trend + readiness + KPI tiles) and
  // NEVER hits Convex; a real user reads only their own rows, neutral where none.
  // Team/schedule/programs have no mock arrays, so demo resolves them to empty.
  const isDemo = useIsDemo();
  const teamQ = useQuery(api.features.kesehatan.queries.listMedicalTeam, isDemo ? "skip" : {});
  const scheduleQ = useQuery(api.features.kesehatan.queries.listSchedule, isDemo ? "skip" : {});
  const programsQ = useQuery(api.features.kesehatan.queries.listPrograms, isDemo ? "skip" : {});
  const team = isDemo ? [] : teamQ;
  const schedule = isDemo ? [] : scheduleQ;
  const programs = isDemo ? [] : programsQ;

  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<TeamMember | null>(null);
  const [addSchedOpen, setAddSchedOpen] = useState(false);
  const [editSched, setEditSched] = useState<ScheduleEntry | null>(null);

  const w = useKesehatanWrites((team ?? []).length, (schedule ?? []).length);

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatTile label="Skor Kesehatan" value={isDemo ? STATS.score.value : "—"} hint={isDemo ? STATS.score.hint : "Belum ada data"} tone={isDemo ? "up" : "flat"} accent />
        <StatTile label="Detak Istirahat" value={isDemo ? STATS.rhr.value : "—"} hint={isDemo ? STATS.rhr.hint : "Belum ada data"} />
        <StatTile label="Tidur (rata²)" value={isDemo ? STATS.sleep.value : "—"} hint={isDemo ? STATS.sleep.hint : "Belum ada data"} tone={isDemo ? "up" : "flat"} />
        <StatTile label="Cek Lab Berikut" value={isDemo ? STATS.lab.value : "—"} hint={isDemo ? STATS.lab.hint : "Belum ada data"} />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Tren Vital" sub={isDemo ? "Detak & HRV, 7 hari · data contoh" : "Detak & HRV, 7 hari"}>
          {isDemo ? (
            <>
              <LineChart points={VITALS_TREND} color="var(--color-mk-green)" height={110} />
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {VITAL_STATS.map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border bg-muted/30 p-2.5">
                    <div className="text-[11px] text-muted-foreground">{k}</div>
                    <div className="mt-0.5 font-display text-lg font-bold text-foreground">{v}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState message="Belum ada data vital." />
          )}
        </SectionCard>

        <SectionCard title="Kesiapan Harian" sub={isDemo ? "data contoh" : undefined}>
          {isDemo ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Ring value={READINESS} label="recovery" color="var(--color-mk-blue)" size={124} />
              <span className="text-xs text-muted-foreground">Siap untuk hari padat 🟢</span>
            </div>
          ) : (
            <EmptyState message="Belum ada data kesiapan." />
          )}
        </SectionCard>

        <TeamCard team={team} onAdd={() => setAddTeamOpen(true)} onEdit={setEditTeam} onDelete={(m) => w.delTeam(m._id, m.name)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ScheduleCard
          schedule={schedule}
          onAdd={() => setAddSchedOpen(true)}
          onEdit={setEditSched}
          onDelete={(e) => w.delSchedule(e._id, e.title)}
        />

        <SectionCard title="Program & Pengingat">
          <div className="grid grid-cols-2 gap-2.5">
            {programs === undefined ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            ) : programs.length === 0 ? (
              <EmptyState className="col-span-2" message="Belum ada program." />
            ) : (
              programs.map((p) => (
                <div key={p._id} className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="text-sm text-foreground">{p.label}</div>
                  <div className="mt-0.5 font-display text-base font-bold text-foreground">{p.value}</div>
                </div>
              ))
            )}
          </div>
          <p className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            🩺 Data wearable & lab tersinkron otomatis di versi hi-fi.
          </p>
        </SectionCard>
      </div>

      <FormModal
        open={addTeamOpen}
        onClose={() => setAddTeamOpen(false)}
        title="Tambah Tim Medis"
        subtitle="Anggota baru langsung masuk konsierge medis"
        fields={TEAM_FIELDS}
        onSubmit={w.addTeam}
      />
      <FormModal
        open={editTeam !== null}
        onClose={() => setEditTeam(null)}
        title={editTeam ? `Ubah · ${editTeam.name}` : "Ubah Tim Medis"}
        subtitle="Perbarui nama & peran anggota"
        submitLabel="Perbarui"
        accent={editTeam?.color}
        fields={TEAM_FIELDS}
        initial={editTeam ? teamInitial(editTeam) : undefined}
        onSubmit={async (v) => { if (editTeam) await w.editTeam(editTeam._id, v); }}
      />

      <FormModal
        open={addSchedOpen}
        onClose={() => setAddSchedOpen(false)}
        title="Tambah Janji"
        subtitle="Janji atau sesi baru masuk jadwal kesehatan"
        fields={SCHEDULE_FIELDS}
        onSubmit={w.addSchedule}
      />
      <FormModal
        open={editSched !== null}
        onClose={() => setEditSched(null)}
        title={editSched ? `Ubah · ${editSched.title}` : "Ubah Janji"}
        subtitle="Perbarui tanggal, janji & lokasi"
        submitLabel="Perbarui"
        accent={editSched?.color}
        fields={SCHEDULE_FIELDS}
        initial={editSched ? scheduleInitial(editSched) : undefined}
        onSubmit={async (v) => { if (editSched) await w.editSchedule(editSched._id, v); }}
      />
    </div>
  );
}
