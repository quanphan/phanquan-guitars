import { useEffect, useMemo, useRef, useState } from "react";
import { errorText } from "../../auth/errorText.js";
import { mediaUrl } from "../../config/api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  fileForProductUpload,
  imageFileName,
  isHeicLike,
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX,
  productImageFileKey,
  takeProductImageFiles,
  uniqueImagePaths,
} from "../../utils/productImageFiles.js";

function draftId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `img-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ProductImagesField({
  images = [],
  onChange,
  upload,
  canUpload,
  disabled,
}) {
  const { t } = useLanguage();
  const previewUrlsRef = useRef([]);
  const [drafts, setDrafts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const paths = useMemo(() => uniqueImagePaths(images), [images]);
  const total = paths.length + drafts.length;
  const atLimit = total >= PRODUCT_IMAGE_MAX;
  const pickerDisabled = disabled || busy || atLimit || !canUpload;

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current) {
        if (url) URL.revokeObjectURL(url);
      }
    };
  }, []);

  function rememberPreview(url) {
    if (url) previewUrlsRef.current.push(url);
    return url;
  }

  function forgetPreview(url) {
    if (!url) return;
    URL.revokeObjectURL(url);
    previewUrlsRef.current = previewUrlsRef.current.filter((item) => item !== url);
  }

  function setImages(next) {
    const unique = uniqueImagePaths(next);
    onChange({
      images: unique,
      image: unique[0] || "",
    });
  }

  function patchDraft(id, patch) {
    setDrafts((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function moveImage(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= paths.length) return;
    const next = paths.slice();
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setImages(next);
  }

  function removeImage(path) {
    setImages(paths.filter((item) => item !== path));
  }

  function removeDraft(id) {
    setDrafts((current) => {
      const item = current.find((draft) => draft.id === id);
      if (item?.previewUrl) forgetPreview(item.previewUrl);
      return current.filter((draft) => draft.id !== id);
    });
  }

  async function onPick(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected.length) return;
    if (!canUpload) {
      setError("FORBIDDEN");
      return;
    }
    if (disabled || busy) return;

    const seen = new Set(drafts.map((draft) => productImageFileKey(draft.file)).filter(Boolean));
    const picked = takeProductImageFiles(selected, total, seen);
    if (!picked.files.length) {
      setError(
        picked.overflow ? "GALLERY_FULL" : picked.invalidCode || (picked.duplicateOnly ? "DUPLICATE_IMAGE" : "BAD_REQUEST"),
      );
      return;
    }
    setError(picked.overflow ? "GALLERY_FULL" : picked.invalidCode);

    const created = picked.files.map((file) => {
      const heic = isHeicLike(file);
      return {
        id: draftId(),
        file,
        name: file.name || t("admin.catalog.fields.images"),
        previewUrl: heic ? null : rememberPreview(URL.createObjectURL(file)),
        status: heic ? "converting" : "uploading",
        error: null,
      };
    });
    setDrafts((current) => [...current, ...created]);
    setBusy(true);

    const nextPaths = paths.slice();
    for (const item of created) {
      try {
        const prepared = await fileForProductUpload(item.file);
        if (!prepared.ok) {
          patchDraft(item.id, { status: "error", error: prepared.code });
          setError(prepared.code);
          continue;
        }
        if (!item.previewUrl) {
          const previewUrl = rememberPreview(URL.createObjectURL(prepared.file));
          patchDraft(item.id, { previewUrl, status: "uploading" });
        } else {
          patchDraft(item.id, { status: "uploading" });
        }
        const result = await upload(prepared.file);
        if (!result?.ok || typeof result.path !== "string") {
          patchDraft(item.id, { status: "error", error: result?.code || "failure" });
          setError(result?.code || "failure");
          continue;
        }
        if (!nextPaths.includes(result.path) && nextPaths.length < PRODUCT_IMAGE_MAX) {
          nextPaths.push(result.path);
          setImages(nextPaths.slice());
        }
        setDrafts((current) => {
          const draft = current.find((entry) => entry.id === item.id);
          if (draft?.previewUrl) forgetPreview(draft.previewUrl);
          return current.filter((entry) => entry.id !== item.id);
        });
      } catch {
        patchDraft(item.id, { status: "error", error: "failure" });
        setError("failure");
      }
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{t("admin.catalog.fields.images")}</p>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          {t("admin.catalog.imageCount").replace("{count}", String(total)).replace("{max}", String(PRODUCT_IMAGE_MAX))}
        </p>
      </div>

      {paths.length || drafts.length ? (
        <ul className="mt-3 space-y-3">
          {paths.map((path, index) => (
            <li key={path} className="flex flex-wrap items-center gap-3 border border-white/8 p-3">
              <img src={mediaUrl(path)} alt="" className="h-16 w-16 bg-ink object-cover" />
              <p className="min-w-0 flex-1 break-all text-xs text-ivory">{imageFileName(path, path)}</p>
              <button type="button" disabled={disabled || busy || index === 0} onClick={() => moveImage(index, -1)} className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40">
                {t("admin.catalog.up")}
              </button>
              <button type="button" disabled={disabled || busy || index === paths.length - 1} onClick={() => moveImage(index, 1)} className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40">
                {t("admin.catalog.down")}
              </button>
              <button type="button" disabled={disabled || busy} onClick={() => removeImage(path)} className="text-[11px] uppercase tracking-[0.16em] text-gold">
                {t("admin.catalog.removeImage")}
              </button>
            </li>
          ))}
          {drafts.map((draft) => (
            <li key={draft.id} className="flex flex-wrap items-center gap-3 border border-white/8 p-3">
              {draft.previewUrl ? (
                <img src={draft.previewUrl} alt="" className="h-16 w-16 bg-ink object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center bg-ink text-[10px] uppercase tracking-[0.12em] text-muted">
                  {draft.status === "converting" ? t("admin.catalog.convertingHeic") : t("admin.catalog.uploading")}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="break-all text-xs text-ivory">{draft.name}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">
                  {draft.status === "converting"
                    ? t("admin.catalog.convertingHeic")
                    : draft.status === "error"
                      ? errorText(t, "admin.catalog", draft.error)
                      : t("admin.catalog.uploading")}
                </p>
              </div>
              <button type="button" disabled={disabled} onClick={() => removeDraft(draft.id)} className="text-[11px] uppercase tracking-[0.16em] text-gold">
                {t("admin.catalog.removeImage")}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">{t("admin.catalog.noImage")}</p>
      )}

      {error ? (
        <p className="mt-2 text-xs text-gold" role="alert">
          {errorText(t, "admin.catalog", error)}
        </p>
      ) : null}

      {canUpload ? (
        <div className="mt-3">
          <label
            className={`relative inline-flex overflow-hidden border border-gold/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory ${
              pickerDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-gold/10"
            }`}
          >
            {busy ? t("admin.catalog.uploading") : t("admin.catalog.chooseImages")}
            <input
              type="file"
              accept={PRODUCT_IMAGE_ACCEPT}
              multiple
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={pickerDisabled}
              onChange={(event) => void onPick(event)}
            />
          </label>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted">{t("admin.catalog.uploadForbidden")}</p>
      )}
      {atLimit ? <p className="mt-2 text-xs text-muted">{t("admin.catalog.imagesFull")}</p> : null}
    </div>
  );
}
