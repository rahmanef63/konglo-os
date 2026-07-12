import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { safeColor } from "@/lib/safe-css";
import { Badge } from "@/components/ui/badge";

// Category chip on the shadcn Badge primitive. `color` → a runtime color-mix tint
// (a domain feature stock Badge lacks, so it stays here); else `tone="accent"`
// (gold) / "muted". Rounded-full + gap-1.5 override the Badge defaults.
export function Pill({
  children,
  color,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  color?: string;
  tone?: "muted" | "accent";
  className?: string;
}) {
  const c = safeColor(color);
  return (
    <Badge
      variant="outline"
      style={
        c
          ? {
              color: c,
              borderColor: `color-mix(in oklab, ${c} 50%, transparent)`,
              background: `color-mix(in oklab, ${c} 12%, transparent)`,
            }
          : undefined
      }
      className={cn(
        "gap-1.5 rounded-full",
        !c &&
          (tone === "accent"
            ? "border-[color:var(--color-gold)]/45 text-[color:var(--color-gold)]"
            : "text-muted-foreground"),
        className,
      )}
    >
      {children}
    </Badge>
  );
}
