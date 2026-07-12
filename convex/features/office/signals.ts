import { query } from "../../_generated/server";
import { requireFeature } from "../../_shared/auth";

// ── Sinyal Hari Ini (P1a) ────────────────────────────────────────────────────
// Deterministic, rule-based decision signals for the top of Beranda. NO LLM.
// Reads data already in Convex, computes 5 structural/relative rules that fire
// honestly on the all-healthy seed AND carry absolute thresholds that turn red
// once a real problem is planted (P1b). Dedicated file (not queries.ts) to stay
// under the ~200-line cap. API path: api.features.office.signals.getSignals.
export type Signal = {
  id: string;
  severity: "warn" | "watch" | "good";
  title: string;
  detail: string;
  domain: string; // menu slug for future click-through
};

const SEV_RANK: Record<Signal["severity"], number> = { warn: 0, watch: 1, good: 2 };

// id-ID number: integers render clean ("64"), fractions to one comma-decimal
// ("38,8"). Self-contained so this query needs no lib import.
function numID(n: number): string {
  const s = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return s.replace(".", ",");
}
function pctSigned(n: number): string {
  return (n >= 0 ? "+" : "") + numID(n) + "%";
}

export const getSignals = query({
  args: {},
  handler: async (ctx): Promise<Signal[]> => {
    // Dual feature gate: principal=all, cfo holds both, staf holds neither →
    // staf never reaches this data (matches the Beranda section gating).
    await requireFeature(ctx, "kekayaan-kas");
    await requireFeature(ctx, "portofolio-bisnis");

    const subs = await ctx.db
      .query("subsidiaries")
      .withIndex("by_order")
      .take(200);
    const figures = await ctx.db
      .query("officeFigures")
      .withIndex("by_key", (q) => q.eq("key", "current"))
      .first();
    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_order")
      .take(50);

    // Candidates carry a stable `priority` (deterministic tie-break within a
    // severity) and the `entity` they own (so one thing is never flagged twice).
    type Cand = Signal & { priority: number; entity: string };
    const cands: Cand[] = [];

    // R1 · Leverage (balance-sheet). Absolute thresholds; always fires when the
    // singleton exists — seed 23,5% renders the credibility "good".
    if (figures) {
      const d = figures.debtRatio;
      if (d > 40) {
        cands.push({
          id: "leverage", severity: "warn", entity: "office:leverage",
          priority: 40, domain: "kekayaan-kas", title: "Leverage tinggi",
          detail: `Rasio utang Anda ${numID(d)}% sudah melewati ambang kehati-hatian 40% — prioritaskan deleveraging sebelum menambah eksposur.`,
        });
      } else if (d > 25) {
        cands.push({
          id: "leverage", severity: "watch", entity: "office:leverage",
          priority: 40, domain: "kekayaan-kas", title: "Utang mulai naik",
          detail: `Rasio utang Anda ${numID(d)}% mulai mendekati ambang kehati-hatian 40% — evaluasi jadwal refinancing sebelum menambah pinjaman.`,
        });
      } else {
        cands.push({
          id: "leverage", severity: "good", entity: "office:leverage",
          priority: 40, domain: "kekayaan-kas", title: "Neraca konservatif",
          detail: `Rasio utang Anda ${numID(d)}%, jauh di bawah ambang kehati-hatian 40% — ada ruang leverage bila peluang akuisisi bernilai muncul.`,
        });
      }
    }

    // R2 · Konsentrasi alokasi (asset structure). Largest slice share of the
    // whole portfolio. Flags the slice, never the smallest (thin cash is not a
    // structural risk for a family office). Seed bisnis 38,8% → watch.
    const allocTotal = allocations.reduce((s, a) => s + a.value, 0);
    if (allocTotal > 0) {
      const top = allocations.reduce((m, a) => (a.value > m.value ? a : m));
      const share = (top.value / allocTotal) * 100;
      if (share > 50) {
        cands.push({
          id: "allocation-concentration", severity: "warn", entity: `alloc:${top.slug}`,
          priority: 10, domain: "kekayaan-kas", title: `Konsentrasi kritis pada ${top.label}`,
          detail: `${top.label} menyerap ${numID(share)}% kekayaan bersih Anda — eksposur tunggal yang dominan; guncangan di kelas aset ini langsung menekan nilai bersih, susun rencana diversifikasi.`,
        });
      } else if (share > 35) {
        cands.push({
          id: "allocation-concentration", severity: "watch", entity: `alloc:${top.slug}`,
          priority: 10, domain: "kekayaan-kas", title: `Konsentrasi pada ${top.label}`,
          detail: `${top.label} menyerap ${numID(share)}% kekayaan bersih Anda — eksposur kelas aset terbesar; guncangan di kelas ini paling memukul nilai bersih, pertimbangkan diversifikasi terencana.`,
        });
      }
    }

    // R3 · Kendali kepemilikan (control). The single least-owned subsidiary.
    // watch below the two-thirds supermajority line, warn below majority.
    // Seed tek 64% → watch. Dedupe: only the one thinnest stake.
    if (subs.length > 0) {
      const min = subs.reduce((m, s) => (s.ownership < m.ownership ? s : m));
      if (min.ownership < 50) {
        cands.push({
          id: "ownership-control", severity: "warn", entity: `sub:${min.slug}`,
          priority: 20, domain: "portofolio-bisnis", title: `Kendali minoritas di ${min.name}`,
          detail: `Kepemilikan Anda di ${min.name} hanya ${numID(min.ownership)}% — di bawah 50%, kendali strategis sudah lepas; tinjau perjanjian pemegang saham sebelum langkah berikutnya.`,
        });
      } else if (min.ownership < 67) {
        cands.push({
          id: "ownership-control", severity: "watch", entity: `sub:${min.slug}`,
          priority: 20, domain: "portofolio-bisnis", title: `Kendali belum penuh di ${min.name}`,
          detail: `Kepemilikan Anda di ${min.name} ${numID(min.ownership)}% — di bawah ambang supermayoritas dua pertiga; di entitas inilah putaran pendanaan atau keluarnya mitra paling cepat menggerus kendali Anda.`,
        });
      }
    }

    // R4 · Kesehatan anak usaha (momentum + profitabilitas). THE red-escalation
    // guarantee. If any unit is distressed (trend<0 OR margin<10) flag the worst
    // as warn; otherwise flag the slowest grower as a watch. Seed: no distress →
    // log +3,2% watch. Plant a bad unit → same rule turns red, flags that unit.
    if (subs.length > 0) {
      const distressed = subs.filter((s) => s.trend < 0 || s.margin < 10);
      if (distressed.length > 0) {
        const w = distressed.reduce((a, b) => {
          if (b.trend !== a.trend) return b.trend < a.trend ? b : a; // most negative trend
          return b.margin < a.margin ? b : a; // then thinnest margin
        });
        const issue =
          w.trend < 0 && w.margin < 10
            ? "pertumbuhan negatif dan margin di bawah 10%"
            : w.trend < 0
              ? "pertumbuhan negatif"
              : "margin di bawah ambang sehat 10%";
        cands.push({
          id: "subsidiary-health", severity: "warn", entity: `sub:${w.slug}`,
          priority: 30, domain: "portofolio-bisnis", title: `${w.name} dalam tekanan`,
          detail: `${w.name} mencatat ${issue} (margin ${numID(w.margin)}%, pertumbuhan ${pctSigned(w.trend)}) — tinjau penyebab dan rencana pemulihan sebelum menambah modal.`,
        });
      } else {
        const w = subs.reduce((a, b) => (b.trend < a.trend ? b : a));
        cands.push({
          id: "subsidiary-health", severity: "watch", entity: `sub:${w.slug}`,
          priority: 30, domain: "portofolio-bisnis", title: `Momentum ${w.name} paling lambat`,
          detail: `${w.name} tumbuh ${pctSigned(w.trend)}, terendah dari ${subs.length} anak usaha — tinjau apakah ini ritme normal sektornya atau pelemahan yang perlu ditindak.`,
        });
      }
    }

    // R5 · Sebaran pendapatan (income structure). Top earner's share of group
    // revenue — a dependency lens no other rule covers. Seed fin 23,5% → good.
    if (subs.length > 0) {
      const revTotal = subs.reduce((s, x) => s + x.revenue, 0);
      if (revTotal > 0) {
        const top = subs.reduce((m, x) => (x.revenue > m.revenue ? x : m));
        const share = (top.revenue / revTotal) * 100;
        if (share >= 50) {
          cands.push({
            id: "revenue-concentration", severity: "warn", entity: `sub:${top.slug}`,
            priority: 50, domain: "portofolio-bisnis", title: `${top.name} menyumbang ${numID(share)}% pendapatan grup`,
            detail: `Lebih dari separuh pendapatan operasional grup bersumber dari ${top.name} — ketergantungan satu entitas; guncangan di sini menggerus arus kas seluruh grup.`,
          });
        } else if (share >= 35) {
          cands.push({
            id: "revenue-concentration", severity: "watch", entity: `sub:${top.slug}`,
            priority: 50, domain: "portofolio-bisnis", title: `Pendapatan bertumpu pada ${top.name}`,
            detail: `${top.name} menyumbang ${numID(share)}% pendapatan operasional grup — porsi terbesar; jaga agar lini lain ikut menopang basis pendapatan.`,
          });
        } else if (share < 30) {
          cands.push({
            id: "revenue-concentration", severity: "good", entity: "group:revenue-spread",
            priority: 50, domain: "portofolio-bisnis", title: "Pendapatan grup tersebar",
            detail: `${top.name}, penyumbang terbesar, hanya ${numID(share)}% pendapatan operasional grup — basis pendapatan Anda tidak bergantung pada satu perusahaan.`,
          });
        }
      }
    }

    // Sort warn→watch→good, then by rule priority (stable, deterministic).
    // Dedupe by entity so the same thing is never flagged twice, cap at 4.
    cands.sort(
      (a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || a.priority - b.priority,
    );
    const seen = new Set<string>();
    const out: Signal[] = [];
    for (const c of cands) {
      if (seen.has(c.entity)) continue;
      seen.add(c.entity);
      out.push({ id: c.id, severity: c.severity, title: c.title, detail: c.detail, domain: c.domain });
      if (out.length >= 4) break;
    }
    return out;
  },
});
