// Rounded bar chart. Last bar highlighted in accent color by default.
// Replaces prototype SketchBars — muted track bars + theme-token accent.
export function BarChart({
  values,
  color = "var(--color-gold)",
  height = 120,
  highlightLast = true,
}: {
  values: number[];
  color?: string;
  height?: number;
  highlightLast?: boolean;
}) {
  const W = 320;
  const H = height;
  const pad = 6;
  const gap = 8;
  const max = Math.max(...values) || 1;
  const bw = (W - pad * 2 - gap * (values.length - 1)) / values.length;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      aria-hidden
    >
      {values.map((v, i) => {
        const bh = (v / max) * (H - pad * 2);
        const last = highlightLast && i === values.length - 1;
        return (
          <rect
            key={i}
            x={pad + i * (bw + gap)}
            y={H - pad - bh}
            width={bw}
            height={bh}
            rx="4"
            fill={last ? color : "var(--muted-foreground)"}
            opacity={last ? 0.92 : 0.26}
          />
        );
      })}
    </svg>
  );
}
