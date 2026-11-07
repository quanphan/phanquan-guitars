import { mediaUrl } from "../../config/api.js";
import { galleryPosterUrl, isExternalGalleryVideo, resolveGalleryVideo } from "../../data/galleryVideo.js";
import GalleryFacebookPoster from "./GalleryFacebookPoster.jsx";
import GalleryImage from "./GalleryImage.jsx";
import GalleryPlayIcon from "./GalleryPlayIcon.jsx";
import GalleryUploadedVideo from "./GalleryUploadedVideo.jsx";

export default function GalleryMediaThumb({
  item,
  className = "",
  alt = "",
  compact = false,
  onPlay,
  playLabel,
}) {
  if (!item) return <div className={`bg-ink ${className}`} aria-hidden="true" />;
  const poster = galleryPosterUrl(item, mediaUrl);
  const src = item.kind === "image" ? mediaUrl(item.url || item.path) : poster;
  const isVideo = item.kind === "video";
  const provider = item.provider || resolveGalleryVideo(item).provider;
  const fileSrc = isVideo && !poster && !isExternalGalleryVideo(item) ? mediaUrl(item.url || item.path) : "";
  const showFacebook = isVideo && provider === "facebook";

  return (
    <div className={`relative isolate ${className}`}>
      <div className="absolute inset-0 z-0 overflow-hidden bg-ink [transform:translateZ(0)]">
        {showFacebook ? (
          <GalleryFacebookPoster poster={poster} title={alt} compact={compact} />
        ) : src ? (
          <GalleryImage src={src} alt={alt} className="h-full w-full object-cover object-center" />
        ) : fileSrc ? (
          <GalleryUploadedVideo src={fileSrc} preview className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover [transform:translateZ(0)]" />
        ) : (
          <div className="h-full w-full bg-panel" />
        )}
      </div>
      {isVideo ? (
        <GalleryPlayIcon compact={compact} onClick={onPlay} label={playLabel} />
      ) : null}
    </div>
  );
}
