import { cn } from "@/lib/utils";

// Content-shaped loading placeholder. Pulses only when motion is allowed —
// `motion-safe:` keeps it static under prefers-reduced-motion (a11y). Size it
// via className (e.g. "h-4 w-32"). Theme tokens only (rr: no hex).
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-md bg-muted/70 motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  );
}
