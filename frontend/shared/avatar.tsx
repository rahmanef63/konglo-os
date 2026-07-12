import { safeColor } from "@/lib/safe-css";

// Initials avatar — tinted disc + colored ring on dark. Replaces prototype Ava.
export function Avatar({
  name,
  color,
  size = 38,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
  const c = safeColor(color);
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full border font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        color: c ?? "var(--foreground)",
        background: c
          ? `color-mix(in oklab, ${c} 18%, transparent)`
          : "var(--muted)",
        borderColor: c
          ? `color-mix(in oklab, ${c} 42%, transparent)`
          : "var(--border)",
      }}
    >
      {initials}
    </span>
  );
}
