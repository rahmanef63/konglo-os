import { describe, it, expect } from "vitest";
import { rp, pct, timeAgoID, formatDateID } from "../lib/format";

// id-ID grouping uses "." for thousands and "," for the decimal mark.
// These assertions are pinned to full-ICU Node output (verified in env).

describe("rp — Rupiah formatter with magnitude buckets", () => {
  it("formats sub-million amounts with id-ID thousands grouping", () => {
    expect(rp(0)).toBe("Rp 0");
    expect(rp(500)).toBe("Rp 500");
    expect(rp(1500)).toBe("Rp 1.500");
    expect(rp(999999)).toBe("Rp 999.999");
  });

  it("formats millions as 'jt' with no decimals", () => {
    expect(rp(1_000_000)).toBe("Rp 1 jt");
    expect(rp(2_400_000)).toBe("Rp 2 jt"); // truncation-free (rounds to 2)
  });

  it("rounds the 'jt' bucket via toFixed(0) (half rounds away from zero)", () => {
    expect(rp(2_500_000)).toBe("Rp 3 jt");
  });

  it("formats billions as 'M' with one comma-decimal", () => {
    expect(rp(1_000_000_000)).toBe("Rp 1,0 M");
    expect(rp(1_250_000_000)).toBe("Rp 1,3 M");
  });

  it("formats trillions as 'T' with one comma-decimal", () => {
    expect(rp(1_000_000_000_000)).toBe("Rp 1,0 T");
    expect(rp(3_456_000_000_000)).toBe("Rp 3,5 T");
  });

  it("promotes at unit boundaries instead of printing a 1000-mantissa", () => {
    // jt→M: 999_999_999/1e6 rounds to "1000 jt" — must roll over to "1,0 M".
    expect(rp(999_999_999)).toBe("Rp 1,0 M");
    expect(rp(999_500_000)).toBe("Rp 1,0 M");
    expect(rp(-999_999_999)).toBe("Rp -1,0 M");
    // M→T: 999_999_999_999/1e9 rounds to "1000,0 M" — must roll over to "1,0 T".
    expect(rp(999_999_999_999)).toBe("Rp 1,0 T");
  });

  it("keeps the sign on negative amounts (bucket by magnitude)", () => {
    expect(rp(-1500)).toBe("Rp -1.500");
    expect(rp(-2_500_000)).toBe("Rp -3 jt");
    expect(rp(-1_500_000_000)).toBe("Rp -1,5 M");
  });

  it("uses the magnitude (abs) to pick the bucket, value to print", () => {
    // -1e6 is in the 'jt' bucket because |n| >= 1e6.
    expect(rp(-1_000_000)).toBe("Rp -1 jt");
  });
});

describe("pct — signed percentage with one comma-decimal", () => {
  it("prefixes '+' for zero and positive values", () => {
    expect(pct(0)).toBe("+0,0%");
    expect(pct(12.34)).toBe("+12,3%");
    expect(pct(100)).toBe("+100,0%");
  });

  it("keeps '-' for negative values", () => {
    expect(pct(-5.6)).toBe("-5,6%");
    expect(pct(-0.04)).toBe("-0,0%"); // toFixed(1) of -0.04 -> "-0.0"
  });

  it("rounds to one decimal", () => {
    expect(pct(7.86)).toBe("+7,9%");
    expect(pct(7.83)).toBe("+7,8%");
  });
});

describe("timeAgoID — relative time in Indonesian", () => {
  const now = Date.now();

  it("returns 'baru saja' under a minute", () => {
    expect(timeAgoID(now)).toBe("baru saja");
    expect(timeAgoID(now - 30_000)).toBe("baru saja");
    expect(timeAgoID(now - 59_000)).toBe("baru saja");
  });

  it("clamps future timestamps to 'baru saja'", () => {
    expect(timeAgoID(now + 60_000)).toBe("baru saja");
  });

  it("returns 'N mnt lalu' for minutes", () => {
    expect(timeAgoID(now - 60_000)).toBe("1 mnt lalu");
    expect(timeAgoID(now - 12 * 60_000)).toBe("12 mnt lalu");
    expect(timeAgoID(now - 59 * 60_000)).toBe("59 mnt lalu");
  });

  it("returns 'N jam lalu' for hours", () => {
    expect(timeAgoID(now - 60 * 60_000)).toBe("1 jam lalu");
    expect(timeAgoID(now - 3 * 60 * 60_000)).toBe("3 jam lalu");
    expect(timeAgoID(now - 23 * 60 * 60_000)).toBe("23 jam lalu");
  });

  it("returns 'N hr lalu' for days", () => {
    const day = 24 * 60 * 60_000;
    expect(timeAgoID(now - day)).toBe("1 hr lalu");
    expect(timeAgoID(now - 2 * day)).toBe("2 hr lalu");
  });
});

describe("formatDateID — id-ID short date", () => {
  // Build at local midday so the calendar day is TZ-stable.
  const at = (y: number, m: number, d: number) =>
    new Date(y, m, d, 12, 0, 0).getTime();

  it("formats as 'D Mmm YYYY' with Indonesian month abbreviations", () => {
    expect(formatDateID(at(2026, 0, 15))).toBe("15 Jan 2026");
    expect(formatDateID(at(2025, 11, 1))).toBe("1 Des 2025"); // December = Des
  });

  it("does not zero-pad the day", () => {
    expect(formatDateID(at(2026, 7, 9))).toBe("9 Agu 2026"); // August = Agu
  });
});
