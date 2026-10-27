import ImageUploadField from "../admin/ImageUploadField.jsx";
import Field from "../auth/Field.jsx";
import { mediaUrl } from "../../config/api.js";
import {
  addGalleryImage,
  MAX_GALLERY_IMAGES,
  moveGalleryImage,
  removeGalleryImage,
  SECTION_LAYOUTS,
  SECTION_TYPES,
  updateGalleryImage,
} from "../../data/pageContent.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function SectionEditor({
  section,
  onChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  upload,
  canUpload,
  disabled,
}) {
  const { t } = useLanguage();
  const prefix = `section-${section.id}`;

  function set(field, value) {
    onChange({ ...section, [field]: value });
  }

  const needsImage = ["text-image", "image", "process-step"].includes(section.type);
  const needsCta = section.type === "cta";
  const needsVideo = section.type === "video";
  const needsGallery = section.type === "gallery";

  return (
    <div className="space-y-4 border border-white/10 bg-panel/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{t(`admin.pageContent.types.${section.type}`)}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-ivory/70" disabled={disabled} onClick={onMoveUp}>
            {t("admin.pageContent.moveUp")}
          </button>
          <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-ivory/70" disabled={disabled} onClick={onMoveDown}>
            {t("admin.pageContent.moveDown")}
          </button>
          <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-ivory/70" disabled={disabled} onClick={onDuplicate}>
            {t("admin.pageContent.duplicate")}
          </button>
          <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-gold" disabled={disabled} onClick={onDelete}>
            {t("admin.pageContent.deleteSection")}
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ivory">
        <input
          type="checkbox"
          checked={section.visible !== false}
          disabled={disabled}
          onChange={(event) => set("visible", event.target.checked)}
        />
        {t("admin.pageContent.visible")}
      </label>

      <div>
        <label htmlFor={`${prefix}-type`} className="text-[11px] uppercase tracking-[0.18em] text-gold">
          {t("admin.pageContent.fields.type")}
        </label>
        <select
          id={`${prefix}-type`}
          className="mt-2 w-full border border-white/10 bg-ink px-4 py-3 text-sm text-ivory"
          value={section.type}
          disabled={disabled}
          onChange={(event) => set("type", event.target.value)}
        >
          {SECTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`admin.pageContent.types.${type}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${prefix}-layout`} className="text-[11px] uppercase tracking-[0.18em] text-gold">
          {t("admin.pageContent.fields.layout")}
        </label>
        <select
          id={`${prefix}-layout`}
          className="mt-2 w-full border border-white/10 bg-ink px-4 py-3 text-sm text-ivory"
          value={section.layout || "image-left"}
          disabled={disabled}
          onChange={(event) => set("layout", event.target.value)}
        >
          {SECTION_LAYOUTS.map((layout) => (
            <option key={layout} value={layout}>
              {t(`admin.pageContent.layouts.${layout}`)}
            </option>
          ))}
        </select>
      </div>

      <Field id={`${prefix}-title`} label={t("admin.pageContent.fields.title")} value={section.title} onChange={(value) => set("title", value)} disabled={disabled} maxLength={200} />
      <Field id={`${prefix}-subtitle`} label={t("admin.pageContent.fields.subtitle")} value={section.subtitle} onChange={(value) => set("subtitle", value)} disabled={disabled} maxLength={300} />
      {section.type === "process-step" ? (
        <Field id={`${prefix}-number`} label={t("admin.pageContent.fields.number")} value={section.number} onChange={(value) => set("number", value)} disabled={disabled} maxLength={12} />
      ) : null}
      <Field id={`${prefix}-body`} label={t("admin.pageContent.fields.body")} value={section.body} onChange={(value) => set("body", value)} disabled={disabled} multiline rows={6} maxLength={8000} />
      {section.type === "text-image" || section.type === "quote" || section.type === "text" ? (
        <Field id={`${prefix}-quote`} label={t("admin.pageContent.fields.quote")} value={section.quote} onChange={(value) => set("quote", value)} disabled={disabled} multiline rows={3} maxLength={2000} />
      ) : null}
      {needsCta ? (
        <>
          <Field id={`${prefix}-cta-label`} label={t("admin.pageContent.fields.ctaLabel")} value={section.ctaLabel} onChange={(value) => set("ctaLabel", value)} disabled={disabled} maxLength={80} />
          <Field id={`${prefix}-cta-url`} label={t("admin.pageContent.fields.ctaUrl")} value={section.ctaUrl} onChange={(value) => set("ctaUrl", value)} disabled={disabled} maxLength={500} />
        </>
      ) : null}
      {needsVideo ? (
        <Field id={`${prefix}-video`} label={t("admin.pageContent.fields.videoUrl")} value={section.videoUrl} onChange={(value) => set("videoUrl", value)} disabled={disabled} maxLength={500} />
      ) : null}
      {needsImage ? (
        <>
          <ImageUploadField
            label={t("admin.pageContent.fields.image")}
            storedPath={section.image}
            onUploaded={(path) => set("image", path)}
            onClear={() => set("image", "")}
            upload={upload}
            disabled={disabled}
            canUpload={canUpload}
          />
          <Field id={`${prefix}-alt`} label={t("admin.pageContent.fields.imageAlt")} value={section.imageAlt} onChange={(value) => set("imageAlt", value)} disabled={disabled} maxLength={200} />
        </>
      ) : null}
      {needsGallery ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">{t("admin.pageContent.galleryHint")}</p>
          {(section.images || []).map((item, index) => (
            <div key={`${item.path}-${index}`} className="space-y-3 border border-white/10 p-3">
              {item.path ? (
                <img src={mediaUrl(item.path)} alt={item.alt || ""} className="h-24 w-24 object-cover" />
              ) : null}
              <Field
                id={`${prefix}-gallery-alt-${index}`}
                label={t("admin.pageContent.fields.imageAlt")}
                value={item.alt || ""}
                onChange={(value) => onChange(updateGalleryImage(section, index, { alt: value }))}
                disabled={disabled}
                maxLength={200}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-ivory/70" disabled={disabled} onClick={() => onChange(moveGalleryImage(section, index, -1))}>
                  {t("admin.pageContent.moveUp")}
                </button>
                <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-ivory/70" disabled={disabled} onClick={() => onChange(moveGalleryImage(section, index, 1))}>
                  {t("admin.pageContent.moveDown")}
                </button>
                <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-gold" disabled={disabled} onClick={() => onChange(removeGalleryImage(section, index))}>
                  {t("admin.pageContent.removeImage")}
                </button>
              </div>
            </div>
          ))}
          {(section.images || []).length < MAX_GALLERY_IMAGES ? (
            <ImageUploadField
              label={t("admin.pageContent.addGalleryImage")}
              storedPath=""
              onUploaded={(path) => onChange(addGalleryImage(section, { path, alt: "" }))}
              upload={upload}
              disabled={disabled}
              canUpload={canUpload}
            />
          ) : (
            <p className="text-sm text-muted">{t("admin.pageContent.galleryFull")}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
