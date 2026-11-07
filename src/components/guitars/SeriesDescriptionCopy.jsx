export default function SeriesDescriptionCopy({ name, description, priceRange, labelledBy, pinPrice = false }) {
  return (
    <div className={pinPrice ? "flex h-full min-h-0 flex-col" : undefined}>
      {name ? (
        <p id={labelledBy} className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-gold">
          {name}
        </p>
      ) : null}
      {description ? (
        <p
          className={`whitespace-pre-wrap text-sm leading-relaxed text-ivory ${
            name ? "mt-3" : ""
          } ${pinPrice ? "min-h-0 flex-auto overflow-y-auto overscroll-contain" : ""}`}
        >
          {description}
        </p>
      ) : null}
      {priceRange ? (
        <p className="mt-4 shrink-0 text-[11px] uppercase tracking-[0.18em] text-gold">{priceRange}</p>
      ) : null}
    </div>
  );
}
