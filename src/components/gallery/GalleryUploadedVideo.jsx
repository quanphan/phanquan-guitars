import { useState } from "react";
import { galleryUploadMime, galleryVideoPreviewSrc } from "../../data/galleryVideo.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import "./galleryVideoPreview.css";

export default function GalleryUploadedVideo({
  src,
  poster = "",
  className = "",
  autoPlay = false,
  preview = false,
}) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  const type = galleryUploadMime(src) || "video/mp4";
  const videoSrc = preview ? galleryVideoPreviewSrc(src) : src;

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-panel px-4 text-center text-sm text-muted ${className}`}>
        {t("gallery.video.unsupported")}
      </div>
    );
  }

  return (
    <video
      controls={!preview}
      autoPlay={autoPlay}
      muted={preview}
      playsInline
      preload={preview ? "metadata" : "auto"}
      poster={poster || undefined}
      disablePictureInPicture
      className={`${preview ? "gallery-video-preview" : ""} ${className}`}
      onError={() => setFailed(true)}
    >
      <source src={videoSrc} type={type} />
    </video>
  );
}
