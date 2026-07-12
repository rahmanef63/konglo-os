"use client";

import { useId } from "react";

// Premium area+line chart with a vertical gradient fill. Props-driven, fills
// width. Replaces prototype SketchLine — theme-token color, no hex.
export function LineChart({
  points,
  color = "var(--color-gold)",
  height = 140,
}: {
  points: number[];
  color?: string;
  height?: number;
}) {
  const id = useId();
  const W = 320;
  const H = height;
  const pad = 8;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const step = (W - pad * 2) / (points.length - 1);
  const y = (v: number) => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
  const line = points.map((v, i) => `${i ? "L" : "M"} ${pad + i * step} ${y(v)}`).join(" ");
  const area = `${line} L ${pad + (points.length - 1) * step} ${H} L ${pad} ${H} Z`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className="overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
