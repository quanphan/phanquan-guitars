import Field from "../auth/Field.jsx";
import Button from "../Button.jsx";
import {
  GALLERY_CATEGORIES,
  GALLERY_IMAGE_MAX,
  GALLERY_VIDEO_MAX,
  emptyGalleryForm,
  galleryImages,
  galleryVideos,
} from "../../data/gallery.js";
import { mediaUrl } from "../../config/api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { errorText } from "../../auth/errorText.js";

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

export function todayDateInput() {
  const date = new Date();
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function toDateInput(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function fromDateInput(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function formFromPost(post) {
  if (!post) return { ...emptyGalleryForm(), publishedAt: todayDateInput() };
  return {
    title: post.title || "",
    excerpt: post.excerpt || "",
    content: post.content || "",
    category: post.category || "process",
    status: post.status || "draft",
    publishedAt: toDateInput(post.publishedAt || post.createdAt) || todayDateInput(),
    order: post.order || 0,
    coverMediaId: post.coverMediaId || post.cover?.id || "",
    media: Array.isArray(post.media) ? post.media : [],
  };
}

export function payloadFromForm(form) {
  return {
    title: form.title,
    excerpt: form.excerpt,
    content: form.content,
    category: form.category,
    status: form.status,
    publishedAt: fromDateInput(form.publishedAt),
    order: Number(form.order) || 0,
    coverMediaId: form.coverMediaId,
    media: form.media.map((item) => ({
      id: item.id,
      kind: item.kind,
      path: item.path || item.url,
      url: item.url || item.path,
      mime: item.mime,
      size: item.size,
      originalName: item.originalName,
    })),
  };
}

function MediaThumb({ item }) {
  const src = mediaUrl(item.url || item.path);
  if (item.kind === "video") {
    return <video src={src} muted playsInline preload="metadata" className="h-24 w-32 object-cover bg-ink" />;
  }
  return <img src={src} alt="" className="h-24 w-32 object-cover bg-ink" />;
}

export default function GalleryEditor({
  form,
  setForm,
  editingId,
  uploading,
  uploadProgress,
  pendingUpload,
  saving,
  error,
  onUpload,
  onSave,
  onClose,
  onRemoveMedia,
}) {
  const { t } = useLanguage();

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const images = galleryImages(form.media);
  const videos = galleryVideos(form.media);
  const canAddImages = videos.length === 0 && images.length < GALLERY_IMAGE_MAX;
  const canAddVideos = images.length === 0 && videos.length < GALLERY_VIDEO_MAX;
  const canAddMedia = canAddImages || canAddVideos;
  const accept = [
    canAddImages ? "image/jpeg,image/png,image/webp,image/gif" : "",
    canAddVideos ? "video/mp4,video/webm,video/quicktime" : "",
  ]
    .filter(Boolean)
    .join(",");

  function move(index, delta) {
    setForm((current) => {
      const next = [...current.media];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, media: next };
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/90 px-4 py-10">
      <div className="mx-auto max-w-3xl border border-white/10 bg-ink p-6 lg:p-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {editingId ? t("gallery.edit") : t("gallery.add")}
        </p>
        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <Field
            id="gallery-title"
            label={t("gallery.form.title")}
            value={form.title}
            onChange={(value) => update("title", value)}
            required
            disabled={saving}
          />
          <Field
            id="gallery-excerpt"
            label={t("gallery.form.excerpt")}
            value={form.excerpt}
            onChange={(value) => update("excerpt", value)}
            multiline
            rows={2}
            disabled={saving}
          />
          <Field
            id="gallery-content"
            label={t("gallery.form.content")}
            value={form.content}
            onChange={(value) => update("content", value)}
            multiline
            rows={5}
            disabled={saving}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="gallery-category" className="text-[11px] uppercase tracking-[0.18em] text-gold">
                {t("gallery.form.category")}
              </label>
              <select
                id="gallery-category"
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
                disabled={saving}
                className="mt-2 w-full border border-white/10 bg-ink px-4 py-3 text-sm text-ivory"
              >
                {GALLERY_CATEGORIES.map((id) => (
                  <option key={id} value={id}>
                    {t(`gallery.filters.${id}`)}
                  </option>
                ))}
              </select>
            </div>
            <Field
              id="gallery-date"
              type="date"
              label={t("gallery.form.date")}
              value={form.publishedAt}
              onChange={(value) => update("publishedAt", value)}
              disabled={saving}
            />
            <div>
              <label htmlFor="gallery-status" className="text-[11px] uppercase tracking-[0.18em] text-gold">
                {t("gallery.form.status")}
              </label>
              <select
                id="gallery-status"
                value={form.status}
                onChange={(event) => update("status", event.target.value)}
                disabled={saving}
                className="mt-2 w-full border border-white/10 bg-ink px-4 py-3 text-sm text-ivory"
              >
                <option value="draft">{t("gallery.form.draft")}</option>
                <option value="published">{t("gallery.form.publish")}</option>
              </select>
            </div>
            <Field
              id="gallery-order"
              type="number"
              label={t("gallery.form.order")}
              value={String(form.order)}
              onChange={(value) => update("order", value === "" ? 0 : Number(value))}
              disabled={saving}
            />
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{t("gallery.form.media")}</p>
            <div className="mt-3 space-y-3">
              {form.media.map((item, index) => (
                <div key={item.id} className="flex flex-wrap items-center gap-3 border border-white/10 p-3">
                  <MediaThumb item={item} />
                  {item.kind === "image" ? (
                    <label className="flex items-center gap-2 text-xs text-ivory">
                      <input
                        type="radio"
                        name="cover"
                        checked={form.coverMediaId === item.id}
                        onChange={() => update("coverMediaId", item.id)}
                        className="accent-gold"
                      />
                      {t("gallery.form.cover")}
                    </label>
                  ) : (
                    <p className="text-xs text-muted">{t("gallery.form.videoOnly")}</p>
                  )}
                  <button type="button" className="text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ivory" onClick={() => move(index, -1)}>
                    {t("gallery.form.up")}
                  </button>
                  <button type="button" className="text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ivory" onClick={() => move(index, 1)}>
                    {t("gallery.form.down")}
                  </button>
                  <button type="button" className="text-[11px] uppercase tracking-[0.16em] text-gold" onClick={() => onRemoveMedia(item)}>
                    {t("gallery.form.removeMedia")}
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              {videos.length
                ? t("gallery.form.videoLimit")
                : t("gallery.form.imageLimit")
                    .replace("{count}", String(images.length))
                    .replace("{max}", String(GALLERY_IMAGE_MAX))}
            </p>
            {canAddMedia ? (
              <label className="mt-3 inline-flex cursor-pointer border border-gold/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory hover:bg-gold/10">
                {uploading
                  ? t("gallery.form.uploading")
                      .replace("{current}", String(uploadProgress.current))
                      .replace("{total}", String(uploadProgress.total))
                  : t("gallery.form.addMedia")}
                <input
                  type="file"
                  accept={accept}
                  multiple={canAddImages}
                  className="sr-only"
                  disabled={saving || uploading}
                  onChange={(event) => {
                    const files = [...(event.target.files || [])];
                    event.target.value = "";
                    if (files.length) onUpload(files);
                  }}
                />
              </label>
            ) : images.length >= GALLERY_IMAGE_MAX ? (
              <p className="mt-3 text-xs text-gold">{t("gallery.form.imageFull")}</p>
            ) : null}
            {pendingUpload ? <p className="mt-2 text-xs text-gold">{t("gallery.form.uploaded")}</p> : null}
          </div>

          {error ? (
            <p className="text-sm text-gold" role="alert">
              {error === "SAVE_AFTER_UPLOAD" ? t("gallery.form.saveWarning") : errorText(t, "gallery", error)}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={saving || uploading}>
              {saving ? t("gallery.form.saving") : t("gallery.form.save")}
            </Button>
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              {t("gallery.form.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
