/** row-selection — context-driven multi-select primitives.
 *  Wrap with `<RowSelectionProvider rowOrder={rows.map(r => r.id)}>`,
 *  then mount the checkbox gutter cells.
 *
 *  Konglo OS vendoring: pruned to the TABLE VIEW subset. The marquee
 *  drag-band overlay (RowMarqueeOverlay / Marquee / useMarqueeDrag /
 *  marquee-*), the floating RowSelectionToolbar, and RowSelectionKeyboard
 *  were removed — TableView does not import them. Only the context
 *  provider + checkbox cells (which TableView uses) remain. */

export {
  RowSelectionProvider,
  useRowSelection,
  useRowSelectionOptional,
  type RowSelectionApi,
  type RowSelectionState,
} from "./RowSelectionProvider";
export { HeaderCheckboxGutter, RowCheckbox } from "./Checkboxes";
