import { useState } from "react";
import { mediaUrl } from "../../config/api.js";
import {
  REFERENCE_IMAGE_ACCEPT,
  REFERENCE_IMAGE_MAX,
  remainingReferenceImageSlots,
  sanitizeReferenceImages,
  validateReferenceImageFile,
} from "../../data/referenceImages.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  deleteCustomBuildReferenceImage,
  uploadCustomBuildReferenceImage,
} from "../../services/customBuildService.js";

export default function ReferenceImageField({ images, onChange, disabled }) {
  const { t } = useLanguage();
  const stored = sanitizeReferenceImages(images);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const remaining = remainingReferenceImageSlots(stored.length);

  async function onFiles(event) {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    if (!files.length || disabled || busy) return;
    setError(null);
    if (files.length > remaining) {
      setError("tooMany");
      return;
    }
    setBusy(true);
    const next = [...stored];
    for (const file of files) {
      if (next.length >= REFERENCE_IMAGE_MAX) {
        setError("tooMany");
        break;
      }
      const local = validateReferenceImageFile(file);
      if (!local.ok) {
        setError(local.code === "PAYLOAD_TOO_LARGE" ? "tooLarge" : "invalidType");
        continue;
      }
      const uploaded = await uploadCustomBuildReferenceImage(file);
      if (!uploaded.ok) {
        setError(
          uploaded.code === "PAYLOAD_TOO_LARGE"
            ? "tooLarge"
            : uploaded.code === "UNSUPPORTED_MEDIA_TYPE"
              ? "invalidType"
              : "uploadFailed",
        );
        continue;
      }
      const [path] = sanitizeReferenceImages([uploaded.path]);
      if (!path) {
        setError("uploadFailed");
        continue;
      }
      next.push(path);
    }
    setBusy(false);
    onChange(next);
  }

  async function removeAt(index) {
    if (disabled || busy) return;
    const path = stored[index];
    const next = stored.filter((_, itemIndex) => itemIndex !== index);
    onChange(next);
    setError(null);
    if (path) {
      await deleteCustomBuildReferenceImage(path);
    }
  }

  const errorLabel = error
    ? t(`customBuild.step6.errors.${error}`) === `customBuild.step6.errors.${error}`
      ? t("customBuild.step6.errors.invalid")
      : t(`customBuild.step6.errors.${error}`)
    : null;

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold">
        {t("customBuild.step6.fields.referenceImages")}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {t("customBuild.step6.fields.referenceImagesHint")}
      </p>

      {stored.length ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {stored.map((path, index) => (
            <li key={path} className="border border-white/10 bg-ink">
              <img
                src={mediaUrl(path)}
                alt=""
                className="aspect-square w-full object-cover"
              />
              {disabled ? null : (
                <button
                  type="button"
                  onClick={() => void removeAt(index)}
                  className="w-full px-2 py-2 text-[11px] uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {t("customBuild.step6.fields.referenceImagesRemove")}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {errorLabel ? (
        <p className="mt-2 text-xs text-gold" role="alert">
          {errorLabel}
        </p>
      ) : null}

      {remaining > 0 && !disabled ? (
        <label className={`mt-4 inline-flex cursor-pointer border border-gold/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory hover:bg-gold/10 ${busy ? "opacity-60" : ""}`}>
          {busy ? t("customBuild.step6.fields.referenceImagesUploading") : t("customBuild.step6.fields.referenceImagesChoose")}
          <input
            type="file"
            accept={REFERENCE_IMAGE_ACCEPT}
            multiple
            className="sr-only"
            disabled={disabled || busy}
            onChange={(event) => void onFiles(event)}
          />
        </label>
      ) : null}
      <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted">
        {stored.length} / {REFERENCE_IMAGE_MAX}
      </p>
    </div>
  );
}
