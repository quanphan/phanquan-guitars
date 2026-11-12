import { useCallback, useId, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../../config/api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { formatSeriesPriceRange, seriesCardCopy } from "../../services/guitarSeries.js";
import Button from "../Button.jsx";
import { catalogCard } from "../cards/catalogCardChrome.js";
import SeriesCardCoverImage, { SERIES_CARD_IMAGE_FRAME } from "../series/SeriesCardCoverImage.jsx";
import SeriesCarousel from "../series/SeriesCarousel.jsx";
import SeriesDescriptionOverlay from "./SeriesDescriptionOverlay.jsx";

function SeriesCard({ item, open, onToggle, onCloseDetails, style, offscreen }) {
  const { t, language } = useLanguage();
  const card = seriesCardCopy(item, language);
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const priceRange = formatSeriesPriceRange(card, t);
  const blurb = card.shortDescription || card.description;
  const hasDetails = Boolean(card.description || priceRange);

  function onToggleDetails(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!hasDetails) return;
    onToggle(card.id);
  }

  return (
    <li
      className="relative z-0 flex h-full min-w-0 shrink-0 flex-col [@media(hover:hover)_and_(pointer:fine)]:hover:z-20"
      style={style}
      aria-hidden={offscreen || undefined}
      inert={offscreen ? true : undefined}
    >
      <article data-series-card={card.id} className={catalogCard.article}>
        <Link to={card.href} className={catalogCard.link}>
          {card.imagePath ? (
            <SeriesCardCoverImage src={mediaUrl(card.imagePath)} series={card} />
          ) : (
            <div className={`${SERIES_CARD_IMAGE_FRAME} px-6 py-5`}>
              <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("guitars.series.title")}</p>
            </div>
          )}
          <div className={catalogCard.copy}>
            <h3 id={titleId} className={catalogCard.title}>
              {card.name}
            </h3>
            <p className={catalogCard.description}>{blurb || "\u00a0"}</p>
          </div>
          <span className={catalogCard.actionSpacer} aria-hidden="true" />
        </Link>
        <div className={catalogCard.actionOverlay}>
          {hasDetails ? (
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-controls={descriptionId}
              onClick={onToggleDetails}
              className={`pointer-events-auto hover:text-gold-light focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold lg:[@media(hover:hover)_and_(pointer:fine)]:pointer-events-none lg:[@media(hover:hover)_and_(pointer:fine)]:group-focus-within:pointer-events-auto lg:[@media(hover:hover)_and_(pointer:fine)]:group-hover:pointer-events-auto ${catalogCard.action}`}
            >
              {t("guitars.series.viewDetails")}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </article>
      {hasDetails && open ? (
        <SeriesDescriptionOverlay
          id={descriptionId}
          name={card.name}
          description={card.description}
          priceRange={priceRange}
          onClose={onCloseDetails}
        />
      ) : null}
    </li>
  );
}

export default function GuitarSeriesSection({ series, status, onRetry }) {
  const { t } = useLanguage();
  const [openId, setOpenId] = useState("");

  const toggle = useCallback((id) => {
    setOpenId((current) => (current === id ? "" : id));
  }, []);

  const closeDetails = useCallback(() => setOpenId(""), []);

  return (
    <section id="series" className="page-start relative z-0 scroll-mt-24 overflow-visible pb-6 lg:pb-8" aria-label={t("guitars.series.heading")}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <header className="mb-8 lg:mb-10">
          <h2 className="max-w-full font-display text-[clamp(1.5rem,3vw+1rem,2.25rem)] tracking-wide text-ivory break-words">{t("guitars.series.heading")}</h2>
        </header>
        {status === "loading" ? (
          <p className="text-sm text-muted">{t("guitars.series.loading")}</p>
        ) : null}

        {status === "error" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">{t("guitars.series.error")}</p>
            <Button type="button" variant="outline" onClick={onRetry}>
              {t("guitars.series.retry")}
            </Button>
          </div>
        ) : null}

        {status === "ready" && series.length === 0 ? (
          <p className="text-sm text-muted">{t("guitars.series.empty")}</p>
        ) : null}

        {status === "ready" && series.length > 0 ? (
          <SeriesCarousel
            items={series}
            previousLabel={t("guitars.series.previous")}
            nextLabel={t("guitars.series.next")}
            onMove={() => setOpenId("")}
          >
            {({ item, index, offset, perView, offscreen, style }) => (
              <SeriesCard
                item={item}
                open={openId === item.id && index >= offset && index < offset + perView}
                onToggle={toggle}
                onCloseDetails={closeDetails}
                offscreen={offscreen}
                style={style}
              />
            )}
          </SeriesCarousel>
        ) : null}
      </div>
    </section>
  );
}
