// Barrel for shared UI primitives. Slices import from "@/frontend/shared" only.
export { GlassCard } from "./glass-card";
export { Eyebrow } from "./eyebrow";
export { BrandMark } from "./brand-mark";
export { DemoBanner } from "./demo-banner";
export { OnboardingDialog, OPEN_ONBOARDING_EVENT } from "./onboarding-dialog";
export { useMe, useIsDemo, useDemoValue } from "./use-me";
export { useHonorific } from "./use-honorific";
export { useLocalStorageState } from "./use-local-storage-state";
export { StatTile, StatGrid } from "./stat-tile";
export { SectionCard } from "./section-card";
export { PillToggleRow } from "./pill-toggle-row";
export { GoldButton } from "./gold-button";
export { Avatar } from "./avatar";
export { PersonRow } from "./person-row";
export { Pill } from "./pill";
export { DataRow } from "./data-row";
export { DetailSheet } from "./detail-sheet";
export { DeleteButton, useDeleteConfirm } from "./delete-button";
export { FormModal, type FormField } from "./form-modal";
export {
  Sparkline,
  LineChart,
  BarChart,
  Ring,
  Meter,
  LegendDonut,
  PinMap,
  type DonutSeg,
} from "./charts";
export { useToast } from "./toast";
export { useActivityLog } from "./use-activity";
export { isConflict } from "./writes";
export { NavProvider, useNav } from "./nav-context";
export { ChatProvider, useChat, type ChatMessage, type ChatStatus } from "./chat-context";
export { ChatInput, type ChatInputProps } from "./chat-input";
export { PresetFontLoader } from "./preset-font-loader";
export { OsShell } from "./os-shell";
export { Skeleton } from "@/components/ui/skeleton";
export { EmptyState } from "./empty-state";
export { Landing } from "./landing";
