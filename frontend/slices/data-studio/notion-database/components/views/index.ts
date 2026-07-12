/** Default view registry — maps DbView → component. Pure barrel so
 *  callers can `import { VIEW_REGISTRY } from "@/features/notion-shell"`
 *  or grab one view directly. Override / extend at the host by
 *  spreading a custom map.
 *
 *  Konglo OS vendoring: pruned to the TABLE VIEW subset only. The other
 *  view kinds (board/list/gallery/calendar/feed/chart/dashboard/form/
 *  map/timeline) were removed because they pull @dnd-kit / recharts /
 *  @/shared which this app must not depend on. */

import type { ComponentType } from "react";
import type { DbView } from "../../types";
import type { ViewProps } from "./types";
import { TableView } from "./TableView";

export type ViewRegistry = Partial<Record<DbView, ComponentType<ViewProps>>>;

export const VIEW_REGISTRY: ViewRegistry = {
  table: TableView,
};

export { TableView };
export type { ViewProps };
