import { useState } from "react";
import { storedFileName, validateGlbFile } from "../../data/wizardOptionModel.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function GlbUploadField({
  label,
  help,
  storedPath,
  onUploaded,
  onClear,
  upload,
  disabled,
  canUpload,
}) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fileName = storedFileName(storedPath);

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !canUpload) return;
    setError(null);
    const valid = await validateGlbFile(file);
    if (!valid.ok) {
      setError(valid.code);
      return;
    }
    setBusy(true);
    const result = await upload(file);
    setBusy(false);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    onUploaded(result.path);
  }

  function errorMessage(code) {
    const wizardKey = `admin.wizardSetup.errors.${code}`;
    const wizard = t(wizardKey);
    if (wizard && wizard !== wizardKey) return wizard;
    const catalogKey = `admin.catalog.errors.${code}`;
    const catalog = t(catalogKey);
    if (catalog && catalog !== catalogKey) return catalog;
    return t("admin.wizardSetup.errors.failure");
  }

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{label}</p>
      {help ? <p className="mt-2 text-xs leading-relaxed text-muted">{help}</p> : null}
      {fileName ? (
        <p className="mt-3 break-all text-sm text-ivory">{fileName}</p>
      ) : (
        <p className="mt-3 text-sm text-muted">{t("admin.wizardSetup.noGlb")}</p>
      )}
      {storedPath ? <p className="mt-1 break-all text-xs text-muted">{storedPath}</p> : null}
      {error ? (
        <p className="mt-2 text-xs text-gold" role="alert">
          {errorMessage(error)}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-3">
        {canUpload ? (
          <label className="inline-flex cursor-pointer border border-gold/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory hover:bg-gold/10">
            {busy
              ? t("admin.catalog.uploading")
              : storedPath
                ? t("admin.wizardSetup.replaceGlb")
                : t("admin.wizardSetup.chooseGlb")}
            <input
              type="file"
              accept=".glb,model/gltf-binary"
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
            onClick={() => {
              setError(null);
              onClear();
            }}
            className="text-[11px] uppercase tracking-[0.18em] text-gold"
          >
            {t("admin.wizardSetup.clearGlb")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
