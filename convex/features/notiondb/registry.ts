// SSOT for the "Studio Data" generic CRUD surface (ajudan/cfo + principal manage
// the Konglo database via a Notion-style table). Maps each EXPOSED Convex table to
// its editable columns, auto-filled system fields, native indexes, and per-column
// validators. Read by queries (columns → client) and mutations (defaults +
// allow-list + boundary validation).

export type ColType = "text" | "number" | "select";

export interface ColumnSpec {
  field: string;
  label: string;
  type: ColType;
  // For `select`: the closed set of valid values (rejected otherwise).
  options?: string[];
  // For `number`: inclusive numeric bounds enforced at the mutation boundary.
  // Money columns get { min: 0 }; percentages { min: 0, max: 100 }. Absence
  // still requires a finite number (NaN / Infinity always rejected).
  numeric?: { min?: number; max?: number };
}

// Percentage bound shared by every "... %" column (margin, ownership, readiness,
// progress, trend). Trend is a signed delta in some domains, but the seeded data
// and the screens treat it as a 0–100 share, so we keep the closed range.
const PCT = { min: 0, max: 100 } as const;
// Money / count columns: non-negative, no upper cap.
const NONNEG = { min: 0 } as const;

// Sensitivity tier governs WHO may CRUD a table via the data-studio surface:
//   "standard"  → any caller holding the data-studio feature (principal | cfo).
//                 Honors the owner's explicit request that ajudan (cfo) admin
//                 the Konglo BUSINESS database (subsidiaries/contacts/grants/staf).
//   "principal" → ALSO requires requirePrincipal. The estate / succession data
//                 (heirs = ahli waris) is the principal's private plan; cfo's
//                 per-feature menu already hides keluarga-warisan, and the
//                 data-studio admin surface must NOT be a back door into it.
export type Sensitivity = "standard" | "principal";

export interface TableSpec {
  table: string;
  label: string;
  columns: ColumnSpec[];
  // Slice that natively owns this data (for traceability against lib/roles.ts).
  owningFeature: string;
  // Access tier enforced on top of the data-studio feature gate (see above).
  sensitivity: Sensitivity;
  // `order` is always auto-assigned; slug/color only where the table has them.
  auto: { slug?: boolean; color?: boolean };
  // Which native indexes this table declares (lock-step with the slice schema).
  // Mutations use these for a race-safe path: `order` → derive next order from a
  // DESC by_order .first() (max, not a scan); `slug` → collision check via by_slug
  // .eq(base).first(). Absent → the createRow handler falls back to a take() scan.
  indexes: { order?: boolean; slug?: boolean };
}

// Only these tables are reachable by the generic CRUD fns (hard allow-list).
// Covers every business/list table so Studio Data can view/clear ALL data — the
// only excluded business table is `officeFigures` (a keyed net-worth SINGLETON
// with no `order`/list shape; cleared via Settings → Kosongkan / edited on the
// kekayaan-kas screen).
export type StudioTable =
  | "subsidiaries"
  | "contacts"
  | "philanthropyGrants"
  | "heirs"
  | "staffRoster"
  | "allocations"
  | "holdings"
  | "propertyAssets"
  | "philanthropyImpact"
  | "lifestyleEvents"
  | "conciergeReservations"
  | "conciergeRequests"
  | "securityZones"
  | "securityMetrics"
  | "governanceBuckets"
  | "healthMedicalTeam"
  | "healthSchedule"
  | "healthPrograms";

// Accent palette (theme tokens) auto-assigned to new rows that carry a color.
export const PALETTE = [
  "var(--color-mk-blue)",
  "var(--color-mk-green)",
  "var(--color-mk-purple)",
  "var(--color-mk-orange)",
  "var(--color-gold)",
];

export const TABLES: TableSpec[] = [
  {
    table: "subsidiaries",
    label: "Anak Usaha",
    owningFeature: "portofolio-bisnis",
    sensitivity: "standard",
    auto: { slug: true, color: true },
    // subsidiaries schema declares by_slug AND by_order.
    indexes: { slug: true, order: true },
    columns: [
      { field: "name", label: "Nama", type: "text" },
      { field: "sector", label: "Sektor", type: "text" },
      { field: "revenue", label: "Pendapatan (Rp)", type: "number", numeric: NONNEG },
      { field: "margin", label: "Margin %", type: "number", numeric: PCT },
      { field: "ownership", label: "Kepemilikan %", type: "number", numeric: PCT },
      { field: "trend", label: "Tren %", type: "number", numeric: PCT },
    ],
  },
  {
    table: "contacts",
    label: "Kontak VIP",
    owningFeature: "relasi-jaringan",
    sensitivity: "standard",
    auto: { slug: true },
    // contacts schema declares by_slug AND by_order.
    indexes: { slug: true, order: true },
    columns: [
      { field: "name", label: "Nama", type: "text" },
      { field: "role", label: "Peran", type: "text" },
      { field: "tier", label: "Kategori", type: "select", options: ["Pemerintah", "Mitra", "Investor", "Bisnis"] },
      { field: "warmth", label: "Kehangatan", type: "select", options: ["Hangat", "Netral", "Perlu disapa"] },
      { field: "last", label: "Kontak terakhir", type: "text" },
    ],
  },
  {
    table: "philanthropyGrants",
    label: "Hibah Filantropi",
    owningFeature: "filantropi",
    sensitivity: "standard",
    auto: { color: true },
    // philanthropyGrants schema: index("by_order") only — no slug field.
    indexes: { order: true },
    columns: [
      { field: "name", label: "Program", type: "text" },
      { field: "category", label: "Kategori", type: "text" },
      { field: "amount", label: "Komitmen", type: "text" },
      { field: "progress", label: "Progress %", type: "number", numeric: PCT },
      { field: "beneficiaries", label: "Penerima", type: "text" },
      { field: "region", label: "Wilayah", type: "text" },
      { field: "partner", label: "Mitra", type: "text" },
    ],
  },
  {
    table: "heirs",
    label: "Ahli Waris",
    owningFeature: "keluarga-warisan",
    sensitivity: "principal",
    auto: { color: true },
    // heirs schema: index("by_order") only — no slug field.
    indexes: { order: true },
    columns: [
      { field: "name", label: "Nama", type: "text" },
      { field: "role", label: "Peran", type: "text" },
      { field: "share", label: "Bagian", type: "text" },
      { field: "readiness", label: "Kesiapan %", type: "number", numeric: PCT },
      { field: "age", label: "Usia", type: "text" },
      { field: "next", label: "Milestone", type: "text" },
      { field: "mandate", label: "Mandat", type: "text" },
    ],
  },
  {
    table: "staffRoster",
    label: "Staf & Keamanan",
    owningFeature: "keamanan-staf",
    sensitivity: "standard",
    auto: { slug: true, color: true },
    // staffRoster schema: BOTH index("by_slug") and index("by_order").
    indexes: { slug: true, order: true },
    columns: [
      { field: "name", label: "Nama", type: "text" },
      { field: "role", label: "Peran", type: "text" },
      { field: "status", label: "Status", type: "text" },
      { field: "location", label: "Penempatan", type: "text" },
      { field: "shift", label: "Jam kerja", type: "text" },
      { field: "tenure", label: "Masa kerja", type: "text" },
    ],
  },
  {
    table: "allocations",
    label: "Alokasi Portofolio",
    owningFeature: "kekayaan-kas",
    sensitivity: "standard",
    auto: { slug: true }, // accent is optional (theme token), never a color auto-fill
    indexes: { slug: true, order: true },
    columns: [
      { field: "label", label: "Label", type: "text" },
      { field: "value", label: "Nilai (Rp)", type: "number", numeric: NONNEG },
      { field: "accent", label: "Aksen (token)", type: "text" },
    ],
  },
  {
    table: "holdings",
    label: "Instrumen Pasar",
    owningFeature: "investasi-pasar",
    sensitivity: "standard",
    auto: { slug: true, color: true },
    indexes: { slug: true, order: true },
    // `up` (bool) + `points` (array) are schema-optional and not modelable as flat
    // columns → omitted here; edited on the investasi-pasar screen.
    columns: [
      { field: "name", label: "Nama", type: "text" },
      { field: "ticker", label: "Kode", type: "text" },
      { field: "value", label: "Nilai", type: "text" },
      { field: "change", label: "Perubahan", type: "text" },
      { field: "weight", label: "Bobot", type: "text" },
      { field: "avg", label: "Rerata", type: "text" },
      { field: "lot", label: "Lot", type: "text" },
      { field: "sector", label: "Sektor", type: "text" },
    ],
  },
  {
    table: "propertyAssets",
    label: "Properti & Aset",
    owningFeature: "properti-aset",
    sensitivity: "standard",
    auto: { slug: true, color: true },
    indexes: { slug: true, order: true },
    columns: [
      { field: "name", label: "Nama", type: "text" },
      { field: "type", label: "Jenis", type: "text" },
      { field: "value", label: "Nilai", type: "text" },
      { field: "location", label: "Lokasi", type: "text" },
      { field: "maint", label: "Perawatan", type: "text" },
      { field: "status", label: "Status", type: "text" },
      { field: "year", label: "Tahun", type: "text" },
      { field: "note", label: "Catatan", type: "text" },
    ],
  },
  {
    table: "philanthropyImpact",
    label: "Dampak Filantropi",
    owningFeature: "filantropi",
    sensitivity: "standard",
    auto: {},
    indexes: { order: true },
    columns: [
      { field: "label", label: "Metrik", type: "text" },
      { field: "value", label: "Nilai", type: "text" },
    ],
  },
  {
    table: "lifestyleEvents",
    label: "Acara Gaya Hidup",
    owningFeature: "hiburan-gaya-hidup",
    sensitivity: "standard",
    auto: { color: true },
    indexes: { order: true },
    columns: [
      { field: "date", label: "Tanggal", type: "text" },
      { field: "title", label: "Judul", type: "text" },
      { field: "location", label: "Lokasi", type: "text" },
    ],
  },
  {
    table: "conciergeReservations",
    label: "Reservasi Konsierge",
    owningFeature: "hiburan-gaya-hidup",
    sensitivity: "standard",
    auto: {},
    indexes: { order: true },
    columns: [
      { field: "emoji", label: "Ikon", type: "text" },
      { field: "label", label: "Label", type: "text" },
    ],
  },
  {
    table: "conciergeRequests",
    label: "Permintaan Konsierge",
    owningFeature: "hiburan-gaya-hidup",
    sensitivity: "standard",
    auto: {},
    indexes: { order: true },
    columns: [{ field: "label", label: "Permintaan", type: "text" }],
  },
  {
    table: "securityZones",
    label: "Zona Keamanan",
    owningFeature: "keamanan-staf",
    sensitivity: "standard",
    auto: { slug: true, color: true },
    indexes: { slug: true, order: true },
    columns: [
      { field: "label", label: "Zona", type: "text" },
      { field: "status", label: "Status", type: "text" },
    ],
  },
  {
    table: "securityMetrics",
    label: "Metrik Keamanan",
    owningFeature: "keamanan-staf",
    sensitivity: "standard",
    auto: { slug: true }, // `panic` (bool) omitted — edited on the keamanan-staf screen
    indexes: { slug: true, order: true },
    columns: [
      { field: "label", label: "Metrik", type: "text" },
      { field: "value", label: "Nilai", type: "text" },
    ],
  },
  {
    table: "governanceBuckets",
    label: "Tata Kelola Warisan",
    owningFeature: "keluarga-warisan",
    // Estate governance — same principal-only tier as heirs (SEC-001). cfo's menu
    // hides keluarga-warisan; Studio Data must not surface this to cfo either.
    sensitivity: "principal",
    auto: {},
    indexes: { order: true },
    // `items` (array of bullets) isn't a flat column → edited on the screen.
    columns: [{ field: "title", label: "Judul", type: "text" }],
  },
  {
    table: "healthMedicalTeam",
    label: "Tim Medis",
    owningFeature: "kesehatan",
    sensitivity: "standard",
    auto: { color: true },
    indexes: { order: true },
    columns: [
      { field: "name", label: "Nama", type: "text" },
      { field: "role", label: "Peran", type: "text" },
    ],
  },
  {
    table: "healthSchedule",
    label: "Jadwal Kesehatan",
    owningFeature: "kesehatan",
    sensitivity: "standard",
    auto: { color: true },
    indexes: { order: true },
    columns: [
      { field: "date", label: "Tanggal", type: "text" },
      { field: "title", label: "Judul", type: "text" },
      { field: "location", label: "Lokasi", type: "text" },
    ],
  },
  {
    table: "healthPrograms",
    label: "Program Kesehatan",
    owningFeature: "kesehatan",
    sensitivity: "standard",
    auto: {},
    indexes: { order: true },
    columns: [
      { field: "label", label: "Program", type: "text" },
      { field: "value", label: "Nilai", type: "text" },
    ],
  },
];

export const TABLE_MAP: Map<string, TableSpec> = new Map(
  TABLES.map((t) => [t.table, t]),
);

// Per-column boundary validation. Enforces the ColumnSpec contract at the
// MUTATION edge (NOT in schema validators — prod has live seeded data; a schema
// type change would abort the deploy). Rejects a JS-type mismatch, a select value
// outside `options`, and a non-finite / out-of-`numeric`-range number. `undefined`
// = field absent in this write → skipped (createRow omits cols; updateRow = 1 field).
export function validateColumn(col: ColumnSpec, value: unknown): void {
  if (value === undefined) return;
  switch (col.type) {
    case "text":
    case "select": {
      if (typeof value !== "string") {
        throw new Error(`Field ${col.field} must be a string`);
      }
      if (col.type === "select" && col.options && !col.options.includes(value)) {
        throw new Error(
          `Field ${col.field} must be one of: ${col.options.join(", ")}`,
        );
      }
      return;
    }
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`Field ${col.field} must be a finite number`);
      }
      const { min, max } = col.numeric ?? {};
      if (min !== undefined && value < min) {
        throw new Error(`Field ${col.field} must be >= ${min}`);
      }
      if (max !== undefined && value > max) {
        throw new Error(`Field ${col.field} must be <= ${max}`);
      }
      return;
    }
  }
}

// Validate a bag of caller-supplied field values against a table's column specs.
// Unknown keys are IGNORED here — the createRow/updateRow handlers own the
// editable-field allow-list; this fn only type/range-checks the known columns.
export function validateValues(
  spec: TableSpec,
  values: Record<string, unknown>,
): void {
  for (const col of spec.columns) {
    validateColumn(col, values[col.field]);
  }
}
