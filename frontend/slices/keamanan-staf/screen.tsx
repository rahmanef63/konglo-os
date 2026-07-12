"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { StatGrid, StatTile, SectionCard, PersonRow, Pill, DataRow, DetailSheet, FormModal, Skeleton, EmptyState, GoldButton, useIsDemo } from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { safeColor } from "@/lib/safe-css";
import { useSecurityWrites } from "./writes";
import { DutySchedule, EditDeleteActions } from "./schedule";
import { STATUS_COLOR, STATS, STAFF_FIELDS, ZONE_FIELDS, staffInitial, zoneInitial } from "./data";

// Keamanan & Staf — roster + estate security + duty schedule. Staff/zones/metrics
// live in Convex; writes are principal-only (requireFeatureWrite). STATUS_COLOR +
// HOURS/SHIFTS grid + STATS stay slice-local. securityMetrics is read-only.
export default function Screen() {
  // Demo user reads the in-code mock (heatmap + illustrative KPIs) and NEVER hits
  // Convex; a real user reads only their own rows, empty/neutral where none.
  const isDemo = useIsDemo();
  const staffQ = useQuery(api.features.security.queries.listStaff, isDemo ? "skip" : {});
  const zonesQ = useQuery(api.features.security.queries.listZones, isDemo ? "skip" : {});
  const metricsQ = useQuery(api.features.security.queries.listMetrics, isDemo ? "skip" : {});
  // No mock roster/zone/metric arrays exist for this slice (only SHIFTS + STATS),
  // so demo resolves these lists to empty — real data flows through unchanged.
  const staff = isDemo ? [] : staffQ;
  const zones = isDemo ? [] : zonesQ;
  const metrics = isDemo ? [] : metricsQ;
  const w = useSecurityWrites();
  const [open, setOpen] = useState<Doc<"staffRoster"> | null>(null);
  const [zone, setZone] = useState<Doc<"securityZones"> | null>(null);
  // null = closed · "add" = create · Doc = edit. Collapses add+edit into one modal.
  const [staffForm, setStaffForm] = useState<"add" | Doc<"staffRoster"> | null>(null);
  const [zoneForm, setZoneForm] = useState<"add" | Doc<"securityZones"> | null>(null);
  const [panic, setPanic] = useState(false);

  // Edit targets (only when the form holds a Doc) — drive FormModal initial/accent.
  const staffEdit = staffForm && staffForm !== "add" ? staffForm : null;
  const zoneEdit = zoneForm && zoneForm !== "add" ? zoneForm : null;

  // Live KPIs from the roster: total headcount + how many are on duty now.
  const onDuty = (staff ?? []).filter((s) => s.status === "Bertugas").length;

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatTile label="Total Staf" value={staff ? String(staff.length) : "—"} hint={STATS.total.hint} accent />
        <StatTile label="Sedang Bertugas" value={staff ? String(onDuty) : "—"} hint={STATS.onDuty.hint} />
        <StatTile label="Status Keamanan" value={isDemo ? STATS.status.value : "—"} hint={isDemo ? STATS.status.hint : "Belum ada data"} tone={isDemo ? "up" : "flat"} />
        <StatTile label="Insiden" value={isDemo ? STATS.incidents.value : "—"} hint={isDemo ? STATS.incidents.hint : "Belum ada data"} />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <SectionCard title="Status Keamanan Estate" sub="Per lokasi" action={isDemo ? undefined : <GoldButton onClick={() => setZoneForm("add")} />}>
          <div className="space-y-2.5">
            {zones === undefined ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 rounded-md" />)
            ) : zones.length === 0 ? (
              <EmptyState message="Belum ada zona terpantau." />
            ) : (
              zones.map((l) => (
                <button
                  key={l._id}
                  onClick={() => setZone(l)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="min-w-0 truncate text-sm text-foreground">{l.label}</span>
                  <Pill color={l.color}>
                    <span className="h-2 w-2 rounded-full" style={{ background: safeColor(l.color) }} /> {l.status}
                  </Pill>
                </button>
              ))
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-border/60 pt-3">
            {metrics === undefined
              ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-[62px] rounded-xl" />)
              : metrics.map((m) => (
                  <button
                    key={m._id}
                    onClick={m.panic ? () => setPanic(true) : undefined}
                    className={cn("rounded-xl border bg-muted/30 p-3 text-left", m.panic ? "border-l-[3px] border-l-destructive border-border transition-colors hover:bg-muted/60" : "border-border")}
                  >
                    <div className="text-[11px] text-muted-foreground">{m.label}</div>
                    <div className={cn("mt-0.5 font-display text-base font-bold", m.panic ? "text-destructive" : "text-foreground")}>{m.value}</div>
                  </button>
                ))}
          </div>
        </SectionCard>

        <SectionCard title="Roster Staf" sub="Ketuk untuk detail & jadwal" action={isDemo ? undefined : <GoldButton onClick={() => setStaffForm("add")} />}>
          <div className="space-y-2">
            {staff === undefined ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[52px] rounded-xl" />)
            ) : staff.length === 0 ? (
              <EmptyState message="Belum ada staf pada roster." />
            ) : (
              staff.map((s) => (
                <button
                  key={s._id}
                  onClick={() => setOpen(s)}
                  className="w-full rounded-xl border border-border bg-muted/30 p-2.5 text-left transition-colors hover:bg-muted/60"
                >
                  <PersonRow name={s.name} role={s.role} color={s.color} right={<Pill color={STATUS_COLOR[s.status]}>{s.status}</Pill>} />
                </button>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <DutySchedule />

      <DetailSheet
        open={open !== null}
        onClose={() => setOpen(null)}
        eyebrow="Roster Staf"
        title={open?.name ?? ""}
        subtitle={open ? `${open.role} · ${open.status}` : undefined}
        accent={open?.color}
        actions={
          open && !isDemo && (
            <EditDeleteActions
              label={open.name}
              onDelete={async () => { await w.delStaff(open._id, open.name); setOpen(null); }}
              onEdit={() => { setStaffForm(open); setOpen(null); }}
            />
          )
        }
      >
        {open && (
          <>
            <DataRow label="Status" value={open.status} accent />
            <DataRow label="Penempatan" value={open.location} />
            <DataRow label="Jam kerja" value={open.shift} />
            <DataRow label="Masa kerja" value={open.tenure} />
          </>
        )}
      </DetailSheet>

      <DetailSheet
        open={zone !== null}
        onClose={() => setZone(null)}
        eyebrow="Zona Estate"
        title={zone?.label ?? ""}
        subtitle={zone ? `Status: ${zone.status}` : undefined}
        accent={zone?.color}
        actions={
          zone && !isDemo && (
            <EditDeleteActions
              label={zone.label}
              onDelete={async () => { await w.delZone(zone._id, zone.label); setZone(null); }}
              onEdit={() => { setZoneForm(zone); setZone(null); }}
            />
          )
        }
      >
        {zone && <DataRow label="Status" value={zone.status} accent />}
      </DetailSheet>

      <DetailSheet
        open={panic}
        onClose={() => setPanic(false)}
        eyebrow="Darurat"
        title="Panic Button"
        subtitle="Mengaktifkan protokol darurat estate: notifikasi tim keamanan, kunci gerbang, kontak kepolisian."
        accent="var(--color-mk-red)"
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setPanic(false)}>Tutup</Button>
            <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled title="Segera hadir">Aktifkan protokol · segera hadir</Button>
          </>
        }
      />

      <FormModal
        open={!isDemo && staffForm !== null}
        onClose={() => setStaffForm(null)}
        title={staffEdit ? `Ubah · ${staffEdit.name}` : "Tambah Staf"}
        subtitle={staffEdit ? "Perbarui peran, status & penempatan" : "Anggota baru langsung masuk roster"}
        fields={STAFF_FIELDS}
        submitLabel={staffEdit ? "Perbarui" : "Simpan"}
        accent={staffEdit?.color}
        initial={staffEdit ? staffInitial(staffEdit) : undefined}
        onSubmit={(v) => (staffEdit ? w.editStaff(staffEdit._id, v) : w.addStaff(v))}
      />
      <FormModal
        open={!isDemo && zoneForm !== null}
        onClose={() => setZoneForm(null)}
        title={zoneEdit ? `Ubah · ${zoneEdit.label}` : "Tambah Zona"}
        subtitle={zoneEdit ? "Perbarui status pemantauan lokasi" : "Lokasi estate baru untuk dipantau"}
        fields={ZONE_FIELDS}
        submitLabel={zoneEdit ? "Perbarui" : "Simpan"}
        accent={zoneEdit?.color}
        initial={zoneEdit ? zoneInitial(zoneEdit) : undefined}
        onSubmit={(v) => (zoneEdit ? w.editZone(zoneEdit._id, v) : w.addZone(v))}
      />
    </div>
  );
}
