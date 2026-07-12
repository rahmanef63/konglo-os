// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { FormModal, type FormField } from "../../frontend/shared/form-modal";

// FormModal is uncontrolled: inputs are read via FormData on submit. We assert
// the three contract guarantees — fields render, submit hands the typed values
// to onSubmit, and a rejecting onSubmit keeps the modal open for retry.
// (render/fireEvent are pulled from @testing-library/react, the only
// top-level testing-library dep; it auto-wraps events in act.)

const FIELDS: FormField[] = [
  { name: "name", label: "Nama anak usaha", placeholder: "PT …", required: true },
  { name: "sector", label: "Sektor", type: "select", options: ["Energi", "Properti"], required: true },
  { name: "revenue", label: "Pendapatan", type: "number", step: "0.01" },
];

function setup(overrides: Partial<React.ComponentProps<typeof FormModal>> = {}) {
  const onSubmit =
    vi.fn<(v: Record<string, string>) => Promise<void> | void>();
  const onClose = vi.fn();
  render(
    <FormModal
      open
      onClose={onClose}
      title="Tambah Anak Usaha"
      subtitle="Isi data anak usaha"
      fields={FIELDS}
      onSubmit={onSubmit}
      {...overrides}
    />,
  );
  return { onSubmit, onClose };
}

describe("FormModal", () => {
  beforeEach(cleanup);

  it("renders the title, subtitle and every field by its label", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Tambah Anak Usaha" })).toBeInTheDocument();
    expect(screen.getByText("Isi data anak usaha")).toBeInTheDocument();
    expect(screen.getByText("Nama anak usaha")).toBeInTheDocument();
    expect(screen.getByText("Sektor")).toBeInTheDocument();
    expect(screen.getByText("Pendapatan")).toBeInTheDocument();
    // the select option set renders.
    expect(screen.getByRole("option", { name: "Energi" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Properti" })).toBeInTheDocument();
  });

  it("explicitly pairs each label with its control (htmlFor/id a11y)", () => {
    setup();
    // getByLabelText resolves the control via the <label htmlFor> ↔ id pairing,
    // not implicit nesting — proving assistive tech can name each field. It also
    // returns the actual control element (the textbox / the combobox).
    const nameInput = screen.getByLabelText("Nama anak usaha");
    expect(nameInput).toBe(screen.getByRole("textbox"));
    expect(nameInput).toHaveAttribute("name", "name");
    // a <select> field is wired the same way.
    expect(screen.getByLabelText("Sektor")).toBe(screen.getByRole("combobox"));
  });

  it("renders nothing when closed", () => {
    setup({ open: false });
    expect(
      screen.queryByRole("heading", { name: "Tambah Anak Usaha" }),
    ).not.toBeInTheDocument();
  });

  it("seeds defaultValues from `initial` in edit mode", () => {
    setup({ initial: { name: "PT Awal", revenue: 4.8 } });
    expect(screen.getByDisplayValue("PT Awal")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4.8")).toBeInTheDocument();
  });

  it("submitting calls onSubmit with the typed FormData values, then closes", async () => {
    const { onSubmit, onClose } = setup();
    onSubmit.mockResolvedValue(undefined);

    fireEvent.change(screen.getByPlaceholderText("PT …"), {
      target: { value: "PT Baru" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Energi" },
    });
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "12.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "PT Baru",
      sector: "Energi",
      revenue: "12.5",
    });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("stays OPEN (does not call onClose) when onSubmit rejects", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { onSubmit, onClose } = setup();
    onSubmit.mockRejectedValue(new Error("server said no"));

    // fill BOTH required fields so native HTML validation lets the form submit.
    fireEvent.change(screen.getByPlaceholderText("PT …"), {
      target: { value: "PT Gagal" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Energi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
    // form still mounted → modal still open for a retry.
    expect(
      screen.getByRole("heading", { name: "Tambah Anak Usaha" }),
    ).toBeInTheDocument();
    // the submit button re-enables after the failed attempt.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Simpan" })).not.toBeDisabled(),
    );
    errSpy.mockRestore();
  });
});
