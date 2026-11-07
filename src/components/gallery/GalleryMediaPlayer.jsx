import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { mediaUrl } from "../../config/api.js";
import { galleryPosterUrl, resolveGalleryVideo } from "../../data/galleryVideo.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import GalleryFacebookPoster from "./GalleryFacebookPoster.jsx";
import GalleryImage from "./GalleryImage.jsx";
import GalleryPlayIcon from "./GalleryPlayIcon.jsx";
import VideoModal from "./VideoModal.jsx";
import { loadFacebookSdk } from "../../services/facebookSdk.js";
import { warmupFacebookMedia } from "../../services/facebookPlayerPool.js";

export default function GalleryMediaPlayer({ item, title = "", className = "" }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (item?.kind !== "video") return undefined;
    void loadFacebookSdk();
    warmupFacebookMedia([item]);
    return undefined;
  }, [item]);

  if (!item) return null;

  const resolved = resolveGalleryVideo(item);
  const poster = galleryPosterUrl(item, mediaUrl);
  const provider = resolved.provider || item.provider;
  const imageSrc = item.kind === "image" ? mediaUrl(item.url || item.path) : "";

  if (item.kind === "image") {
    return imageSrc ? (
      <GalleryImage src={imageSrc} alt={title} className={`max-h-[80vh] w-full bg-ink object-contain ${className}`} />
    ) : null;
  }

  return (
    <div className={className}>
      <button
        type="button"
        className="group relative isolate block aspect-video w-full overflow-hidden bg-charcoal"
        onClick={() => flushSync(() => setOpen(true))}
      >
        {provider === "facebook" ? (
          <GalleryFacebookPoster poster={poster} title={title} />
        ) : poster ? (
          <>
            <img src={poster} alt={title} className="absolute inset-0 z-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]" />
            <div className="pointer-events-none absolute inset-0 z-[1] bg-charcoal/20 transition-colors duration-300 group-hover:bg-charcoal/35" />
          </>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-panel to-charcoal" />
        )}
        <GalleryPlayIcon />
        <span className="sr-only">{t("gallery.video.play")}</span>
      </button>
      {open ? <VideoModal item={item} title={title} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
