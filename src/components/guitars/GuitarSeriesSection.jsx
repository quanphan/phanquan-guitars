import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  seriesCarouselNeedsNav,
  seriesCarouselTrack,
  seriesCarouselVisibleCount,
  seriesCarouselWrappedOffset,
} from "../../data/seriesCarousel.js";
import { mediaUrl } from "../../config/api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { formatSeriesPriceRange, seriesCardCopy } from "../../services/guitarSeries.js";
import { prefersWideSeriesLayout } from "../../services/seriesPopover.js";
import Button from "../Button.jsx";
import FitImage from "../FitImage.jsx";
import SeriesDescriptionCopy from "./SeriesDescriptionCopy.jsx";
import SeriesDescriptionOverlay from "./SeriesDescriptionOverlay.jsx";

const CARD_GAP_PX = 24;
const SWIPE_THRESHOLD_PX = 48;
const SLIDE_MS = 480;

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

function SeriesCard({ item, open, onToggle, wide, style, offscreen }) {
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
    <li
      className="flex h-full min-w-0 shrink-0 flex-col"
      style={style}
      aria-hidden={offscreen || undefined}
      inert={offscreen ? true : undefined}
    >
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
            <FitImage
              src={mediaUrl(card.imagePath)}
              alt=""
              fit="contain"
              loading="eager"
              decoding="async"
              frameClassName="aspect-[16/10] w-full"
            />
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
        <div className="mt-auto flex items-stretch border-t border-white/8">
          {hasDetails ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={descriptionId}
              onClick={onToggleDetails}
              className="min-h-12 flex-1 px-6 py-3 text-left text-[11px] uppercase tracking-[0.22em] text-gold transition-colors hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold"
            >
              {t("guitars.series.details")}
            </button>
          ) : (
            <span className="min-h-12 flex-1" />
          )}
          <Link
            to={card.href}
            aria-label={t("guitars.series.viewSeries")}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center border-l border-white/8 text-gold transition-colors hover:bg-gold/10 hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
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

function SeriesCarousel({ series, openId, onToggle, wide, onMove }) {
  const { t } = useLanguage();
  const viewportRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, delta: 0, moved: false });
  const [visibleCount, setVisibleCount] = useState(() =>
    seriesCarouselVisibleCount(typeof window !== "undefined" ? window.innerWidth : 1280),
  );
  const [viewportWidth, setViewportWidth] = useState(0);
  const [offset, setOffset] = useState(() =>
    seriesCarouselTrack(
      series,
      seriesCarouselVisibleCount(typeof window !== "undefined" ? window.innerWidth : 1280),
    ).startOffset,
  );
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const [animate, setAnimate] = useState(true);
  const [busy, setBusy] = useState(false);
  const looping = seriesCarouselNeedsNav(series.length, visibleCount);
  const { slides, startOffset } = seriesCarouselTrack(series, visibleCount);
  const perView = Math.min(visibleCount, Math.max(series.length, 1));
  const itemWidth = viewportWidth > 0
    ? (viewportWidth - CARD_GAP_PX * Math.max(perView - 1, 0)) / perView
    : 0;
  const step = itemWidth + CARD_GAP_PX;

  const measure = useCallback(() => {
    const nextVisible = seriesCarouselVisibleCount(window.innerWidth);
    setVisibleCount(nextVisible);
    const node = viewportRef.current;
    if (node) setViewportWidth(node.getBoundingClientRect().width);
  }, []);

  useLayoutEffect(() => {
    measure();
    const node = viewportRef.current;
    const observer = node && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => measure())
      : null;
    observer?.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => {
    setAnimate(false);
    setOffset(startOffset);
    setBusy(false);
    const frame = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, [startOffset, series.length, visibleCount]);

  const go = useCallback((delta) => {
    if (!looping || busy || !delta || !step) return;
    onMove?.();
    setBusy(true);
    setAnimate(true);
    setOffset((current) => current + delta);
    window.setTimeout(() => {
      const current = offsetRef.current;
      const wrapped = seriesCarouselWrappedOffset(current, series.length, visibleCount);
      if (wrapped !== current) {
        setAnimate(false);
        setOffset(wrapped);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setAnimate(true);
            setBusy(false);
          });
        });
        return;
      }
      setBusy(false);
    }, SLIDE_MS + 80);
  }, [busy, looping, onMove, step, series.length, visibleCount]);

  function finishSlide() {
    if (!looping) {
      setBusy(false);
      return;
    }
    const current = offsetRef.current;
    const wrapped = seriesCarouselWrappedOffset(current, series.length, visibleCount);
    if (wrapped === current) {
      setBusy(false);
      return;
    }
    setAnimate(false);
    setOffset(wrapped);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setAnimate(true);
        setBusy(false);
      });
    });
  }

  function onPointerDown(event) {
    if (!looping) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragRef.current = { active: true, startX: event.clientX, delta: 0, moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    dragRef.current.delta = delta;
    if (Math.abs(delta) > 8) dragRef.current.moved = true;
  }

  function onPointerUp() {
    if (!dragRef.current.active) return;
    const { delta, moved } = dragRef.current;
    dragRef.current.active = false;
    if (!moved) return;
    if (delta <= -SWIPE_THRESHOLD_PX) go(1);
    else if (delta >= SWIPE_THRESHOLD_PX) go(-1);
  }

  function onTrackClickCapture(event) {
    if (dragRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current.moved = false;
    }
  }

  return (
    <div className="relative">
      {looping ? (
        <>
          <button
            type="button"
            aria-label={t("guitars.series.previous")}
            onClick={() => go(-1)}
            disabled={busy}
            className="absolute left-2 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center border border-gold/70 bg-charcoal/90 text-gold transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={t("guitars.series.next")}
            onClick={() => go(1)}
            disabled={busy}
            className="absolute right-2 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center border border-gold/70 bg-charcoal/90 text-gold transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </>
      ) : null}
      <div
        ref={viewportRef}
        className="overflow-hidden touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <ul
          className="flex"
          style={{
            gap: `${CARD_GAP_PX}px`,
            transform: step ? `translate3d(${-offset * step}px, 0, 0)` : undefined,
            transition: animate && step ? `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : "none",
          }}
          onTransitionEnd={(event) => {
            if (event.target === event.currentTarget) finishSlide();
          }}
          onClickCapture={onTrackClickCapture}
        >
          {slides.map((item, index) => (
            <SeriesCard
              key={`${item.id}-${index}`}
              item={item}
              open={openId === item.id && index >= offset && index < offset + perView}
              onToggle={onToggle}
              wide={wide}
              offscreen={index < offset || index >= offset + perView}
              style={{ width: itemWidth ? `${itemWidth}px` : `${100 / perView}%` }}
            />
          ))}
        </ul>
      </div>
    </div>
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
    <section id="series" className="scroll-mt-24 overflow-x-clip pt-8 pb-12 lg:pt-10 lg:pb-16" aria-label={t("guitars.series.title")}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <header className="mb-8 lg:mb-10">
          <p className="text-[11px] uppercase tracking-[0.32em] text-gold">{t("guitars.series.eyebrow")}</p>
          <h2 className="mt-3 font-display text-3xl tracking-wide text-ivory sm:text-4xl">{t("guitars.series.title")}</h2>
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
            series={series}
            openId={openId}
            onToggle={toggle}
            wide={wide}
            onMove={() => setOpenId("")}
          />
        ) : null}
      </div>
    </section>
  );
}
