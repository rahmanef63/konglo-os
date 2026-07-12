import { describe, it, expect } from "vitest";
import {
  buildDatabase,
  docToPage,
  scalarFromValue,
  blankFromColumns,
  firstTextField,
  type StudioSpec,
  type StudioColumn,
  type StudioDoc,
} from "../frontend/slices/data-studio/adapter";

// A representative konglo table spec: a text title, a number, and a select.
const COLS: StudioColumn[] = [
  { field: "nama", label: "Nama", type: "text" },
  { field: "nilai", label: "Nilai", type: "number" },
  { field: "status", label: "Status", type: "select", options: ["Aktif", "Nonaktif", "Pending"] },
];
const SPEC: StudioSpec = { table: "aset", label: "Daftar Aset", columns: COLS };

describe("firstTextField", () => {
  it("returns the first text column's field", () => {
    expect(firstTextField(COLS)).toBe("nama");
  });

  it("falls back to the first column when no text column exists", () => {
    const cols: StudioColumn[] = [
      { field: "n", label: "N", type: "number" },
      { field: "s", label: "S", type: "select", options: ["a"] },
    ];
    expect(firstTextField(cols)).toBe("n");
  });

  it("returns '' for an empty column list", () => {
    expect(firstTextField([])).toBe("");
  });
});

describe("buildDatabase — konglo spec -> notion Database", () => {
  const db = buildDatabase(SPEC);

  it("maps table/label onto id/name with an inert single table view", () => {
    expect(db.id).toBe("aset");
    expect(db.name).toBe("Daftar Aset");
    expect(db.icon).toBe("");
    expect(db.rowIds).toEqual([]);
    expect(db.activeViewId).toBe("table");
    expect(db.createdAt).toBe(0);
    expect(db.updatedAt).toBe(0);
    expect(db.views).toHaveLength(1);
    expect(db.views[0]).toMatchObject({
      id: "table",
      name: "Daftar Aset",
      type: "table",
      sorts: [],
      filters: [],
      search: "",
    });
  });

  it("emits one Property per column with the mapped PropertyType", () => {
    expect(db.properties).toHaveLength(3);
    expect(db.properties[0]).toMatchObject({ id: "nama", name: "Nama", type: "text" });
    expect(db.properties[1]).toMatchObject({ id: "nilai", name: "Nilai", type: "number" });
    expect(db.properties[2]).toMatchObject({ id: "status", name: "Status", type: "select" });
  });

  it("builds SelectOptions whose id === name === the konglo option string", () => {
    const statusProp = db.properties[2];
    expect(statusProp.options).toBeDefined();
    expect(statusProp.options).toHaveLength(3);
    for (const opt of statusProp.options!) {
      // The round-trip invariant: id and name are the literal konglo value.
      expect(opt.id).toBe(opt.name);
      expect(typeof opt.color).toBe("string");
    }
    expect(statusProp.options!.map((o) => o.id)).toEqual(["Aktif", "Nonaktif", "Pending"]);
  });

  it("gives non-select properties no options array", () => {
    expect(db.properties[0].options).toBeUndefined();
    expect(db.properties[1].options).toBeUndefined();
  });
});

describe("docToPage — konglo doc -> notion Page row", () => {
  const doc: StudioDoc = {
    _id: "row_1",
    _creationTime: 1_700_000_000_000,
    nama: "Gedung A",
    nilai: 4200,
    status: "Aktif",
  };
  const page = docToPage(doc, SPEC);

  it("maps _id, sets the title from the first text column", () => {
    expect(page.id).toBe("row_1");
    expect(page.title).toBe("Gedung A");
    expect(page.rowOfDatabaseId).toBe("aset");
  });

  it("carries every column scalar in rowProps keyed by field", () => {
    expect(page.rowProps).toEqual({
      nama: "Gedung A",
      nilai: 4200,
      status: "Aktif",
    });
  });

  it("uses _creationTime for createdAt/updatedAt", () => {
    expect(page.createdAt).toBe(1_700_000_000_000);
    expect(page.updatedAt).toBe(1_700_000_000_000);
  });

  it("emits inert defaults for non-row Page fields", () => {
    expect(page.parentId).toBeNull();
    expect(page.icon).toBe("");
    expect(page.blocks).toEqual([]);
    expect(page.favorite).toBe(false);
    expect(page.trashed).toBe(false);
  });

  it("coerces a missing _creationTime to 0 and missing cells to null", () => {
    const sparse: StudioDoc = { _id: "row_2", nama: "Only name" };
    const p = docToPage(sparse, SPEC);
    expect(p.createdAt).toBe(0);
    expect(p.title).toBe("Only name");
    expect(p.rowProps).toEqual({ nama: "Only name", nilai: null, status: null });
  });

  it("stringifies a non-string title field defensively", () => {
    const numTitleSpec: StudioSpec = {
      table: "t",
      label: "T",
      columns: [{ field: "n", label: "N", type: "number" }],
    };
    const p = docToPage({ _id: "x", n: 99 }, numTitleSpec);
    expect(p.title).toBe("99");
  });
});

describe("scalarFromValue — notion cell -> konglo scalar", () => {
  it("passes numbers through unchanged", () => {
    expect(scalarFromValue(0)).toBe(0);
    expect(scalarFromValue(42)).toBe(42);
    expect(scalarFromValue(-7.5)).toBe(-7.5);
  });

  it("passes strings (incl. select option ids) through unchanged", () => {
    expect(scalarFromValue("Aktif")).toBe("Aktif");
    expect(scalarFromValue("")).toBe("");
  });

  it("maps null/undefined to '' (konglo columns are non-null)", () => {
    expect(scalarFromValue(null)).toBe("");
    expect(scalarFromValue(undefined as never)).toBe("");
  });

  it("maps booleans: true -> 'true', false -> ''", () => {
    expect(scalarFromValue(true)).toBe("true");
    expect(scalarFromValue(false)).toBe("");
  });

  it("stringifies unreachable compound values defensively", () => {
    expect(scalarFromValue(["a", "b"])).toBe("a,b");
  });
});

describe("blankFromColumns — default 'add row' shape", () => {
  it("number -> 0, select -> first option, text -> ''", () => {
    expect(blankFromColumns(SPEC)).toEqual({
      nama: "",
      nilai: 0,
      status: "Aktif",
    });
  });

  it("select with no options falls back to ''", () => {
    const spec: StudioSpec = {
      table: "t",
      label: "T",
      columns: [{ field: "s", label: "S", type: "select" }],
    };
    expect(blankFromColumns(spec)).toEqual({ s: "" });
  });
});

describe("select cell round-trips losslessly", () => {
  it("SelectOption.id chosen in the picker maps back to the same konglo scalar", () => {
    const db = buildDatabase(SPEC);
    const statusProp = db.properties.find((p) => p.id === "status")!;

    // 1. konglo stored "Nonaktif"; docToPage exposes it as the cell value.
    const page = docToPage(
      { _id: "r", _creationTime: 1, nama: "x", nilai: 1, status: "Nonaktif" },
      SPEC,
    );
    const cellValue = page.rowProps!.status;

    // 2. The cell value must equal exactly one option's id (= its name).
    const matched = statusProp.options!.find((o) => o.id === cellValue);
    expect(matched).toBeDefined();
    expect(matched!.name).toBe("Nonaktif");

    // 3. The OptionPicker emits that option's id; scalarFromValue returns the
    //    identical konglo string — no id<->label translation, no loss.
    const writtenBack = scalarFromValue(matched!.id);
    expect(writtenBack).toBe("Nonaktif");
    expect(writtenBack).toBe(cellValue);
  });
});
