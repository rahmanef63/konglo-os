// SSOT for the feature menu — order, labels, accents (ported from prototype
// registerFeature manifests + nav.jsx). Slug drives registry + RBAC (lib/roles).
export interface FeatureMeta {
  slug: string;
  label: string;
  tag: string;
  sub: string;
  accent: string;
  // Optional category — groups the feature browser accordion (feature-cards.tsx).
  // beranda has none (it's the home, excluded from the browser).
  group?: string;
}

export const MENU: FeatureMeta[] = [
  { slug: "beranda", label: "Beranda", tag: "Ringkasan", sub: "Ringkasan kekayaan & sinyal hari ini", accent: "var(--color-gold)" },
  { slug: "portofolio-bisnis", label: "Portofolio Bisnis", tag: "Operasi", sub: "Anak usaha, kinerja & tata kelola", accent: "var(--color-gold)", group: "Aset & Kekayaan" },
  { slug: "kekayaan-kas", label: "Kekayaan & Kas", tag: "Likuiditas", sub: "Arus kas, rekening & simpanan", accent: "var(--color-gold)", group: "Aset & Kekayaan" },
  { slug: "investasi-pasar", label: "Investasi Pasar", tag: "Likuid", sub: "Saham, obligasi & instrumen pasar", accent: "var(--color-mk-blue)", group: "Aset & Kekayaan" },
  { slug: "properti-aset", label: "Properti & Aset", tag: "Estat", sub: "Real estat, kendaraan & barang berharga", accent: "var(--color-mk-green)", group: "Aset & Kekayaan" },
  { slug: "keluarga-warisan", label: "Keluarga & Warisan", tag: "Legasi", sub: "Anggota keluarga, trust & suksesi", accent: "var(--color-mk-cyan)", group: "Keluarga & Legasi" },
  { slug: "filantropi", label: "Filantropi", tag: "Dampak", sub: "Yayasan, program & komitmen sosial", accent: "var(--color-mk-purple)", group: "Keluarga & Legasi" },
  { slug: "kesehatan", label: "Kesehatan", tag: "Vitalitas", sub: "Medis, kebugaran & asuransi", accent: "var(--color-mk-green)", group: "Pribadi" },
  { slug: "hiburan-gaya-hidup", label: "Gaya Hidup", tag: "Pribadi", sub: "Koleksi, perjalanan & pengalaman", accent: "var(--color-mk-orange)", group: "Pribadi" },
  { slug: "relasi-jaringan", label: "Relasi & Jaringan", tag: "Koneksi", sub: "Kontak VIP, mitra & jaringan", accent: "var(--color-mk-purple)", group: "Operasi & Relasi" },
  { slug: "keamanan-staf", label: "Keamanan & Staf", tag: "Operasi", sub: "Tim, akses & keamanan aset", accent: "var(--color-mk-red)", group: "Operasi & Relasi" },
  { slug: "data-studio", label: "Studio Data", tag: "Data", sub: "Kelola seluruh basis data — tabel ala Notion", accent: "var(--color-mk-blue)", group: "Sistem" },
  // AI assistant — the mobile dock's center action; also listed here under Sistem.
  { slug: "asisten", label: "Asisten", tag: "AI", sub: "Tanya apa saja tentang grup usaha", accent: "var(--color-mk-purple)", group: "Sistem" },
  // Pengaturan — principal-ONLY (cfo/staf ROLE_MENU lists omit it → auto-hidden).
  // Data management (load/replace/clear sample) + version history. Scope includes
  // the estate `heirs` table, so the fns behind it are requirePrincipal (SEC-001).
  { slug: "pengaturan", label: "Pengaturan", tag: "Sistem", sub: "Kelola data, contoh & riwayat versi", accent: "var(--color-gold)", group: "Sistem" },
  // Admin & Akses — principal-ONLY (ROLE_MENU: principal="all", cfo/staf lists omit
  // it, so it's auto-hidden). Manage users + roles. Placed last.
  { slug: "admin", label: "Admin & Akses", tag: "Sistem", sub: "Kelola pengguna & peran akses", accent: "var(--color-gold)", group: "Sistem" },
];

export const MENU_BY_SLUG: Record<string, FeatureMeta> = Object.fromEntries(
  MENU.map((m) => [m.slug, m]),
);
