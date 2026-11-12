import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import SeriesDescriptionCopy from "./SeriesDescriptionCopy.jsx";

export default function SeriesDescriptionOverlay({
  id,
  name,
  description,
  priceRange,
  labelledBy,
  onClose,
}) {
  const { t } = useLanguage();
  const fallbackTitleId = useId();
  const titleId = labelledBy || fallbackTitleId;

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-8" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/80"
        aria-label={t("guitars.series.close")}
        onClick={onClose}
      />
      <div
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(86vh,40rem)] w-full max-w-lg flex-col border border-gold/40 bg-charcoal px-5 py-5 text-left shadow-[0_18px_40px_rgba(0,0,0,0.45)] sm:px-6 sm:py-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <p id={titleId} className="min-w-0 font-display text-xl tracking-wide text-ivory sm:text-2xl">
            {name}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-gold/70 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-gold transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            {t("guitars.series.close")}
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <SeriesDescriptionCopy description={description} priceRange={priceRange} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
