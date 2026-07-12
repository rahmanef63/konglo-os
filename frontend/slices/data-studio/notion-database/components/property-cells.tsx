"use client";

/** Per-type property cell renderers. Pure controlled inputs — every
 *  cell takes `value` + `onChange` + `prop` (for options) + `readOnly`. */

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Database, Page, Property, PropertyValue } from "../types";
import { MultiSelectCell } from "./cells/MultiSelectCell";
import { SelectCell } from "./cells/SelectCell";
import { NumberCell } from "./cells/NumberCell";
import { LinkCell } from "./cells/LinkCell";
import { DateCell } from "./cells/DateCell";

export interface UserLite { id: string; name: string; icon?: string }
export type UserLookup = (userId: string) => UserLite | null;

interface CellArgs {
  prop: Property;
  value: PropertyValue;
  readOnly: boolean;
  onChange?: (next: PropertyValue) => void;
  row?: Page;
  db?: Database;
  onPropertyChange?: (patch: Partial<Property>) => void;
  /** Resolves user id → display info for `person` / `created_by` /
   *  `last_edited_by` cells. Optional — falls back to raw id. */
  userLookup?: UserLookup;
  /** All workspace pages — required by `relation` (link picker) +
   *  `rollup` (aggregate). Cells gracefully no-op when omitted. */
  pages?: Page[];
  /** All workspace databases — required by `relation` (target picker)
   *  + `rollup` (target props). Cells gracefully no-op when omitted. */
  databases?: Database[];
  /** Creates a new row in the relation's target db and returns its id —
   *  wires the "+ Create new row" button in RelationCell. */
  onCreateRelatedRow?: (dbId: string, draft?: { title?: string }) => Promise<string>;
}

export function renderPropertyCell({
  prop, value, readOnly, onChange, row, db, onPropertyChange, userLookup,
  pages, databases, onCreateRelatedRow,
}: CellArgs): ReactNode {
  switch (prop.type) {
    case "checkbox":
      return <Checkbox checked={!!value} disabled={readOnly} onCheckedChange={(v) => onChange?.(!!v)} />;

    case "number":
      return (
        <NumberCell
          prop={prop} value={value} readOnly={readOnly}
          onChange={onChange ? (n) => onChange(n) : undefined}
        />
      );

    case "select":
    case "status":
      return (
        <SelectCell
          options={prop.options ?? []}
          value={value as string | null}
          readOnly={readOnly}
          onChange={onChange ? (next) => onChange(next) : undefined}
          onOptionsChange={onPropertyChange ? (nextOptions) => onPropertyChange({ options: nextOptions }) : undefined}
        />
      );

    case "multi_select":
      return (
        <MultiSelectCell
          options={prop.options ?? []}
          value={(Array.isArray(value) ? value : []) as string[]}
          readOnly={readOnly}
          onChange={onChange ? (next) => onChange(next) : undefined}
          onOptionsChange={onPropertyChange ? (nextOptions) => onPropertyChange({ options: nextOptions }) : undefined}
        />
      );

    case "date":
      return (
        <DateCell
          value={value as { date?: string; end?: string } | null}
          readOnly={readOnly}
          onChange={onChange ? (next) => onChange(next) : undefined}
          prop={prop}
          onPropPatch={onPropertyChange ? (patch) => onPropertyChange(patch) : undefined}
        />
      );

    case "url":
    case "email":
    case "phone":
      return (
        <LinkCell
          kind={prop.type}
          value={value as string | null}
          readOnly={readOnly}
          onChange={onChange ? (s) => onChange(s) : undefined}
        />
      );

    default:
      return (
        <Input
          value={String(value ?? "")} disabled={readOnly}
          onChange={(e) => onChange?.(e.target.value)} className="h-7 text-sm"
        />
      );
  }
}
