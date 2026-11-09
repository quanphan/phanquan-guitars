import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function GalleryImage({ src, alt = "", className = "" }) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-panel px-3 text-center text-xs text-muted ${className}`}>
        {t("gallery.media.unavailable")}
      </div>
    );
  }
  return (
    <img
      key={src}
      src={src}
      alt={alt}
      className={className}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
