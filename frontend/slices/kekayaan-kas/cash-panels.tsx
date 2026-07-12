"use client";

import { useState } from "react";
import {
  SectionCard,
  DataRow,
  DetailSheet,
  BarChart,
  EmptyState,
  useIsDemo,
} from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { safeColor } from "@/lib/safe-css";
import { CASHFLOW, EXPENSES, TOTAL_COMMITMENT, type Expense } from "./data";

// Bottom row of Kekayaan & Kas: monthly cash-flow bars + scheduled large
// expenses. Both series are illustrative mock (no Convex table backs them), so a
// DEMO user sees them (with SectionCard's `sample` pill) and a REAL user sees a
// neutral empty state. Owns the expense DetailSheet since only these mock rows
// open it. Extracted from screen.tsx to keep that file under the rr 200-line cap.
export function CashPanels() {
  const isDemo = useIsDemo();
  const [bill, setBill] = useState<Expense | null>(null);
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Arus Kas Bulanan" sub="Masuk vs keluar (family office)" sample={isDemo}>
          {isDemo ? (
            <>
              <BarChart values={CASHFLOW} color="var(--color-gold)" height={120} />
              <div className="mt-2 flex items-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[color:var(--color-gold)]" /> Pemasukan
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/40" /> Pengeluaran
                </span>
              </div>
            </>
          ) : (
            <div
              style={{ height: 120 }}
              className="flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground"
            >
              Belum ada data
            </div>
          )}
        </SectionCard>

        <SectionCard title="Pengeluaran Besar" sub="30 hari ke depan · ketuk untuk setujui" sample={isDemo}>
          {isDemo ? (
            <>
              <div className="space-y-1">
                {EXPENSES.map((e) => (
                  <button
                    key={e.title}
                    onClick={() => setBill(e)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: safeColor(e.color) }} />
                      <span className="truncate text-sm text-foreground">{e.title}</span>
                    </span>
                    <span className="whitespace-nowrap text-sm font-semibold text-foreground">{e.amount}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-sm text-muted-foreground">Total komitmen</span>
                <span className="font-display text-lg font-bold text-foreground">{TOTAL_COMMITMENT}</span>
              </div>
            </>
          ) : (
            <EmptyState message="Belum ada pengeluaran terjadwal." />
          )}
        </SectionCard>
      </div>

      <DetailSheet
        open={bill !== null}
        onClose={() => setBill(null)}
        eyebrow="Pengeluaran Terjadwal"
        title={bill?.title ?? ""}
        subtitle={bill ? `Jatuh tempo ${bill.due}` : undefined}
        accent={bill?.color}
        actions={<Button size="sm" disabled title="Segera hadir">Setujui pembayaran · segera hadir</Button>}
      >
        {bill && (
          <>
            <DataRow label="Jumlah" value={bill.amount} accent />
            <DataRow label="Jatuh tempo" value={bill.due} />
            <DataRow label="Penerima" value={bill.to} />
          </>
        )}
      </DetailSheet>
    </>
  );
}
