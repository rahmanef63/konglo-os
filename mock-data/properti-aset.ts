// Centralized mock/demo constants for the properti-aset slice (illustrative — not live Convex data).
import type { DonutSeg } from "@/frontend/shared";

export const ESTATE = {
  countries: 9,
  propertyUnits: 28,
  luxFleet: "Jet · Yacht · 12 mobil",
  occupancy: 84,
  occupancyQoQ: 3,
};

export const COMPOSITION: DonutSeg[] = [
  { label: "Properti", value: 58, color: "var(--color-mk-red)" },
  { label: "Jet & aviasi", value: 22, color: "var(--color-mk-blue)" },
  { label: "Kapal", value: 12, color: "var(--color-mk-green)" },
  { label: "Otomotif & seni", value: 8, color: "var(--color-mk-orange)" },
];
