import { useEffect, useRef, useState } from "react";
import { errorText } from "../../auth/errorText.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import ContentImage from "../ContentImage.jsx";

export default function EditableFixedImage({
  editing = false,
  src,
  srcSet,
  sizes,
  alt,
  className = "",
  wrapperClassName = "",
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  disabled = false,
  onConfirmFile,
}) {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (pending?.url) URL.revokeObjectURL(pending.url);
    };
  }, [pending]);

  function clearPending() {
    if (pending?.url) URL.revokeObjectURL(pending.url);
    setPending(null);
    setError(null);
  }

  function onPick(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (pending?.url) URL.revokeObjectURL(pending.url);
    setError(null);
    setPending({ file, url: URL.createObjectURL(file) });
  }

  async function confirm() {
    if (!pending?.file || !onConfirmFile) return;
    setBusy(true);
    setError(null);
    const result = await onConfirmFile(pending.file);
    setBusy(false);
    if (!result?.ok) {
      setError(result?.code || "failure");
      return;
    }
    clearPending();
  }

  const shownSrc = pending?.url || src;
  const shownSrcSet = pending ? undefined : srcSet;

  return (
    <div className={`relative overflow-hidden bg-ink ${wrapperClassName}`.trim()}>
      <ContentImage
        src={shownSrc}
        srcSet={shownSrcSet}
        sizes={sizes}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
      />
      {editing ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={disabled || busy}
            onChange={onPick}
          />
          <button
            type="button"
            className="absolute left-3 top-3 z-10 border border-gold bg-ink/90 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-gold"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            {t("admin.pageContent.editImage")}
          </button>
        </>
      ) : null}
      {editing && pending ? (
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center gap-2 bg-ink/90 px-3 py-3">
          <button
            type="button"
            className="border border-gold bg-gold px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-charcoal disabled:opacity-40"
            disabled={disabled || busy}
            onClick={() => void confirm()}
          >
            {busy ? t("admin.pageContent.saving") : t("admin.pageContent.confirmImage")}
          </button>
          <button
            type="button"
            className="border border-white/20 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory"
            disabled={busy}
            onClick={clearPending}
          >
            {t("admin.cancel")}
          </button>
          {error ? (
            <p className="w-full text-xs text-gold" role="alert">
              {errorText(t, "admin.catalog", error)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
