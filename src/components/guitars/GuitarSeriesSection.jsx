import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../../config/api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { formatSeriesPriceRange, seriesCardCopy } from "../../services/guitarSeries.js";
import { prefersWideSeriesLayout } from "../../services/seriesPopover.js";
import Button from "../Button.jsx";
import SeriesDescriptionCopy from "./SeriesDescriptionCopy.jsx";
import SeriesDescriptionOverlay from "./SeriesDescriptionOverlay.jsx";

function useWideSeriesLayout() {
  const [wide, setWide] = useState(
    () => typeof window !== "undefined" && prefersWideSeriesLayout(window),
  );
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(prefersWideSeriesLayout(window));
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return wide;
}

function SeriesCard({ item, open, onToggle, wide }) {
  const { t, language } = useLanguage();
  const card = seriesCardCopy(item, language);
  const cardRef = useRef(null);
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const priceRange = formatSeriesPriceRange(card, t);
  const hasDetails = Boolean(card.description || priceRange);

  function onToggleDetails(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!hasDetails) return;
    onToggle(card.id);
  }

  return (
    <li className="flex min-w-0 flex-col">
      <article
        ref={cardRef}
        data-series-card={card.id}
        className="relative flex min-h-0 flex-1 flex-col border border-white/8 bg-panel/80 transition-colors duration-300 hover:border-gold/40"
      >
        <Link
          to={card.href}
          className="flex h-full w-full min-w-0 flex-col text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {card.imagePath ? (
            <div className="overflow-hidden">
              <img
                src={mediaUrl(card.imagePath)}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
          ) : (
            <div className="border-b border-white/8 px-6 py-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("guitars.series.title")}</p>
            </div>
          )}
          <div className="flex flex-1 flex-col gap-3 px-6 py-6">
            <h3 id={titleId} className="font-display text-2xl tracking-wide text-ivory sm:text-3xl">
              {card.name}
            </h3>
            {card.shortDescription ? (
              <p className="line-clamp-3 text-sm leading-relaxed text-muted">{card.shortDescription}</p>
            ) : null}
          </div>
        </Link>
        {hasDetails && wide ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={descriptionId}
            aria-label={t("guitars.series.readDescription")}
            onClick={onToggleDetails}
            className="absolute right-3 top-3 hidden size-9 items-center justify-center border border-gold/70 bg-charcoal/80 text-gold transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold lg:inline-flex"
          >
            <Info className="size-4" aria-hidden="true" />
          </button>
        ) : null}
        {hasDetails && !wide ? (
          <div className="border-t border-white/8 px-6 py-4 lg:hidden">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={descriptionId}
              onClick={onToggleDetails}
              className="text-[11px] uppercase tracking-[0.22em] text-gold transition-colors hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {t("guitars.series.aboutThisSeries")}
            </button>
          </div>
        ) : null}
      </article>
      {hasDetails && !wide ? (
        <div
          id={descriptionId}
          inert={!open ? true : undefined}
          className={`grid transition-[grid-template-rows] duration-300 ease-out lg:hidden ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mt-3 border border-gold/35 bg-charcoal/80 px-5 py-4">
              <SeriesDescriptionCopy
                description={card.description}
                priceRange={priceRange}
              />
            </div>
          </div>
        </div>
      ) : null}
      {hasDetails && wide && open ? (
        <SeriesDescriptionOverlay
          id={descriptionId}
          anchorRef={cardRef}
          name={card.name}
          description={card.description}
          priceRange={priceRange}
          labelledBy={titleId}
        />
      ) : null}
    </li>
  );
}

export default function GuitarSeriesSection({ series, status, onRetry }) {
  const { t } = useLanguage();
  const wide = useWideSeriesLayout();
  const [openId, setOpenId] = useState("");

  useEffect(() => {
    setOpenId("");
  }, [wide]);

  const toggle = useCallback((id) => {
    setOpenId((current) => (current === id ? "" : id));
  }, []);

  useEffect(() => {
    if (!openId) return undefined;
    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenId("");
      }
    }
    function onPointerDown(event) {
      if (!wide) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[role='dialog']")) return;
      if (target.closest(`[data-series-card="${openId}"]`)) return;
      setOpenId("");
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openId, wide]);

  return (
    <section id="series" className="scroll-mt-24 overflow-x-clip pt-8 pb-6 lg:pt-10 lg:pb-8" aria-label={t("guitars.series.title")}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
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
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {series.map((item) => (
              <SeriesCard
                key={item.id}
                item={item}
                open={openId === item.id}
                onToggle={toggle}
                wide={wide}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
