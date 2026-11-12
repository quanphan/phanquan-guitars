import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  seriesCarouselNeedsNav,
  seriesCarouselTrack,
  seriesCarouselVisibleCount,
  seriesCarouselWrappedOffset,
} from "../../data/seriesCarousel.js";

const CARD_GAP_PX = 24;
const SWIPE_THRESHOLD_PX = 48;
const SLIDE_MS = 480;
const IMAGE_ASPECT = 9 / 16;
const VIEWPORT_PAD_Y = 16;

const navButtonClass =
  "pointer-events-auto absolute top-1/2 z-30 inline-flex size-8 -translate-y-1/2 items-center justify-center border border-gold/70 bg-charcoal/90 text-gold transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40 sm:size-10 lg:size-11";

export default function SeriesCarousel({ items, previousLabel, nextLabel, onMove, children }) {
  const list = Array.isArray(items) ? items : [];
  const viewportRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, delta: 0, moved: false });
  const [visibleCount, setVisibleCount] = useState(() =>
    seriesCarouselVisibleCount(typeof window !== "undefined" ? window.innerWidth : 1280),
  );
  const [viewportWidth, setViewportWidth] = useState(0);
  const [offset, setOffset] = useState(() =>
    seriesCarouselTrack(
      list,
      seriesCarouselVisibleCount(typeof window !== "undefined" ? window.innerWidth : 1280),
    ).startOffset,
  );
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const [animate, setAnimate] = useState(true);
  const [busy, setBusy] = useState(false);
  const looping = seriesCarouselNeedsNav(list.length, visibleCount);
  const { slides, startOffset } = seriesCarouselTrack(list, visibleCount);
  const perView = Math.min(visibleCount, Math.max(list.length, 1));
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
  }, [startOffset, list.length, visibleCount]);

  const go = useCallback((delta) => {
    if (!looping || busy || !delta || !step) return;
    onMove?.();
    setBusy(true);
    setAnimate(true);
    setOffset((current) => current + delta);
    window.setTimeout(() => {
      const current = offsetRef.current;
      const wrapped = seriesCarouselWrappedOffset(current, list.length, visibleCount);
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
  }, [busy, list.length, looping, onMove, step, visibleCount]);

  function finishSlide() {
    if (!looping) {
      setBusy(false);
      return;
    }
    const current = offsetRef.current;
    const wrapped = seriesCarouselWrappedOffset(current, list.length, visibleCount);
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
    if (event.target instanceof Element && event.target.closest("button, [role='dialog']")) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      delta: 0,
      moved: false,
      pointerId: event.pointerId,
      captured: false,
    };
  }

  function onPointerMove(event) {
    if (!dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    dragRef.current.delta = delta;
    if (Math.abs(delta) <= 8) return;
    dragRef.current.moved = true;
    if (!dragRef.current.captured) {
      viewportRef.current?.setPointerCapture?.(dragRef.current.pointerId);
      dragRef.current.captured = true;
    }
  }

  function onPointerUp() {
    if (!dragRef.current.active) return;
    const { delta, moved, captured, pointerId } = dragRef.current;
    dragRef.current.active = false;
    if (captured) viewportRef.current?.releasePointerCapture?.(pointerId);
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

  const imageHeight = itemWidth > 0 ? itemWidth * IMAGE_ASPECT : 0;

  return (
    <div className="relative">
      <div
        ref={viewportRef}
        className="overflow-x-clip py-4 touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <ul
          className="flex items-stretch"
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
            <Fragment key={`${item.id}-${index}`}>
              {children({
                item,
                index,
                offset,
                perView,
                offscreen: index < Math.round(offset) || index >= Math.round(offset) + perView,
                style: { width: itemWidth ? `${itemWidth}px` : `${100 / perView}%` },
              })}
            </Fragment>
          ))}
        </ul>
      </div>
      {looping && imageHeight > 0 ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-30"
          style={{ top: VIEWPORT_PAD_Y, height: imageHeight }}
        >
          <button
            type="button"
            aria-label={previousLabel}
            onClick={() => go(-1)}
            disabled={busy}
            className={`${navButtonClass} left-2`}
          >
            <ChevronLeft className="size-4 sm:size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={nextLabel}
            onClick={() => go(1)}
            disabled={busy}
            className={`${navButtonClass} right-2`}
          >
            <ChevronRight className="size-4 sm:size-5" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
