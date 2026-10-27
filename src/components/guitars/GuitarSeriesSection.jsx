import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { mediaUrl } from "../../config/api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { formatSeriesPriceRange, seriesCardCopy } from "../../services/guitarSeries.js";
import { prefersFinePointer } from "../../services/seriesPopover.js";
import Button from "../Button.jsx";
import SeriesDescriptionOverlay from "./SeriesDescriptionOverlay.jsx";

function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFine(prefersFinePointer(window));
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return fine;
}

function SeriesCard({ item, selected, onSelect, open, onOpen, onClose, finePointer }) {
  const { t, language } = useLanguage();
  const card = seriesCardCopy(item, language);
  const cardRef = useRef(null);
  const closeTimer = useRef(null);
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const priceRange = formatSeriesPriceRange(card, t);
  const hasDetails = Boolean(card.description || priceRange);

  const clearClose = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openNow = useCallback(() => {
    if (!hasDetails) return;
    clearClose();
    onOpen(card.id);
  }, [card.id, clearClose, hasDetails, onOpen]);

  const closeSoon = useCallback(() => {
    clearClose();
    closeTimer.current = window.setTimeout(() => onClose(card.id), 80);
  }, [card.id, clearClose, onClose]);

  useEffect(() => () => clearClose(), [clearClose]);

  function onInfoClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (open) onClose(card.id);
    else openNow();
  }

  return (
    <li>
      <article
        ref={cardRef}
        data-series-card={card.id}
        onMouseEnter={() => {
          if (finePointer) openNow();
        }}
        onMouseLeave={() => {
          if (finePointer) closeSoon();
        }}
        className={`relative flex h-full flex-col overflow-hidden border transition-colors duration-300 ${
          selected ? "border-gold bg-gold/10" : "border-white/8 bg-panel/80 hover:border-gold/40"
        }`}
      >
        <button
          type="button"
          aria-pressed={selected}
          aria-describedby={open && hasDetails ? descriptionId : undefined}
          onClick={() => onSelect(selected ? "" : card.id)}
          onFocus={() => {
            if (finePointer) openNow();
          }}
          onBlur={(event) => {
            if (cardRef.current?.contains(event.relatedTarget)) return;
            if (event.relatedTarget instanceof Element && event.relatedTarget.closest("[role='tooltip']")) return;
            onClose(card.id);
          }}
          className="flex h-full w-full flex-col text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {card.imagePath ? (
            <img
              src={mediaUrl(card.imagePath)}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-[16/10] w-full object-cover"
            />
          ) : (
            <div className="border-b border-white/8 px-6 py-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("guitars.series.title")}</p>
            </div>
          )}
          <div className="flex flex-1 flex-col gap-3 px-6 py-6 pr-14">
            <h3 id={titleId} className="font-display text-2xl tracking-wide text-ivory sm:text-3xl">
              {card.name}
            </h3>
            {card.shortDescription ? (
              <p className="line-clamp-3 text-sm leading-relaxed text-muted">{card.shortDescription}</p>
            ) : null}
          </div>
        </button>
        {hasDetails ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={descriptionId}
            aria-label={t("guitars.series.readDescription")}
            onClick={onInfoClick}
            onFocus={openNow}
            onBlur={(event) => {
              if (cardRef.current?.contains(event.relatedTarget)) return;
              if (event.relatedTarget instanceof Element && event.relatedTarget.closest("[role='tooltip']")) return;
              onClose(card.id);
            }}
            className="absolute right-3 top-3 inline-flex size-9 items-center justify-center border border-gold/70 bg-charcoal/80 text-gold transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Info className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </article>
      {open && hasDetails ? (
        <SeriesDescriptionOverlay
          id={descriptionId}
          anchorRef={cardRef}
          name={card.name}
          description={card.description}
          priceRange={priceRange}
          labelledBy={titleId}
          onKeep={openNow}
          onLeave={closeSoon}
        />
      ) : null}
    </li>
  );
}

export default function GuitarSeriesSection({ series, status, selectedId, onSelect, onRetry }) {
  const { t } = useLanguage();
  const selected = selectedId || "";
  const finePointer = useFinePointer();
  const [openId, setOpenId] = useState("");

  const closeIf = useCallback((id) => {
    setOpenId((current) => (current === id ? "" : current));
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
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[role='tooltip']")) return;
      if (target.closest(`[data-series-card="${openId}"]`)) return;
      setOpenId("");
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openId]);

  return (
    <section id="series" className="scroll-mt-24 pt-8 pb-6 lg:pt-10 lg:pb-8" aria-label={t("guitars.series.title")}>
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
                selected={selected === item.id}
                onSelect={onSelect}
                open={openId === item.id}
                onOpen={setOpenId}
                onClose={closeIf}
                finePointer={finePointer}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
