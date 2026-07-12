"use client";

/** SelectionBar — bulk-action strip shown above the table when ≥1 row is
 *  selected via the checkbox gutter. Reads the RowSelectionProvider, so it must
 *  render inside it. "Hapus" fires onDelete for the selected ids then clears;
 *  omit onDelete (read-only) to show just the count + clear. */

import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRowSelection } from "./RowSelectionProvider";

export function SelectionBar({ onDelete }: { onDelete?: (ids: string[]) => void }) {
  const sel = useRowSelection();
  if (sel.count === 0) return null;
  const ids = [...sel.state.ids];

  return (
    <div className="flex items-center gap-2 border-b border-border bg-primary/5 px-3 py-1.5 text-xs">
      <span className="font-medium text-foreground">{sel.count} baris dipilih</span>
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onDelete(ids);
            sel.clear();
          }}
          className="h-7 gap-1 px-2 text-[color:var(--color-mk-red)]"
        >
          <Trash2 className="h-3.5 w-3.5" /> Hapus
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={sel.clear}
        className="ml-auto h-7 gap-1 px-2 text-muted-foreground"
      >
        <X className="h-3.5 w-3.5" /> Batal
      </Button>
    </div>
  );
}
