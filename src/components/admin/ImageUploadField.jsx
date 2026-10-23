import { useEffect, useState } from "react";
import { mediaUrl } from "../../config/api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function ImageUploadField({
  label,
  storedPath,
  onUploaded,
  onClear,
  upload,
  disabled,
  canUpload,
}) {
  const { t } = useLanguage();
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !canUpload) return;
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    const local = URL.createObjectURL(file);
    setPreview(local);
    setBusy(true);
    const result = await upload(file);
    setBusy(false);
    if (!result.ok) {
      setError(result.code);
      URL.revokeObjectURL(local);
      setPreview(null);
      return;
    }
    onUploaded(result.path);
  }

  const shown = preview || (storedPath ? mediaUrl(storedPath) : "");

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{label}</p>
      {shown ? (
        <img src={shown} alt="" className="mt-3 h-32 w-32 object-cover border border-white/10 bg-ink" />
      ) : (
        <p className="mt-3 text-sm text-muted">{t("admin.catalog.noImage")}</p>
      )}
      {storedPath ? <p className="mt-2 break-all text-xs text-muted">{storedPath}</p> : null}
      {error ? (
        <p className="mt-2 text-xs text-gold" role="alert">
          {t(`admin.catalog.errors.${error}`) === `admin.catalog.errors.${error}`
            ? t("admin.catalog.errors.failure")
            : t(`admin.catalog.errors.${error}`)}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-3">
        {canUpload ? (
          <label className="inline-flex cursor-pointer border border-gold/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory hover:bg-gold/10">
            {busy ? t("admin.catalog.uploading") : t("admin.catalog.chooseImage")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={disabled || busy}
              onChange={(event) => void onFile(event)}
            />
          </label>
        ) : (
          <p className="text-xs text-muted">{t("admin.catalog.uploadForbidden")}</p>
        )}
        {storedPath && onClear ? (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={onClear}
            className="text-[11px] uppercase tracking-[0.18em] text-gold"
          >
            {t("admin.catalog.clearImage")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
