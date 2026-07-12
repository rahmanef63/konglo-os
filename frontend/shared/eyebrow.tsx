import { cn } from "@/lib/utils";

// Small uppercase gold label = prototype `.w-eyebrow`.
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-gold)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
