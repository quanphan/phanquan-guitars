import { catalogGridRowDividerAfter } from "../../data/catalogGrid.js";

export default function CatalogGridRowDividers({ index, count, breakpoints }) {
  return breakpoints.map(({ cols, visible }) =>
    catalogGridRowDividerAfter(index, count, cols) ? (
      <div
        key={cols}
        className={`col-span-full h-px bg-gold/40 ${visible}`}
        data-catalog-row-divider={String(cols)}
        aria-hidden="true"
      />
    ) : null,
  );
}
