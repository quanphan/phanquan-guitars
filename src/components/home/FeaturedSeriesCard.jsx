import { Link } from "react-router-dom";
import { mediaUrl } from "../../config/api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import FitImage from "../FitImage.jsx";
import Reveal from "../Reveal.jsx";

export default function FeaturedSeriesCard({ series }) {
  const { t } = useLanguage();
  const image = series.imagePath ? mediaUrl(series.imagePath) : "";

  return (
    <Reveal className="group h-full">
      <article className="flex h-full flex-col border border-white/8 bg-panel/80 transition-colors duration-300 hover:border-gold/40">
        <Link to={series.href} className="relative overflow-hidden">
          <FitImage
            src={image}
            alt={series.name}
            fit="contain"
            frameClassName="aspect-[4/5] w-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
        </Link>
        <div className="flex flex-1 flex-col gap-4 px-6 py-7">
          <h3 className="max-w-full font-display text-3xl text-ivory break-words">{series.name}</h3>
          {series.shortDescription ? (
            <p className="text-sm leading-relaxed text-muted">{series.shortDescription}</p>
          ) : null}
          <Link
            to={series.href}
            className="mt-auto inline-flex w-fit text-[11px] uppercase tracking-[0.22em] text-gold transition-colors hover:text-gold-light"
          >
            {t("home.featured.viewSeries")}
          </Link>
        </div>
      </article>
    </Reveal>
  );
}
