import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import Reveal from "./Reveal.jsx";

export default function GuitarCard({ guitar }) {
  const { t } = useLanguage();

  return (
    <Reveal className="group h-full">
      <article className="flex h-full flex-col border border-white/8 bg-panel/80 transition-colors duration-300 hover:border-gold/40">
        <div className="relative overflow-hidden">
          <img
            src={guitar.image}
            srcSet={guitar.imageSrcSet}
            sizes={guitar.imageSizes}
            alt={guitar.name}
            loading="lazy"
            decoding="async"
            className={`aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] ${guitar.imagePosition ?? "object-center"}`}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
        </div>
        <div className="flex flex-1 flex-col gap-4 px-6 py-7">
          <h3 className="font-display text-3xl text-ivory">{guitar.name}</h3>
          <p className="text-sm leading-relaxed text-muted">
            {t(`home.featured.descriptions.${guitar.id}`)}
          </p>
          <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-white/8 pt-5 text-[11px] uppercase tracking-[0.16em] text-ivory/70">
            <div>
              <dt className="text-gold">{t("home.featured.wood")}</dt>
              <dd className="mt-1 normal-case tracking-normal text-muted">
                {guitar.wood}
              </dd>
            </div>
            <div>
              <dt className="text-gold">{t("home.featured.scale")}</dt>
              <dd className="mt-1">{guitar.scale}</dd>
            </div>
            <div>
              <dt className="text-gold">{t("home.featured.strings")}</dt>
              <dd className="mt-1">{guitar.strings}</dd>
            </div>
          </dl>
          <Link
            to="/guitars"
            className="mt-2 inline-flex w-fit text-[11px] uppercase tracking-[0.22em] text-gold transition-colors hover:text-gold-light"
          >
            {t("home.featured.viewDetails")}
          </Link>
        </div>
      </article>
    </Reveal>
  );
}
