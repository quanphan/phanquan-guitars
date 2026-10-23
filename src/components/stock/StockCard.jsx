import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { formatProductPrice } from "../../services/formatPrice.js";
import CardSpecSummary from "../guitars/CardSpecSummary.jsx";
import Reveal from "../Reveal.jsx";

export default function StockCard({ item }) {
  const { t } = useLanguage();
  const image = item.images?.[0];
  const href = `/in-stock/${item.slug || item.id}`;
  const sold = item.availability === "sold";
  const name = item.name;
  const typeLabel = item.typeLabel;
  const priceLabel = formatProductPrice(item);

  return (
    <Reveal className="group h-full">
      <article className="flex h-full flex-col border border-white/8 bg-panel/80 transition-colors duration-300 hover:border-gold/40">
        <Link to={href} className="relative overflow-hidden">
          {image ? (
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
              alt={name}
              width={image.width}
              height={image.height}
              loading="lazy"
              decoding="async"
              className={`aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] ${item.imagePosition ?? "object-center"} ${sold ? "opacity-80" : ""}`}
            />
          ) : (
            <div className={`aspect-[4/5] w-full bg-ink ${sold ? "opacity-80" : ""}`} />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
          <p
            className={`absolute left-4 top-4 px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
              sold ? "bg-charcoal/85 text-ivory/80" : "bg-gold/90 text-charcoal"
            }`}
          >
            {t(`stock.status.${item.availability}`)}
          </p>
        </Link>
        <div className="flex flex-1 flex-col gap-4 px-6 py-7">
          {typeLabel ? (
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{typeLabel}</p>
          ) : null}
          <h3 className="font-display text-3xl text-ivory break-words">{name}</h3>
          <div className="mt-auto space-y-4">
            <CardSpecSummary guitar={item} t={t} />
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <Link
                to={href}
                className="inline-flex shrink-0 text-[11px] uppercase tracking-[0.22em] text-gold transition-colors hover:text-gold-light"
              >
                {t("stock.viewDetails")}
              </Link>
              {priceLabel ? (
                <p className="ml-auto min-w-0 text-right font-display text-xl tracking-wide text-gold break-words sm:text-2xl">
                  {priceLabel}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    </Reveal>
  );
}
