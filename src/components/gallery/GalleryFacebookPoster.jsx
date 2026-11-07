import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function GalleryFacebookPoster({ poster, title = "", compact = false }) {
  const { t } = useLanguage();

  return (
    <>
      {poster ? (
        <img
          src={poster}
          alt={title}
          className="absolute inset-0 z-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-b from-[#2a2418] to-charcoal">
          <span className={compact ? "sr-only" : "absolute bottom-3 left-0 right-0 text-center text-[11px] uppercase tracking-[0.18em] text-gold/80"}>
            {t("gallery.video.facebookPreview")}
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-charcoal/30 transition-colors duration-300 group-hover:bg-charcoal/45" />
    </>
  );
}
