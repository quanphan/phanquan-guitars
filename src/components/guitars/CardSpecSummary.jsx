import { guitarCardSummary } from "../../services/guitarCardSummary.js";

const PRODUCT_SPEC_SLOTS = ["stringsScale", "bodyNeck", "finishType"];

export default function CardSpecSummary({ guitar, t, className = "", layout = "default" }) {
  const specEntries = guitarCardSummary(guitar, t);
  const productLayout = layout === "product";
  const rows = productLayout
    ? PRODUCT_SPEC_SLOTS.map((id) => specEntries.find((row) => row.id === id) || { id, value: "" })
    : specEntries;
  if (!productLayout && !rows.length) return null;

  return (
    <dl
      className={
        productLayout
          ? `grid grid-cols-1 gap-x-4 gap-y-4 border-t border-white/8 pt-4 text-[11px] uppercase tracking-[0.16em] text-ivory/70 sm:grid-cols-3 ${className}`
          : `grid grid-cols-1 gap-4 border-t border-white/8 pt-5 text-[11px] uppercase tracking-[0.16em] text-ivory/70 sm:grid-cols-3 sm:gap-3 ${className}`
      }
    >
      {rows.map((row) => (
        <div key={row.id} className="min-w-0">
          <dt className="text-gold">{t(`guitars.cardSummary.${row.id}`)}</dt>
          <dd
            className={
              productLayout
                ? "mt-2 line-clamp-4 min-h-[4.5em] normal-case tracking-normal break-words text-muted"
                : "mt-1 normal-case tracking-normal break-words text-muted"
            }
          >
            {row.value || "\u00a0"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
