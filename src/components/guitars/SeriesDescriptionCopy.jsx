import { useLayoutEffect, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function SeriesDescriptionCopy({ name, description, priceRange, labelledBy }) {
  const { t } = useLanguage();
  const textRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [canToggle, setCanToggle] = useState(false);

  useLayoutEffect(() => {
    setExpanded(false);
  }, [description]);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;
    setCanToggle(el.scrollHeight > el.clientHeight + 2);
  }, [description, expanded, priceRange]);

  return (
    <div>
      {name ? (
        <p id={labelledBy} className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {name}
        </p>
      ) : null}
      {description ? (
        <p
          ref={textRef}
          className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ivory ${
            expanded ? "" : "max-h-32 overflow-hidden"
          }`}
        >
          {description}
        </p>
      ) : null}
      {canToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 text-[11px] uppercase tracking-[0.22em] text-gold transition-colors hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {expanded ? t("guitars.series.showLess") : t("guitars.series.readMore")}
        </button>
      ) : null}
      {priceRange ? (
        <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-gold">{priceRange}</p>
      ) : null}
    </div>
  );
}
