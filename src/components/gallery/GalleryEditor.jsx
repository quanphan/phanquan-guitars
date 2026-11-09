import { useState } from "react";
import Field from "../auth/Field.jsx";
import Button from "../Button.jsx";
import {
  GALLERY_IMAGE_MAX,
  GALLERY_VIDEO_MAX,
  editorGalleryCategories,
  galleryCategoryName,
  galleryImages,
  galleryVideos,
} from "../../data/gallery.js";
import { formFromPost, payloadFromForm, todayDateInput } from "../../data/galleryForm.js";
import { hydrateGalleryMedia, newGalleryMediaId, parseGalleryVideoUrl } from "../../data/galleryVideo.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { errorText } from "../../auth/errorText.js";
import GalleryMediaPlayer from "./GalleryMediaPlayer.jsx";
import GalleryMediaThumb from "./GalleryMediaThumb.jsx";

export { formFromPost, payloadFromForm, todayDateInput };

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
  onUploadPoster,
  onSave,
  onClose,
  onRemoveMedia,
  categories = [],
}) {
  const { t, language } = useLanguage();
  const [mediaType, setMediaType] = useState("image");
  const [videoProvider, setVideoProvider] = useState("auto");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoThumb, setVideoThumb] = useState("");
  const [videoError, setVideoError] = useState(null);
  const [preview, setPreview] = useState(null);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const images = galleryImages(form.media);
  const videos = galleryVideos(form.media);
  const canAddImages = images.length < GALLERY_IMAGE_MAX;
  const canAddVideos = videos.length < GALLERY_VIDEO_MAX;
  const canAddMedia = canAddImages || canAddVideos;
  const accept = [
    canAddImages ? "image/jpeg,image/png,image/webp,image/gif" : "",
    canAddVideos ? "video/mp4,video/webm,video/quicktime" : "",
  ]
    .filter(Boolean)
    .join(",");

  function addExternalVideo() {
    if (!canAddVideos) {
      setVideoError("TOO_MANY_VIDEOS");
      return;
    }
    const parsed = parseGalleryVideoUrl(videoUrl, { expectedProvider: videoProvider });
    if (!parsed.ok) {
      setVideoError(parsed.code);
      setPreview(null);
      return;
    }
    const item = {
      id: newGalleryMediaId(),
      kind: "video",
      provider: parsed.provider,
      videoId: parsed.videoId,
      url: parsed.sourceUrl,
      sourceUrl: parsed.sourceUrl,
      path: parsed.sourceUrl,
      thumbnail: videoThumb.trim() || parsed.thumbnail,
      sortOrder: form.media.length,
    };
    setForm((current) => ({
      ...current,
      media: [...current.media, item],
      coverMediaId: current.coverMediaId || item.id,
    }));
    setVideoUrl("");
    setVideoThumb("");
    setVideoError(null);
    setPreview(item);
  }

  function previewUrl() {
    const parsed = parseGalleryVideoUrl(videoUrl, { expectedProvider: videoProvider });
    if (!parsed.ok) {
      setVideoError(parsed.code);
      setPreview(null);
      return;
    }
    setVideoError(null);
    setPreview({
      id: "preview",
      kind: "video",
      provider: parsed.provider,
      videoId: parsed.videoId,
      url: parsed.sourceUrl,
      sourceUrl: parsed.sourceUrl,
      path: parsed.sourceUrl,
      thumbnail: videoThumb.trim() || parsed.thumbnail,
    });
  }

  function updateMedia(id, patch) {
    setForm((current) => ({
      ...current,
      media: current.media.map((entry) => (entry.id === id ? hydrateGalleryMedia({ ...entry, ...patch }) : entry)),
    }));
  }

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
                {editorGalleryCategories(categories, form.category).map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {galleryCategoryName(item, language) || item.slug}
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

          <label className="flex items-start gap-3 text-sm leading-relaxed text-ivory">
            <input
              id="gallery-pin"
              type="checkbox"
              checked={form.pin === true}
              onChange={(event) => update("pin", event.target.checked)}
              disabled={saving}
              className="mt-1 size-4 shrink-0 accent-gold"
            />
            <span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                {t("gallery.form.pin")}
              </span>
              <span className="mt-1 block text-sm text-muted">{t("gallery.form.pinHelp")}</span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm leading-relaxed text-ivory">
            <input
              id="gallery-show-at-home"
              type="checkbox"
              checked={Boolean(form.showAtHome)}
              onChange={(event) => update("showAtHome", event.target.checked)}
              disabled={saving}
              className="mt-1 size-4 shrink-0 accent-gold"
            />
            <span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                {t("gallery.form.showAtHome")}
              </span>
              <span className="mt-1 block text-sm text-muted">{t("gallery.form.showAtHomeHelp")}</span>
            </span>
          </label>

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{t("gallery.form.media")}</p>
            <p className="mt-2 text-xs text-muted">{t("gallery.form.mediaHelp")}</p>
            <div className="mt-3 space-y-3">
              {form.media.map((item, index) => (
                <div key={item.id} className="border border-white/10 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <GalleryMediaThumb item={item} className="h-24 w-32 shrink-0" compact />
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
                  {item.kind === "video" && item.provider !== "upload" ? (
                    <div className="mt-3 space-y-3">
                      <Field
                        id={`gallery-source-${item.id}`}
                        label={t("gallery.form.videoUrl")}
                        value={item.sourceUrl || item.url || ""}
                        onChange={(value) => updateMedia(item.id, { sourceUrl: value, url: value, path: value })}
                        disabled={saving}
                      />
                      <Field
                        id={`gallery-thumb-${item.id}`}
                        label={t("gallery.form.thumbnail")}
                        value={item.thumbnail || ""}
                        onChange={(value) => updateMedia(item.id, { thumbnail: value })}
                        disabled={saving}
                      />
                      {item.provider === "facebook" && onUploadPoster ? (
                        <label className="inline-flex cursor-pointer border border-gold/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory hover:bg-gold/10">
                          {t("gallery.form.uploadPoster")}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="sr-only"
                            disabled={saving || uploading}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = "";
                              if (!file) return;
                              void onUploadPoster(file).then((path) => {
                                if (path) updateMedia(item.id, { thumbnail: path });
                              });
                            }}
                          />
                        </label>
                      ) : null}
                      <GalleryMediaPlayer item={item} title={form.title} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              {t("gallery.form.imageLimit")
                .replace("{count}", String(images.length))
                .replace("{max}", String(GALLERY_IMAGE_MAX))}
              {" · "}
              {t("gallery.form.videoCount")
                .replace("{count}", String(videos.length))
                .replace("{max}", String(GALLERY_VIDEO_MAX))}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="gallery-media-type" className="text-[11px] uppercase tracking-[0.18em] text-gold">
                  {t("gallery.form.mediaType")}
                </label>
                <select
                  id="gallery-media-type"
                  value={mediaType}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (
                      mediaType === "external" &&
                      next === "image" &&
                      (videoUrl.trim() || preview) &&
                      !window.confirm(t("gallery.form.confirmSwitchMedia"))
                    ) {
                      return;
                    }
                    if (next === "image") {
                      setVideoUrl("");
                      setVideoThumb("");
                      setVideoError(null);
                      setPreview(null);
                    }
                    setMediaType(next);
                  }}
                  disabled={saving}
                  className="mt-2 w-full border border-white/10 bg-ink px-4 py-3 text-sm text-ivory"
                >
                  <option value="image">{t("gallery.form.mediaTypeImage")}</option>
                  <option value="external">{t("gallery.form.mediaTypeVideo")}</option>
                </select>
              </div>
              {mediaType === "external" ? (
                <div>
                  <label htmlFor="gallery-video-provider" className="text-[11px] uppercase tracking-[0.18em] text-gold">
                    {t("gallery.form.videoProvider")}
                  </label>
                  <select
                    id="gallery-video-provider"
                    value={videoProvider}
                    onChange={(event) => setVideoProvider(event.target.value)}
                    disabled={saving}
                    className="mt-2 w-full border border-white/10 bg-ink px-4 py-3 text-sm text-ivory"
                  >
                    <option value="auto">{t("gallery.form.providerAuto")}</option>
                    <option value="youtube">{t("gallery.form.providerYoutube")}</option>
                    <option value="facebook">{t("gallery.form.providerFacebook")}</option>
                  </select>
                </div>
              ) : null}
            </div>

            {mediaType === "image" && canAddMedia ? (
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
            ) : null}
            {mediaType === "image" && !canAddMedia ? (
              <p className="mt-3 text-xs text-gold">{t("gallery.form.mediaFull")}</p>
            ) : null}
            {pendingUpload ? <p className="mt-2 text-xs text-gold">{t("gallery.form.uploaded")}</p> : null}

            {mediaType === "external" && canAddVideos ? (
              <div className="mt-6 space-y-3 border border-white/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{t("gallery.form.externalVideo")}</p>
                <Field
                  id="gallery-video-url"
                  label={t("gallery.form.videoUrl")}
                  value={videoUrl}
                  onChange={(value) => {
                    setVideoUrl(value);
                    setVideoError(null);
                  }}
                  disabled={saving}
                />
                <Field
                  id="gallery-video-thumb"
                  label={t("gallery.form.thumbnailOptional")}
                  value={videoThumb}
                  onChange={setVideoThumb}
                  disabled={saving}
                />
                {onUploadPoster ? (
                  <label className="inline-flex cursor-pointer border border-gold/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory hover:bg-gold/10">
                    {t("gallery.form.uploadPoster")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={saving || uploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        void onUploadPoster(file).then((path) => {
                          if (path) setVideoThumb(path);
                        });
                      }}
                    />
                  </label>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" disabled={saving} onClick={previewUrl}>
                    {t("gallery.form.previewVideo")}
                  </Button>
                  <Button type="button" disabled={saving} onClick={addExternalVideo}>
                    {t("gallery.form.addVideo")}
                  </Button>
                </div>
                {videoError ? (
                  <p className="text-sm text-gold" role="alert">
                    {errorText(t, "gallery", videoError)}
                  </p>
                ) : null}
                {preview ? <GalleryMediaPlayer item={preview} title={form.title} className="mt-3" /> : null}
              </div>
            ) : null}
            {mediaType === "external" && !canAddVideos ? (
              <p className="mt-3 text-xs text-gold">{t("gallery.form.videoLimit")}</p>
            ) : null}
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
