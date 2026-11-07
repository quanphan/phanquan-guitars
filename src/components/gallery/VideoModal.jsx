import { useEffect, useId } from "react";
import { mediaUrl } from "../../config/api.js";
import {
  galleryDirectVideoPath,
  galleryPosterUrl,
  galleryVideoEmbedSrc,
  galleryWatchUrl,
  isExternalGalleryVideo,
  resolveGalleryVideo,
} from "../../data/galleryVideo.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import GalleryFacebookPlayer from "./GalleryFacebookPlayer.jsx";
import GalleryUploadedVideo from "./GalleryUploadedVideo.jsx";

function WatchLink({ href, provider, t }) {
  if (!href) return null;
  const label =
    provider === "youtube"
      ? t("gallery.video.watchYoutube")
      : provider === "vimeo"
        ? t("gallery.video.watchVimeo")
        : provider === "facebook"
          ? t("gallery.video.watchFacebook")
          : t("gallery.video.watchExternal");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-block text-[11px] uppercase tracking-[0.18em] text-gold"
    >
      {label}
    </a>
  );
}

function EmbedFrame({ src, title }) {
  return (
    <div className="relative aspect-video w-full max-h-[min(80vh,calc(100vh-9rem))] overflow-hidden bg-ink">
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

export default function VideoModal({ item, title = "", onClose }) {
  const { t } = useLanguage();
  const titleId = useId();
  const resolved = resolveGalleryVideo(item);
  const provider = resolved.provider || item?.provider;
  const embed = galleryVideoEmbedSrc(item, { autoplay: true });
  const fileSrc = mediaUrl(galleryDirectVideoPath(item));
  const poster = galleryPosterUrl(item, mediaUrl);
  const watchUrl = galleryWatchUrl(item);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (!item || item.kind === "image") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/90"
        aria-label={t("gallery.video.close")}
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-[min(96vw,72rem)] flex-col overflow-y-auto border border-gold/30 bg-ink p-4 sm:max-h-[calc(100vh-3rem)] sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <p id={titleId} className="min-w-0 font-display text-lg tracking-wide text-ivory sm:text-xl">
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-gold/70 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-gold hover:bg-gold/10"
          >
            {t("gallery.video.close")}
          </button>
        </div>
        <div className="flex min-h-0 w-full items-center justify-center overflow-hidden">
          {embed && provider === "facebook" ? (
            <GalleryFacebookPlayer
              href={resolved.sourceUrl || resolved.watchUrl || watchUrl}
              embedSrc={embed}
              title={title}
            />
          ) : embed ? (
            <EmbedFrame src={embed} title={title} />
          ) : fileSrc ? (
            <GalleryUploadedVideo
              src={fileSrc}
              poster={poster}
              autoPlay
              className="h-auto max-h-[min(80vh,calc(100vh-9rem))] w-auto max-w-full bg-ink object-contain"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-panel px-6 text-center">
              <p className="text-sm text-muted">{t("gallery.video.unavailable")}</p>
            </div>
          )}
        </div>
        {provider === "facebook" && embed ? (
          <p className="mt-3 text-sm text-muted">{t("gallery.video.facebookRestricted")}</p>
        ) : null}
        {watchUrl && isExternalGalleryVideo(item) ? <WatchLink href={watchUrl} provider={provider} t={t} /> : null}
      </div>
    </div>
  );
}
