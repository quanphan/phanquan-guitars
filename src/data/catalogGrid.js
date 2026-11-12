/** Insert a full-width rule after this index for a CSS grid with `columns` tracks. */
export function catalogGridRowDividerAfter(index, count, columns) {
  const cols = Math.max(1, Number(columns) || 1);
  const total = Math.max(0, Number(count) || 0);
  if (!Number.isInteger(index) || index < 0 || index >= total - 1) return false;
  const lastRowStart = total - (total % cols || cols);
  return (index + 1) % cols === 0 && index < lastRowStart;
}

/** Journal `/gallery`: 1 / sm:2 / lg:3 */
export const JOURNAL_GRID_BREAKPOINTS = [
  { cols: 1, visible: "sm:hidden" },
  { cols: 2, visible: "hidden sm:block lg:hidden" },
  { cols: 3, visible: "hidden lg:block" },
];

/** Guitar products and service items: 1 / md:2 / xl:3 */
export const PRODUCT_GRID_BREAKPOINTS = [
  { cols: 1, visible: "md:hidden" },
  { cols: 2, visible: "hidden md:block xl:hidden" },
  { cols: 3, visible: "hidden xl:block" },
];
