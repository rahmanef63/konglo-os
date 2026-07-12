// id-ID formatters — SSOT for currency/percent/date. Ported from prototype K.rp/K.pct.
// Slices receive these via props (props-driven) or import directly; never reinvent.
export function rp(n: number): string {
  const a = Math.abs(n);
  // Promote at unit boundaries: toFixed can round a mantissa up to 1000 (e.g.
  // 999_999_999/1e9 → "1000,0 M"), so test against the rounded magnitude, not n.
  if (a >= 1e12 || (a >= 1e9 && Math.abs(n / 1e9).toFixed(1) === "1000.0"))
    return "Rp " + (n / 1e12).toFixed(1).replace(".", ",") + " T";
  if (a >= 1e9 || (a >= 1e6 && Math.abs(n / 1e6).toFixed(0) === "1000"))
    return "Rp " + (n / 1e9).toFixed(1).replace(".", ",") + " M";
  if (a >= 1e6) return "Rp " + (n / 1e6).toFixed(0) + " jt";
  return "Rp " + n.toLocaleString("id-ID");
}

export function pct(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(1).replace(".", ",") + "%";
}

// "baru saja" / "12 mnt lalu" / "3 jam lalu" / "2 hr lalu" (proto K.ago).
export function timeAgoID(ms: number): string {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return m + " mnt lalu";
  const h = Math.floor(m / 60);
  if (h < 24) return h + " jam lalu";
  return Math.floor(h / 24) + " hr lalu";
}

export function formatDateID(ms: number): string {
  return new Date(ms).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
