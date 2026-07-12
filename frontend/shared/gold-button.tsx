import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

// Gold pill action button (the "+ Tambah" / "Ubah" header actions). The gold pill
// styling now lives as the `gold` variant + `pill` size on the shadcn Button cva
// (components/ui/button), so this is a thin semantic alias — defaults children to
// "+ Tambah" and forwards onClick/disabled/className. (Gains the Button focus ring.)
export function GoldButton({
  onClick,
  disabled,
  className,
  children = "+ Tambah",
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Button variant="gold" size="pill" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </Button>
  );
}
