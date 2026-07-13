import { query } from "../../_generated/server";
import { requirePrincipal } from "../../_shared/auth";

// Admin "Saran & Kritik" — deterministic, rule-based access/usage insights for
// the principal. NO LLM (can't hallucinate). Ranked warn→watch→good, capped,
// computed over users/roles/activity already in Convex.
// Separate file to keep queries.ts under the ~200-line cap.
export type AdminInsight = {
  id: string;
  severity: "warn" | "watch" | "good";
  title: string;
  detail: string;
};

const SEV_RANK: Record<AdminInsight["severity"], number> = { warn: 0, watch: 1, good: 2 };
const DAY = 86_400_000;

export const getAdminInsights = query({
  args: {},
  handler: async (ctx): Promise<AdminInsight[]> => {
    await requirePrincipal(ctx);
    const now = Date.now();
    // Real accounts only (anonymous demo guests excluded) — bounded filter+take.
    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("isAnonymous"), true))
      .take(200);

    let principals = 0, cfos = 0, stafs = 0, noRole = 0, idle = 0;
    for (const u of users) {
      const role = await ctx.db
        .query("roles")
        .withIndex("by_user", (q) => q.eq("userId", u._id))
        .first();
      if (!role) {
        if (u.email) noRole++; // signed in, never granted/denied a role
        continue;
      }
      if (role.role === "principal") principals++;
      else if (role.role === "cfo") cfos++;
      else stafs++;
      // Idle = a real granted role with no live session AND no activity in 30d.
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", u._id))
        .take(20);
      const live = sessions.some((s) => s.expirationTime > now);
      const lastAct = await ctx.db
        .query("activity")
        .withIndex("by_user", (q) => q.eq("userId", u._id))
        .order("desc")
        .first();
      if (!live && (!lastAct || lastAct.at < now - 30 * DAY)) idle++;
    }

    // Recent org activity window — count access changes (meta "akses").
    const recent = await ctx.db.query("activity").withIndex("by_at").order("desc").take(100);
    const accessChanges = recent.filter((r) => r.meta === "akses").length;

    type Cand = AdminInsight & { priority: number };
    const cands: Cand[] = [];

    if (noRole > 0) {
      cands.push({
        id: "unassigned", severity: "warn", priority: 5,
        title: `${noRole} login tanpa peran`,
        detail: `${noRole} akun sudah berhasil masuk (mis. lewat Google) tetapi belum diberi peran — tak bisa mengakses apa pun dan menggantung. Beri akses atau cabut agar daftar tetap bersih dan tak ada pintu setengah terbuka.`,
      });
    }
    if (principals <= 1) {
      cands.push({
        id: "bus-factor", severity: "watch", priority: 10,
        title: "Hanya satu principal",
        detail: `Cuma ${principals} akun principal — tak ada cadangan pemilik. Bila akun ini hilang, akses ke estate ikut terkunci (bus factor = 1). Pertimbangkan rencana kontinuitas: akun principal cadangan lewat seed, tersimpan aman.`,
      });
    }
    if (idle > 0) {
      cands.push({
        id: "idle", severity: "watch", priority: 20,
        title: `${idle} akses menganggur`,
        detail: `${idle} pengguna berperan tak aktif lebih dari 30 hari dan tak sedang masuk. Tinjau apakah aksesnya masih perlu — akses menganggur hanya memperlebar permukaan risiko.`,
      });
    }
    if (accessChanges >= 5) {
      cands.push({
        id: "churn", severity: "watch", priority: 30,
        title: "Banyak perubahan akses",
        detail: `${accessChanges} perubahan akses tercatat baru-baru ini. Pastikan tiap pemberian/pencabutan memang disengaja — telusuri jejaknya di Aktivitas Organisasi.`,
      });
    }
    if (cfos > 0) {
      cands.push({
        id: "cfo-oversight", severity: "watch", priority: 40,
        title: `${cfos} ajudan (CFO) berwenang luas`,
        detail: `CFO adalah admin basis data bisnis (SEC-001): berwenang penuh atas tabel bisnis, tetapi tabel warisan tetap khusus principal. Tinjau tindakan mereka secara berkala di Aktivitas Organisasi.`,
      });
    }

    // Ranked (warn→watch→good, then priority), capped. If nothing fired, one
    // healthy baseline so the panel is never an empty shell of critique.
    cands.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || a.priority - b.priority);
    const out: AdminInsight[] = cands
      .slice(0, 5)
      .map(({ id, severity, title, detail }) => ({ id, severity, title, detail }));
    if (out.length === 0) {
      out.push({
        id: "healthy", severity: "good",
        title: "Struktur akses sehat",
        detail: `${principals} principal · ${cfos} CFO · ${stafs} staf. Tak ada login menggantung atau akses menganggur. Tetap tinjau Aktivitas Organisasi secara berkala.`,
      });
    }
    return out;
  },
});
