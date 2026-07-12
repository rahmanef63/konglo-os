// Stylized world map with location pins for the estate/asset spread.
// Decorative — replaces prototype SketchMap. Pin colors are theme tokens.
const PIN_COLORS = [
  "var(--color-mk-green)",
  "var(--color-mk-blue)",
  "var(--color-mk-orange)",
  "var(--color-gold)",
  "var(--color-mk-purple)",
];

export function PinMap({
  pins = 5,
  height = 230,
}: {
  pins?: number;
  height?: number;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border bg-[color:var(--input)]/40"
      style={{ height }}
    >
      <svg
        viewBox="0 0 300 160"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="absolute inset-0 opacity-40"
        aria-hidden
      >
        <path
          d="M0 90 Q40 70 80 88 T160 80 T240 92 T300 78"
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth="1.2"
        />
        <path
          d="M0 120 Q60 110 120 122 T240 118 T300 128"
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth="1.2"
        />
        <path d="M70 0 V160 M180 0 V160" stroke="var(--border)" strokeWidth="1" />
      </svg>
      {Array.from({ length: pins }).map((_, i) => (
        <span
          key={i}
          className="absolute h-3.5 w-3.5 shadow-lg"
          style={{
            left: `${14 + i * 17}%`,
            top: `${28 + (i % 3) * 18}%`,
            borderRadius: "999px 999px 999px 0",
            transform: "rotate(-45deg)",
            background: PIN_COLORS[i % PIN_COLORS.length],
          }}
        />
      ))}
    </div>
  );
}
