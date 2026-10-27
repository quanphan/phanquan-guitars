import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function PageContentToolbar({
  preview = false,
  editing = false,
  dirty = false,
  saving = false,
  status = "",
  onEdit,
  onCancel,
  onSaveDraft,
  onPublish,
  onPreview,
  onExitPreview,
}) {
  const { t } = useLanguage();

  return (
    <div className="sticky top-0 z-40 border-b border-gold/30 bg-ink/95">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-3 lg:px-10">
        {preview ? (
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("admin.pageContent.previewBanner")}</p>
        ) : null}
        {dirty ? <p className="text-xs text-gold">{t("admin.pageContent.unsaved")}</p> : null}
        {status ? <p className="text-xs text-muted">{status}</p> : null}
        <div className="ml-auto flex flex-wrap gap-2">
          {!editing && !preview && onEdit ? (
            <button type="button" className="border border-gold/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-gold" onClick={onEdit}>
              {t("admin.pageContent.editPage")}
            </button>
          ) : null}
          {preview && onExitPreview ? (
            <button type="button" className="border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory" onClick={onExitPreview}>
              {t("admin.pageContent.exitPreview")}
            </button>
          ) : null}
          {editing ? (
            <>
              <button type="button" disabled={saving} className="border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory" onClick={onCancel}>
                {t("admin.cancel")}
              </button>
              {onPreview ? (
                <button type="button" disabled={saving || dirty} className="border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory disabled:opacity-40" onClick={onPreview}>
                  {t("admin.pageContent.preview")}
                </button>
              ) : null}
              <button type="button" disabled={saving} className="border border-gold/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-gold" onClick={onSaveDraft}>
                {saving ? t("admin.pageContent.saving") : t("admin.pageContent.saveDraft")}
              </button>
              <button type="button" disabled={saving} className="border border-gold bg-gold px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-charcoal" onClick={onPublish}>
                {t("admin.pageContent.publish")}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
