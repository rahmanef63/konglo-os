import type { TweakcnPresetGroup, TweakcnPresetMeta } from "./types";

export const TWEAKCN_PRESET_GROUPS: ReadonlyArray<{
  id: string;
  label: string;
  presets: ReadonlyArray<string>;
}> = [
  {
    id: "refined",
    label: "Profesional",
    presets: [
      "modern-minimal", "vercel", "claude", "supabase",
      "mono", "graphite", "clean-slate", "amber-minimal",
    ],
  },
  {
    id: "bold",
    label: "Bold",
    presets: ["t3-chat", "bold-tech", "twitter", "tangerine", "quantum-rose"],
  },
  {
    id: "warm",
    label: "Hangat",
    presets: ["mocha-mousse", "solar-dusk", "caffeine", "vintage-paper", "sunset-horizon"],
  },
  {
    id: "artistic",
    label: "Artistik",
    presets: ["claymorphism", "kodama-grove", "nature", "northern-lights"],
  },
  {
    id: "moody",
    label: "Gelap",
    presets: [
      "cosmic-night", "perpetuity", "catppuccin", "elegant-luxury",
      "ocean-breeze", "midnight-bloom", "starry-night",
    ],
  },
];

export function groupTweakcnPresets<T extends TweakcnPresetMeta>(
  all: T[],
): TweakcnPresetGroup<T>[] {
  // Gimmick presets are pruned from registry-data.json itself — every
  // registry entry is pickable, so no hidden-set filter here.
  const byName = new Map(all.map((p) => [p.name, p]));
  const seen = new Set<string>();
  const grouped: TweakcnPresetGroup<T>[] = TWEAKCN_PRESET_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    items: g.presets
      .map((n) => byName.get(n))
      .filter((x): x is T => {
        if (!x) return false;
        seen.add(x.name);
        return true;
      }),
  })).filter((g) => g.items.length > 0);

  const rest = all.filter((p) => !seen.has(p.name));
  if (rest.length) {
    grouped.push({ id: "other", label: "Lainnya", items: rest });
  }
  return grouped;
}
