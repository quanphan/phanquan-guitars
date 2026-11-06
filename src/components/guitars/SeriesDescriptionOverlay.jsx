import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { placeSeriesPopover } from "../../services/seriesPopover.js";
import SeriesDescriptionCopy from "./SeriesDescriptionCopy.jsx";

export default function SeriesDescriptionOverlay({
  id,
  anchorRef,
  name,
  description,
  priceRange,
  labelledBy,
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
        width: `${next.maxWidth}px`,
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

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={overlayRef}
      id={id}
      role="dialog"
      aria-labelledby={labelledBy}
      className="fixed z-[70] overflow-y-auto overscroll-contain border border-gold/40 bg-charcoal/95 px-5 py-4 text-left shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm"
      style={style || { visibility: "hidden" }}
    >
      <SeriesDescriptionCopy
        name={name}
        description={description}
        priceRange={priceRange}
      />
    </div>,
    document.body,
  );
}
