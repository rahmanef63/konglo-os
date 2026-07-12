import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

// Guards WCAG AA contrast on the SHIPPED default preset ("claude", light mode).
// It reads the real registry-data.json values, so if a future re-vendor of the
// theme-presets slice reverts the AA patch (primary/muted-foreground darkened
// 2026-07-10), this fails CI instead of silently shipping 3.58:1 body text.
// oklch → sRGB (Björn Ottosson) → WCAG relative luminance → contrast ratio,
// mirroring the audit's own method.

function oklchToLinearRgb(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function luminance(oklch: string): number {
  const m = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) throw new Error(`not oklch: ${oklch}`);
  const [r, g, b] = oklchToLinearRgb(+m[1], +m[2], +m[3]).map((c) => Math.max(0, Math.min(1, c)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg: string, bg: string): number {
  const a = luminance(fg), b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

type PresetLight = Record<string, string>;
type Preset = { name: string; cssVars: { light: PresetLight } };

function findPreset(node: unknown, name: string): Preset | null {
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;
  if (obj.name === name && obj.cssVars) return node as Preset;
  for (const v of Object.values(obj)) {
    const hit = findPreset(v, name);
    if (hit) return hit;
  }
  return null;
}

describe("preset WCAG AA — shipped 'claude' default (light)", () => {
  const raw = readFileSync(
    join(process.cwd(), "frontend/slices/theme-presets/lib/tweakcn/registry-data.json"),
    "utf8",
  );
  const claude = findPreset(JSON.parse(raw), "claude");
  if (!claude) throw new Error("claude preset not found in registry-data.json");
  const light = claude.cssVars.light;

  it("secondary text (muted-foreground on background) clears AA 4.5:1", () => {
    expect(contrast(light["muted-foreground"], light.background)).toBeGreaterThanOrEqual(4.5);
  });

  it("primary buttons (primary-foreground on primary) clear AA 4.5:1", () => {
    expect(contrast(light["primary-foreground"], light.primary)).toBeGreaterThanOrEqual(4.5);
  });
});
