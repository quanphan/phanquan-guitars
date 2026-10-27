import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { placeSeriesPopover } from "../../services/seriesPopover.js";

export default function SeriesDescriptionOverlay({
  id,
  anchorRef,
  name,
  description,
  priceRange,
  labelledBy,
  onKeep,
  onLeave,
}) {
  const overlayRef = useRef(null);
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    function update() {
      const cardRect = anchorRef?.current?.getBoundingClientRect();
      if (!cardRect) return;
      const next = placeSeriesPopover({
        cardRect,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      });
      setStyle({
        left: `${next.left}px`,
        maxWidth: `${next.maxWidth}px`,
        maxHeight: `${next.maxHeight}px`,
        top: next.top === "auto" ? "auto" : `${next.top}px`,
        bottom: next.bottom === "auto" ? "auto" : `${next.bottom}px`,
      });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, description, priceRange]);

  useEffect(() => {
    overlayRef.current?.scrollTo?.(0, 0);
  }, [description, priceRange]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={overlayRef}
      id={id}
      role="tooltip"
      aria-labelledby={labelledBy}
      onMouseEnter={onKeep}
      onMouseLeave={onLeave}
      className="fixed z-[70] overflow-y-auto border border-gold/40 bg-charcoal/95 px-5 py-4 text-left opacity-100 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-opacity duration-150"
      style={style || { visibility: "hidden" }}
    >
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{name}</p>
      {description ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ivory">{description}</p>
      ) : null}
      {priceRange ? (
        <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-gold">{priceRange}</p>
      ) : null}
    </div>,
    document.body,
  );
}
