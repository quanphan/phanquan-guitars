import { guitarCardSummary } from "../../services/guitarCardSummary.js";

export default function CardSpecSummary({ guitar, t, className = "" }) {
  const specEntries = guitarCardSummary(guitar, t);
  if (!specEntries.length) return null;

  return (
    <dl
      className={`grid grid-cols-1 gap-4 border-t border-white/8 pt-5 text-[11px] uppercase tracking-[0.16em] text-ivory/70 sm:grid-cols-3 sm:gap-3 ${className}`}
    >
      {specEntries.map((row) => (
        <div key={row.id} className="min-w-0">
          <dt className="text-gold">{t(`guitars.cardSummary.${row.id}`)}</dt>
          <dd className="mt-1 normal-case tracking-normal break-words text-muted">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
