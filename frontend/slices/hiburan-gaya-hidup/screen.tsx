"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  StatGrid,
  StatTile,
  SectionCard,
  Pill,
  DetailSheet,
  DeleteButton,
  FormModal,
  Skeleton,
  EmptyState,
  GoldButton,
  useIsDemo,
} from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { safeColor } from "@/lib/safe-css";
import { STATS } from "./data";
import { useHiburanWrites, EVENT_FIELDS } from "./writes";
import { LifestyleCalendar } from "./calendar";
import { ConciergePanel } from "./concierge";

// Hiburan & Gaya Hidup — events + concierge. Events/reservations/requests live in
// Convex; calendar scale (LifestyleCalendar) + STATS stay slice-local.
export default function Screen() {
  const isDemo = useIsDemo();
  // Demo reads NO Convex rows (queries skipped). This slice has no mock event/
  // reservation arrays, so the demo lists resolve empty ([]) — its illustrative
  // data is the calendar heatmap + KPI tiles, not these live tables.
  const rawEvents = useQuery(api.features.lifestyle.queries.listEvents, isDemo ? "skip" : {});
  const rawReservations = useQuery(
    api.features.lifestyle.queries.listReservations,
    isDemo ? "skip" : {},
  );
  const events: Doc<"lifestyleEvents">[] | undefined = isDemo ? [] : rawEvents;
  const reservations: Doc<"conciergeReservations">[] | undefined = isDemo ? [] : rawReservations;
  const [open, setOpen] = useState<Doc<"lifestyleEvents"> | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [edit, setEdit] = useState<Doc<"lifestyleEvents"> | null>(null);
  const { add, edit: doEdit, del } = useHiburanWrites(events?.length ?? 0);

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatTile label="Acara Bulan Ini" value={events ? String(events.length) : "—"} hint={STATS.events.hint} accent />
        <StatTile label="Reservasi Aktif" value={reservations ? String(reservations.length) : "—"} hint={STATS.reservations.hint} />
        <StatTile
          label="Keanggotaan Elit"
          value={isDemo ? STATS.memberships.value : "—"}
          hint={isDemo ? STATS.memberships.hint : undefined}
        />
        <StatTile
          label="Konsierge"
          value={isDemo ? STATS.concierge.value : "—"}
          hint={isDemo ? STATS.concierge.hint : undefined}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <LifestyleCalendar />
        <ConciergePanel />
      </div>

      <SectionCard
        title="Acara Mendatang"
        sub="Ketuk untuk detail & kelola"
        action={isDemo ? undefined : <GoldButton className="shrink-0" onClick={() => setAddOpen(true)} />}
      >
        {events === undefined ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            message="Belum ada acara terjadwal."
            action={
              isDemo ? undefined : (
                <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                  + Tambah acara
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <button
                key={e._id}
                onClick={() => setOpen(e)}
                style={{ borderTopColor: safeColor(e.color) }}
                className="flex flex-col gap-1.5 rounded-xl border border-border border-t-[3px] bg-muted/30 p-4 text-left transition-colors hover:bg-muted/60"
              >
                <Pill className="self-start font-mono">{e.date}</Pill>
                <span className="text-sm font-medium text-foreground">{e.title}</span>
                <span className="text-xs text-muted-foreground">{e.location}</span>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <DetailSheet
        open={open !== null}
        onClose={() => setOpen(null)}
        eyebrow={open?.date}
        title={open?.title ?? ""}
        subtitle={open?.location}
        accent={open?.color}
        actions={
          open && (
            <>
              <DeleteButton label={open.title} onConfirm={async () => { await del(open._id, open.title); setOpen(null); }} />
              <Button
                size="sm"
                onClick={() => { setEdit(open); setOpen(null); }}
              >
                Ubah acara
              </Button>
            </>
          )
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Acara terjadwal di kalender gaya hidup. Konsierge menyiapkan transport, dress code, dan
          tamu pendamping.
        </p>
      </DetailSheet>

      <FormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah Acara"
        subtitle="Acara baru langsung masuk kalender gaya hidup"
        fields={EVENT_FIELDS}
        onSubmit={add}
      />

      <FormModal
        open={edit !== null}
        onClose={() => setEdit(null)}
        title={edit ? `Ubah · ${edit.title}` : "Ubah acara"}
        subtitle="Perbarui detail acara terjadwal"
        submitLabel="Simpan"
        accent={edit?.color}
        initial={edit ? { title: edit.title, date: edit.date, location: edit.location } : undefined}
        fields={EVENT_FIELDS}
        onSubmit={async (v) => { if (edit) await doEdit(edit._id, v); }}
      />
    </div>
  );
}
