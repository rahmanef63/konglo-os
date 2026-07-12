import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

// The app's card surface IS the shadcn Card primitive (components/ui/card). Kept
// as a named alias — consumed ~10x directly and as the base of SectionCard/
// StatTile — so the premium rounded-2xl/border/bg-card surface now lives in the
// shadcn Card base (byte-identical classes, plus the data-slot="card" attr).
export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <Card className={className}>{children}</Card>;
}
