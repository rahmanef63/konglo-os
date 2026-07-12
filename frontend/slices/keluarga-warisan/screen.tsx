"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  StatGrid,
  StatTile,
  SectionCard,
  PersonRow,
  DataRow,
  DetailSheet,
  DeleteButton,
  Meter,
  FormModal,
  Skeleton,
  EmptyState,
  GoldButton,
  useIsDemo,
} from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { STATS } from "./data";
import { useHeirWrites, HEIR_FIELDS, heirInitial } from "./writes";
import { FamilyTree } from "./tree";

type Heir = Doc<"heirs">;

// Keluarga & Warisan — family tree + succession. Heirs + governance live in Convex;
// FamilyTree strip + STATS summary stay slice-local presentation config.
export default function Screen() {
  // Demo (anonymous) reads the in-code mock only; heirs/governance have no mock
  // rows (sensitive estate plan) so demo sees the FamilyTree + KPI mock and an
  // empty succession list — it never touches the Convex `heirs` table.
  const isDemo = useIsDemo();
  const heirsQuery = useQuery(api.features.family.queries.listHeirs, isDemo ? "skip" : {});
  const governanceQuery = useQuery(
    api.features.family.queries.listGovernance,
    isDemo ? "skip" : {},
  );
  // Demo → [] (resolved empty, no skeleton); real → query result (undefined while loading).
  const heirs: Heir[] | undefined = isDemo ? [] : heirsQuery;
  const governance: typeof governanceQuery = isDemo ? [] : governanceQuery;
  const [open, setOpen] = useState<Heir | null>(null);
  // `form` holds the modal state: "add" = create, a Heir = edit, null = closed.
  const [form, setForm] = useState<"add" | Heir | null>(null);
  const { add, edit, del } = useHeirWrites();

  // Live Kesiapan Suksesi = mean of heirs' readiness (only once loaded + non-empty).
  const readiness =
    heirs && heirs.length > 0
      ? `${Math.round(heirs.reduce((s, h) => s + h.readiness, 0) / heirs.length)}%`
      : "—";

  const onSubmit = async (v: Record<string, string>) => {
    if (form && form !== "add") await edit(form._id, v);
    else await add(v);
  };

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatTile
          label="Anggota Keluarga"
          value={isDemo ? STATS.members.value : "—"}
          hint={isDemo ? STATS.members.hint : "belum ada data"}
        />
        <StatTile
          label="Aset dalam Trust"
          value={isDemo ? STATS.trust.value : "—"}
          hint={isDemo ? STATS.trust.hint : "belum ada data"}
          accent
        />
        <StatTile label="Kesiapan Suksesi" value={readiness} hint="rata² ahli waris" tone="up" />
        <StatTile
          label="Wasiat & Dokumen"
          value={isDemo ? STATS.docs.value : "—"}
          hint={isDemo ? STATS.docs.hint : "belum ada data"}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <FamilyTree />

        <SectionCard
          title="Rencana Suksesi"
          sub="Pembagian & kesiapan ahli waris"
          action={
            isDemo ? undefined : (
              <GoldButton onClick={() => setForm("add")}>+ Tambah ahli waris</GoldButton>
            )
          }
        >
          <div className="space-y-3">
            {heirs === undefined ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))
            ) : heirs.length === 0 ? (
              <EmptyState
                message={
                  isDemo
                    ? "Rencana suksesi tersedia di akun principal — data ahli waris tidak ditampilkan dalam mode demo."
                    : "Belum ada ahli waris. Tambahkan untuk mulai merencanakan suksesi."
                }
                action={
                  isDemo ? undefined : (
                    <Button size="sm" variant="outline" onClick={() => setForm("add")}>
                      + Tambah ahli waris
                    </Button>
                  )
                }
              />
            ) : (
              heirs.map((h) => (
                <button
                  key={h._id}
                  onClick={() => setOpen(h)}
                  className="block w-full rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/50"
                >
                  <PersonRow
                    name={h.name}
                    role={h.role}
                    color={h.color}
                    right={<span className="font-display text-lg font-bold text-foreground">{h.share}</span>}
                  />
                  <div className="mt-2">
                    <Meter value={h.readiness} color={h.color} />
                  </div>
                </button>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {governance === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : governance.length === 0 ? (
        <EmptyState message="Belum ada pilar tata kelola keluarga." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {governance.map((b) => (
            <SectionCard key={b._id} title={b.title}>
              <ul className="space-y-1.5">
                {(b.items ?? []).map((it) => (
                  <li key={it} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-[color:var(--color-gold)]">•</span>
                    {it}
                  </li>
                ))}
              </ul>
            </SectionCard>
          ))}
        </div>
      )}

      <DetailSheet
        open={open !== null}
        onClose={() => setOpen(null)}
        eyebrow="Rencana Suksesi"
        title={open?.name ?? ""}
        subtitle={open?.role}
        accent={open?.color}
        actions={
          open && (
            <>
              <DeleteButton
                label={open.name}
                onConfirm={async () => {
                  await del(open._id, open.name);
                  setOpen(null);
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  setForm(open);
                  setOpen(null);
                }}
              >
                Edit
              </Button>
            </>
          )
        }
      >
        {open && (
          <>
            <DataRow label="Bagian kepemilikan" value={open.share} accent />
            <DataRow label="Kesiapan suksesi" value={`${open.readiness}%`} />
            <DataRow label="Mandat" value={open.mandate} />
            <DataRow label="Usia" value={open.age} />
            <div className="mt-4 space-y-2">
              <Meter value={open.readiness} color={open.color} />
              <p className="text-xs text-muted-foreground">Milestone berikut: {open.next}</p>
            </div>
          </>
        )}
      </DetailSheet>

      <FormModal
        open={form !== null}
        onClose={() => setForm(null)}
        title={form && form !== "add" ? "Edit ahli waris" : "Tambah ahli waris"}
        subtitle="Bagian & kesiapan suksesi tercatat di rencana keluarga"
        fields={HEIR_FIELDS}
        submitLabel={form && form !== "add" ? "Perbarui" : "Simpan"}
        initial={form && form !== "add" ? heirInitial(form) : undefined}
        accent={form && form !== "add" ? form.color : "var(--color-gold)"}
        onSubmit={onSubmit}
      />
    </div>
  );
}
