// Slice-local presentation data for Kekayaan & Kas. Cross-cutting figures
// (net worth, liabilities, debt ratio) come from Convex SSOT — this file holds
// only screen-specific illustrative series (rr: per-screen data lives slice-local).

export {
  NET_WORTH_TREND,
  LIQUIDITY_HEALTH,
  LIQUIDITY,
  CASHFLOW,
  TOTAL_COMMITMENT,
} from "@/mock-data/kekayaan-kas";

export interface Expense {
  title: string;
  amount: string;
  color: string;
  due: string;
  to: string;
}
export const EXPENSES: Expense[] = [
  { title: "Pajak penghasilan grup Q2", amount: "Rp 4,8 T", color: "var(--color-mk-red)", due: "15 Jun", to: "Ditjen Pajak" },
  { title: "Dividen pemegang saham", amount: "Rp 2,1 T", color: "var(--color-mk-blue)", due: "20 Jun", to: "Pemegang saham" },
  { title: "Akuisisi lahan IKN", amount: "Rp 1,6 T", color: "var(--color-mk-orange)", due: "28 Jun", to: "BPN / notaris" },
  { title: "Pemeliharaan jet & yacht", amount: "Rp 88 M", color: "var(--color-mk-green)", due: "30 Jun", to: "Vendor estate" },
];
