import type { ReactNode } from "react";
import { Avatar } from "./avatar";

// Avatar + name/role on the left, optional `right` node pushed far side.
// Composes prototype NameRole + PersonRow into one primitive.
export function PersonRow({
  name,
  role,
  color,
  right,
  size = 36,
}: {
  name: string;
  role: string;
  color?: string;
  right?: ReactNode;
  size?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={name} color={color} size={size} />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">{name}</div>
          <div className="truncate text-xs text-muted-foreground">{role}</div>
        </div>
      </div>
      {right}
    </div>
  );
}
