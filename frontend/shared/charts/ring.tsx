// Progress ring / gauge with centered value + label. Replaces SketchRing.
export function Ring({
  value,
  label = "%",
  color = "var(--color-mk-green)",
  size = 108,
}: {
  value: number;
  label?: string;
  color?: string;
  size?: number;
}) {
  const R = 40;
  const C = 50;
  const sw = 10;
  const circ = 2 * Math.PI * R;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--input)" strokeWidth={sw} />
      <circle
        cx={C}
        cy={C}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 50 50)"
      />
      <text
        x="50"
        y="49"
        textAnchor="middle"
        fill="var(--foreground)"
        style={{ font: "700 22px var(--font-display)" }}
      >
        {value}
      </text>
      <text x="50" y="65" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9">
        {label}
      </text>
    </svg>
  );
}
