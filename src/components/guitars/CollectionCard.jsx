import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import Reveal from "../Reveal.jsx";
import CardSpecSummary from "./CardSpecSummary.jsx";

export default function CollectionCard({ guitar }) {
  const { t } = useLanguage();
  const image = guitar.images?.[0];
  const name = guitar.name;
  const typeLabel = guitar.typeLabel;
  const description = guitar.description;

  return (
    <Reveal className="group h-full">
      <article className="flex h-full flex-col border border-white/8 bg-panel/80 transition-colors duration-300 hover:border-gold/40">
        <Link to={`/guitars/${guitar.id}`} className="relative overflow-hidden">
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
              className={`aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] ${guitar.imagePosition ?? "object-center"}`}
            />
          ) : (
            <div className="aspect-[4/5] w-full bg-ink" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
        </Link>
        <div className="flex flex-1 flex-col gap-4 px-6 py-7">
          {typeLabel ? (
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{typeLabel}</p>
          ) : null}
          <h3 className="font-display text-3xl text-ivory break-words">{name}</h3>
          {description ? <p className="text-sm leading-relaxed text-muted">{description}</p> : null}
          <CardSpecSummary guitar={guitar} t={t} className="mt-auto" />
          <Link
            to={`/guitars/${guitar.id}`}
            className="mt-2 inline-flex w-fit text-[11px] uppercase tracking-[0.22em] text-gold transition-colors hover:text-gold-light"
          >
            {t("guitars.collection.viewDetails")}
          </Link>
        </div>
      </article>
    </Reveal>
  );
}
