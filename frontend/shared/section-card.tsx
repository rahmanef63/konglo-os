import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import { Pill } from "./pill";

// Titled section with optional sub-label + right-aligned action node.
// Reused by every feature screen (rr: compose, don't accumulate).
// `sample` flags a section backed by illustrative (non-live) data — renders a
// "data contoh" pill in the header (alongside `action` when both are set), so
// callers don't reach for an absolute-positioned overlay on the body.
export function SectionCard({
  title,
  sub,
  action,
  sample = false,
  children,
  className,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
  sample?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <GlassCard className={cn("p-5", className)}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-tight text-foreground sm:text-lg">
            {title}
          </h2>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        {(sample || action) && (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
            {sample && <Pill>data contoh</Pill>}
            {action}
          </div>
        )}
      </div>
      {children}
    </GlassCard>
  );
}
