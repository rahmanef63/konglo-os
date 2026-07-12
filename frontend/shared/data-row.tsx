import { cn } from "@/lib/utils";

// Label ↔ value row with a hairline divider. Used in detail sheets + lists.
// Replaces prototype SheetRow.
export function DataRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-right text-sm font-semibold",
          accent ? "text-[color:var(--color-gold)]" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
