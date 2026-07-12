import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Resolved-empty state for lists that loaded but have no rows. Announced to AT
// via role=status + aria-live=polite (distinct from a loading skeleton).
// Theme tokens only (rr: no hex).
export function EmptyState({
  icon,
  message,
  action,
  className,
}: {
  icon?: ReactNode;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center",
        className,
      )}
    >
      {icon != null && (
        <span aria-hidden="true" className="text-muted-foreground/70">
          {icon}
        </span>
      )}
      <p className="text-sm text-muted-foreground">{message}</p>
      {action != null && <div>{action}</div>}
    </div>
  );
}
