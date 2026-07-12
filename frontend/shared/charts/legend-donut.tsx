import { safeColor } from "@/lib/safe-css";

// Donut + color legend, props-driven. `note` overrides the auto % on the right.
export interface DonutSeg {
  label: string;
  value: number;
  color: string;
  note?: string;
}

export function LegendDonut({
  segments,
  size = 132,
  showValue = false,
}: {
  segments: DonutSeg[];
  size?: number;
  showValue?: boolean;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = 52;
  const C = 60;
  const sw = 16;
  const circ = 2 * Math.PI * R;
  // Running start-fraction per segment, precomputed (no render-time mutation).
  const starts = segments.map((_, i) =>
    segments.slice(0, i).reduce((a, x) => a + x.value / total, 0),
  );
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox="0 0 120 120" className="shrink-0" aria-hidden>
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--input)" strokeWidth={sw} />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke={safeColor(s.color)}
            strokeWidth={sw}
            strokeDasharray={`${(s.value / total) * circ} ${circ}`}
            strokeDashoffset={-starts[i] * circ}
            transform="rotate(-90 60 60)"
          />
        ))}
      </svg>
      <div className="min-w-0 flex-1 space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: safeColor(s.color) }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{s.label}</span>
            {showValue && (
              <span className="font-medium text-foreground">
                {s.note ?? `${Math.round((s.value / total) * 100)}%`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
