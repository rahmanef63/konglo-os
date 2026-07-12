"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SectionCard, useToast, OPEN_ONBOARDING_EVENT } from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { formatDateID } from "@/lib/format";
import { Compass, Database, History, Loader2, RotateCcw, Save, Trash2, UserRound } from "lucide-react";

// Pengaturan — data management + version history. principal-ONLY (menu is hidden
// for cfo/staf via ROLE_MENU; the Convex fns behind it are requirePrincipal too,
// since the scope includes the estate `heirs` table — SEC-001). Every destructive
// action auto-snapshots first, so clear/replace/load/restore are all undoable.
export default function Screen() {
  const status = useQuery(api.features.dataManagement.queries.status);
  const snaps = useQuery(api.features.dataManagement.queries.listSnapshots);
  const loadSample = useMutation(api.features.dataManagement.mutations.loadSample);
  const replaceSample = useMutation(api.features.dataManagement.mutations.replaceWithSample);
  const clearAll = useMutation(api.features.dataManagement.mutations.clearAll);
  const createSnapshot = useMutation(api.features.dataManagement.mutations.createSnapshot);
  const restoreSnapshot = useMutation(api.features.dataManagement.mutations.restoreSnapshot);
  const removeSnapshot = useMutation(api.features.dataManagement.mutations.removeSnapshot);
  const settings = useQuery(api.features.appSettings.queries.get);
  const setHonorific = useMutation(api.features.appSettings.mutations.setHonorific);
  const honorific = settings?.honorific ?? null;

  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [label, setLabel] = useState("");

  const hasData = status?.hasData ?? false;

  const run = async (key: string, fn: () => Promise<unknown>, ok: string, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(key);
    try {
      await fn();
      toast(ok, "success");
    } catch (e) {
      toast((e as Error).message.replace(/^.*Forbidden:\s*/, "") || "Gagal", "error");
    } finally {
      setBusy(null);
    }
  };

  const busyIcon = (key: string) =>
    busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : null;

  return (
    <div className="space-y-4">
      <SectionCard
        title="Sapaan"
        sub={
          honorific
            ? `Konglo OS menyapa Anda sebagai "${honorific}".`
            : "Pilih bagaimana Konglo OS menyapa Anda. Sementara ini: Tuan/Nyonya."
        }
      >
        <div className="flex flex-wrap gap-2.5">
          {(["Tuan", "Nyonya"] as const).map((h) => (
            <Button
              key={h}
              variant={honorific === h ? "default" : "outline"}
              onClick={() => run(`honorific-${h}`, () => setHonorific({ honorific: h }), `Sapaan disetel: ${h}.`)}
              disabled={busy !== null || settings === undefined}
            >
              {busyIcon(`honorific-${h}`) ?? <UserRound className="h-4 w-4" />} {h}
            </Button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Panduan" sub="Buka lagi panduan awal kapan saja.">
        <Button
          variant="outline"
          onClick={() => window.dispatchEvent(new Event(OPEN_ONBOARDING_EVENT))}
        >
          <Compass className="h-4 w-4" /> Buka panduan awal
        </Button>
      </SectionCard>

      <SectionCard
        title="Data"
        sub={
          status === undefined
            ? "Memuat status…"
            : hasData
              ? "Basis data berisi data. Tambahkan atau ganti dengan data contoh, atau kosongkan."
              : "Basis data kosong. Muat data contoh untuk menjelajah, atau mulai dari nol."
        }
      >
        <div className="flex flex-wrap gap-2.5">
          {!hasData && (
            <Button
              onClick={() => run("load", () => loadSample(), "Data contoh dimuat.")}
              disabled={busy !== null || status === undefined}
            >
              {busyIcon("load") ?? <Database className="h-4 w-4" />} Muat data contoh
            </Button>
          )}
          {hasData && (
            <>
              <Button
                variant="outline"
                onClick={() => run("add", () => loadSample(), "Data contoh ditambahkan.")}
                disabled={busy !== null}
              >
                {busyIcon("add") ?? <Database className="h-4 w-4" />} Tambah data contoh
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  run(
                    "replace",
                    () => replaceSample(),
                    "Data diganti dengan data contoh.",
                    "Ganti SEMUA data dengan data contoh? Snapshot otomatis dibuat lebih dulu agar bisa dipulihkan.",
                  )
                }
                disabled={busy !== null}
              >
                {busyIcon("replace") ?? <RotateCcw className="h-4 w-4" />} Ganti dengan data contoh
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  run(
                    "clear",
                    () => clearAll(),
                    "Semua data dikosongkan.",
                    "Kosongkan SEMUA data bisnis? Snapshot otomatis dibuat lebih dulu agar bisa dipulihkan.",
                  )
                }
                disabled={busy !== null}
                className="text-[color:var(--color-mk-red)]"
              >
                {busyIcon("clear") ?? <Trash2 className="h-4 w-4" />} Kosongkan data
              </Button>
            </>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Riwayat Versi"
        sub="Snapshot seluruh dataset. Otomatis dibuat sebelum kosongkan / ganti / muat, atau simpan manual."
        action={
          <div className="flex items-center gap-2">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nama snapshot"
              maxLength={80}
              className="w-36 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                run("snap", async () => {
                  await createSnapshot({ label });
                  setLabel("");
                }, "Snapshot disimpan.")
              }
              disabled={busy !== null}
            >
              {busyIcon("snap") ?? <Save className="h-4 w-4" />} Simpan
            </Button>
          </div>
        }
      >
        {snaps === undefined ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Memuat…</p>
        ) : snaps.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <History className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Belum ada snapshot.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {snaps.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {s.label}
                    {s.kind === "auto" && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        otomatis
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateID(s.createdAt)} · {s.rowCount} baris
                    {s.createdByEmail ? ` · ${s.createdByEmail}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      run(
                        `restore-${s.id}`,
                        () => restoreSnapshot({ id: s.id as Id<"dataSnapshots"> }),
                        "Data dipulihkan dari snapshot.",
                        `Pulihkan data ke "${s.label}"? Data saat ini di-snapshot dulu.`,
                      )
                    }
                    disabled={busy !== null}
                  >
                    {busyIcon(`restore-${s.id}`) ?? <RotateCcw className="h-4 w-4" />} Pulihkan
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      run(
                        `del-${s.id}`,
                        () => removeSnapshot({ id: s.id as Id<"dataSnapshots"> }),
                        "Snapshot dihapus.",
                        `Hapus snapshot "${s.label}"?`,
                      )
                    }
                    disabled={busy !== null}
                    className="text-[color:var(--color-mk-red)]"
                    aria-label={`Hapus snapshot ${s.label}`}
                  >
                    {busyIcon(`del-${s.id}`) ?? <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
