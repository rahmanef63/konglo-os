import { cn } from "@/lib/utils";

// Filter/sort/period toggle pills (active = gold ring, idle = muted). SSOT for
// the identical toolbar in relasi (filters), investasi (periods), portofolio
// (sort). `options` accepts a plain string[] (["YTD","1B"]) or [key,label] tuples.
export function PillToggleRow({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<string | readonly [string, string]>;
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <>
      {options.map((opt) => {
        const [key, label] = typeof opt === "string" ? [opt, opt] : opt;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
              value === key
                ? "border-[color:var(--color-gold)]/50 text-[color:var(--color-gold)]"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </>
  );
}
