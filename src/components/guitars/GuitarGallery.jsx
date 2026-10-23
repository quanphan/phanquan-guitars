import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { imageAlt } from "../../services/productView.js";

export default function GuitarGallery({ guitar }) {
  const { t } = useLanguage();
  const images = guitar.images ?? [];
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const total = images.length;
  const current = images[index] ?? images[0];

  const go = useCallback(
    (next) => {
      if (!total) return;
      setIndex((value) => (value + next + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, go]);

  if (!current) return null;

  const counter = t("guitars.gallery.counter")
    .replace("{current}", String(index + 1))
    .replace("{total}", String(total));

  const controlClass =
    "inline-flex h-10 w-10 items-center justify-center border border-gold/50 text-gold transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

  return (
    <div className="min-w-0">
      <div className="relative">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="block w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          aria-label={t("guitars.gallery.enlarge")}
        >
          <img
            src={current.src}
            srcSet={current.srcSet}
            sizes="(min-width: 1024px) 45vw, 100vw"
            alt={imageAlt(current, t)}
            width={current.width}
            height={current.height}
            className={`aspect-[4/5] w-full object-cover ${guitar.imagePosition ?? "object-center"}`}
          />
        </button>
        <p className="pointer-events-none absolute right-3 top-3 bg-charcoal/80 px-3 py-1 text-[11px] tracking-[0.16em] text-ivory">
          {counter}
        </p>
        {total > 1 ? (
          <>
            <button
              type="button"
              className={`${controlClass} absolute left-3 top-1/2 -translate-y-1/2 bg-charcoal/70`}
              aria-label={t("guitars.gallery.prev")}
              onClick={() => go(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              className={`${controlClass} absolute right-3 top-1/2 -translate-y-1/2 bg-charcoal/70`}
              aria-label={t("guitars.gallery.next")}
              onClick={() => go(1)}
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {images.map((image, imageIndex) => (
            <li key={`${image.src}-${imageIndex}`}>
              <button
                type="button"
                aria-pressed={imageIndex === index}
                aria-label={imageAlt(image, t)}
                onClick={() => setIndex(imageIndex)}
                className={`block w-full overflow-hidden border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                  imageIndex === index
                    ? "border-gold"
                    : "border-white/10 hover:border-gold/40"
                }`}
              >
                <img
                  src={image.src}
                  alt={imageAlt(image, t)}
                  className="aspect-square w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {lightbox ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-charcoal/92 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("guitars.gallery.lightbox")}
          onClick={() => setLightbox(false)}
        >
          <div
            className="relative max-h-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={current.src}
              alt={imageAlt(current, t)}
              className="max-h-[85vh] w-auto max-w-full object-contain"
            />
            <p className="mt-3 text-center text-[11px] tracking-[0.16em] text-ivory/80">
              {counter}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button type="button" className={controlClass} onClick={() => go(-1)} aria-label={t("guitars.gallery.prev")}>
                ‹
              </button>
              <button
                type="button"
                className={`${controlClass} px-4 w-auto text-[11px] uppercase tracking-[0.18em]`}
                onClick={() => setLightbox(false)}
              >
                {t("guitars.gallery.close")}
              </button>
              <button type="button" className={controlClass} onClick={() => go(1)} aria-label={t("guitars.gallery.next")}>
                ›
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
