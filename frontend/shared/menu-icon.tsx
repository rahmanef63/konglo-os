// Line-icon set, ported from prototype nav.jsx MenuIcon. Keyed by feature slug.
const PATHS: Record<string, string> = {
  beranda: "M3 11l9-8 9 8M5 9v11h5v-6h4v6h5V9",
  "portofolio-bisnis": "M3 7h18v13H3zM8 7V4h8v3",
  "kekayaan-kas": "M3 6h18v12H3zM3 10h18M7 14h4",
  "investasi-pasar": "M4 18l5-5 4 4 7-9M14 8h6v6",
  "properti-aset": "M4 20V9l8-6 8 6v11h-6v-7H10v7z",
  "keluarga-warisan": "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-2a6 6 0 016-6h4",
  "hiburan-gaya-hidup": "M4 5h16v11H4zM9 21h6M12 16v5",
  kesehatan: "M12 5v14M5 12h14",
  filantropi:
    "M12 21C7 17 3 13 3 8.5 3 6 5 4 7.5 4c1.7 0 3.2 1 4.5 2.5C13.3 5 14.8 4 16.5 4 19 4 21 6 21 8.5c0 4.5-4 8.5-9 12.5z",
  "relasi-jaringan":
    "M6 8a3 3 0 100-6 3 3 0 000 6zM18 8a3 3 0 100-6 3 3 0 000 6zM6 22a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.5 6.5l7 0M8.5 17.5l7 0M6 8v8M18 8v8",
  "keamanan-staf": "M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z",
  "data-studio": "M3 5h18v14H3zM3 10h18M9 5v14",
  asisten:
    "M11 3l1.6 4.4L17 9l-4.4 1.6L11 15l-1.6-4.4L5 9l4.4-1.6zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z",
};

export function MenuIcon({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable={false}
    >
      <path d={PATHS[name] ?? ""} />
    </svg>
  );
}
