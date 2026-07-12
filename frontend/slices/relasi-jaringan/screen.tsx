"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  StatGrid,
  StatTile,
  SectionCard,
  PillToggleRow,
  PersonRow,
  DataRow,
  DetailSheet,
  DeleteButton,
  BarChart,
  FormModal,
  Skeleton,
  EmptyState,
  GoldButton,
  useIsDemo,
} from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import {
  WARM_COLOR,
  FILTERS,
  FILTER_LABELS,
  INFLUENCE,
  STATS,
  ADD_FIELDS,
  EDIT_FIELDS,
  contactInitial,
} from "./data";
import { useContactWrites } from "./writes";
import { RelasiPanels } from "./panels";

type Contact = Doc<"contacts">;

// Relasi & Jaringan — VIP CRM + meeting log. A DEMO user (anonymous) sees the
// in-code illustrative mock (STATS tiles + INFLUENCE map + follow-up/meeting
// panels) and never reads Convex; a REAL user sees only their live contacts SSOT
// with neutral "—"/EmptyState where there is no live source (Pertemuan / Perlu
// Follow-up / Skor Jaringan / Peta Pengaruh have none). Kontak VIP is derived
// live from the real contacts list. Writes are hidden in demo (read-only).
export default function Screen() {
  const isDemo = useIsDemo();
  const contactsQ = useQuery(api.features.contacts.queries.list, isDemo ? "skip" : {});
  const contacts = isDemo ? [] : (contactsQ ?? []);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<Contact | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contact | null>(null);
  const loading = !isDemo && contactsQ === undefined;
  const vips = contacts.filter(FILTERS[filter]);
  const { add: addContact, edit: editContact, del: delContact } = useContactWrites();

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatTile label="Kontak VIP" value={!isDemo && contactsQ ? String(contacts.length) : "—"} hint="prioritas aktif" accent />
        <StatTile label="Pertemuan" value={isDemo ? STATS.meetings.value : "—"} tone="up" sample={isDemo} />
        <StatTile label="Perlu Follow-up" value={isDemo ? STATS.followups.value : "—"} sample={isDemo} />
        <StatTile label="Skor Jaringan" value={isDemo ? STATS.score.value : "—"} sample={isDemo} />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <SectionCard
          title="Kontak Prioritas"
          sub="Ketuk kontak untuk kartu relasi"
          action={
            <div className="flex flex-wrap justify-end gap-1.5">
              {!isDemo && <GoldButton onClick={() => setAddOpen(true)} />}
              <PillToggleRow options={FILTER_LABELS} value={filter} onChange={setFilter} />
            </div>
          }
        >
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[60px] rounded-xl" />
              ))
            ) : vips.length === 0 ? (
              <EmptyState
                message={
                  isDemo
                    ? "Data kontak tidak tersedia di mode demo."
                    : contacts.length === 0
                      ? "Belum ada kontak. Tambahkan kontak VIP pertama."
                      : "Tidak ada kontak pada filter ini."
                }
                action={
                  !isDemo && contacts.length === 0 ? (
                    <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                      + Tambah kontak
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              vips.map((v) => (
                <button
                  key={v.slug}
                  onClick={() => setOpen(v)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 p-2.5 text-left transition-colors hover:bg-muted/60"
                >
                  <div className="min-w-0 flex-1">
                    <PersonRow name={v.name} role={v.role} color={WARM_COLOR[v.warmth]} size={36} />
                  </div>
                  <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:block">{v.last}</span>
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" style={{ background: WARM_COLOR[v.warmth] }} />
                </button>
              ))
            )}
          </div>
        </SectionCard>

        <RelasiPanels />
      </div>

      <SectionCard title="Peta Pengaruh" sub="Sebaran relasi per sektor" sample={isDemo}>
        {isDemo ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {INFLUENCE.map(([sector, n]) => (
              <div key={sector} className="space-y-1.5">
                <span className="text-xs text-muted-foreground">{sector}</span>
                <BarChart values={[n * 0.6, n * 0.8, n]} color="var(--color-mk-purple)" height={60} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Belum ada data peta pengaruh." />
        )}
      </SectionCard>

      <DetailSheet
        open={open !== null}
        onClose={() => setOpen(null)}
        eyebrow={open?.role}
        title={open?.name ?? ""}
        subtitle={open ? `Kontak terakhir ${open.last} · ${open.warmth}` : undefined}
        accent={open ? WARM_COLOR[open.warmth] : undefined}
        actions={
          !isDemo ? (
            <>
              <DeleteButton label={open?.name} onConfirm={async () => { if (open) { await delContact(open._id, open.name); setOpen(null); } }} />
              <Button size="sm" variant="outline" disabled title="Segera hadir">Catat pertemuan · segera hadir</Button>
              <Button size="sm" onClick={() => { if (open) { setEditTarget(open); setOpen(null); } }}>Ubah</Button>
            </>
          ) : undefined
        }
      >
        {open && (
          <>
            <DataRow label="Kategori" value={open.tier} accent />
            <DataRow label="Peran" value={open.role} />
            <DataRow label="Kehangatan" value={open.warmth} />
            <DataRow label="Kontak terakhir" value={open.last} />
          </>
        )}
      </DetailSheet>

      <FormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah Kontak"
        subtitle="Kontak baru langsung masuk CRM relasi"
        fields={ADD_FIELDS}
        onSubmit={addContact}
      />

      <FormModal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={editTarget ? `Ubah · ${editTarget.name}` : "Ubah kontak"}
        subtitle="Perbarui detail kontak di CRM relasi"
        submitLabel="Simpan"
        accent={editTarget ? WARM_COLOR[editTarget.warmth] : undefined}
        initial={editTarget ? contactInitial(editTarget) : undefined}
        fields={EDIT_FIELDS}
        onSubmit={async (v) => { if (editTarget) await editContact(editTarget._id, v); }}
      />
    </div>
  );
}
