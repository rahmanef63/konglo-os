"use client";

import { useState } from "react";
import { Modal } from "./modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeColor } from "@/lib/safe-css";

export interface FormField {
  name: string;
  label: string;
  type?: "text" | "number" | "select";
  placeholder?: string;
  required?: boolean;
  step?: string;
  options?: string[];
}

const INPUT_CLS =
  "w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50";

// One field; uncontrolled (read via FormData on submit). `initial` seeds the
// defaultValue so the same component serves both create (no initial) and edit.
// a11y: the <label> is explicitly paired to its control via htmlFor={f.name} +
// a matching id={f.name}, so assistive tech (and getByLabelText) resolve the
// control by its visible label text — not just by the implicit DOM nesting.
function Field({ f, initial }: { f: FormField; initial?: string | number }) {
  const dv = initial == null ? "" : String(initial);
  return (
    <div className="block">
      <Label
        htmlFor={f.name}
        className="mb-1 block text-xs font-medium text-muted-foreground"
      >
        {f.label}
      </Label>
      {f.type === "select" ? (
        // Native <select> (combobox role) — the FormData flow is uncontrolled and
        // the radix Select is a listbox, not a native combobox, so it stays native.
        <select id={f.name} name={f.name} required={f.required} defaultValue={dv} className={INPUT_CLS}>
          <option value="" disabled>
            Pilih…
          </option>
          {f.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={f.name}
          name={f.name}
          type={f.type ?? "text"}
          step={f.step}
          placeholder={f.placeholder}
          required={f.required}
          defaultValue={dv}
          className="rounded-lg border-border bg-background/60 focus-visible:border-[color:var(--color-gold)]/50 focus-visible:ring-0"
        />
      )}
    </div>
  );
}

// Generic create/edit form in a Modal. Inputs are uncontrolled (read via
// FormData on submit). For CREATE pass no `initial` so every open starts fresh.
// For EDIT pass `initial` (a record of name→value); the `key` on the form
// remounts the inputs whenever the target changes so defaultValues re-apply.
// onSubmit contract is unchanged — the caller decides create vs update based on
// whatever id it already holds. Theme tokens only; mirrors DetailSheet anatomy.
export function FormModal({
  open,
  onClose,
  title,
  subtitle,
  fields,
  submitLabel = "Simpan",
  accent = "var(--color-gold)",
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fields: FormField[];
  submitLabel?: string;
  accent?: string;
  /** When provided, fields render with these values (EDIT mode). */
  initial?: Record<string, string | number>;
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = Object.fromEntries(
      new FormData(e.currentTarget).entries(),
    ) as Record<string, string>;
    setSubmitting(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (e) {
      // keep the form open so the user can retry; caller surfaces the error.
      console.error("[form-modal] submit failed", e);
    } finally {
      setSubmitting(false);
    }
  };

  // Remount inputs when switching create/edit targets so defaultValues apply.
  const formKey = initial ? JSON.stringify(initial) : "create";

  return (
    <Modal open={open} onClose={onClose} label={title}>
      <span
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl"
        style={{ background: safeColor(accent) ?? "var(--color-gold)" }}
      />
      <form
        key={formKey}
        onSubmit={submit}
        className="max-h-[82vh] overflow-y-auto p-5 pr-12 sm:p-6 sm:pr-12"
      >
        <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-4 space-y-3">
          {fields.map((f) => (
            <Field key={f.name} f={f} initial={initial?.[f.name]} />
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Menyimpan…" : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
