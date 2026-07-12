import { safeColor } from "@/lib/safe-css";

// Horizontal progress meter. Theme-token track + caller-supplied accent fill.
export function Meter({
  value,
  color = "var(--color-gold)",
  height = 8,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-[color:var(--input)]"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: safeColor(color) ?? "var(--color-gold)",
        }}
      />
    </div>
  );
}
