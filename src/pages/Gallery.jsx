import { useCallback, useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/admin/ConfirmDialog.jsx";
import GalleryEditor, { formFromPost, payloadFromForm, todayDateInput } from "../components/gallery/GalleryEditor.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Reveal from "../components/Reveal.jsx";
import Button from "../components/Button.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { mediaUrl } from "../config/api.js";
import {
  GALLERY_FILTERS,
  emptyGalleryForm,
  filterGalleryPosts,
  orderedGalleryImages,
  selectIncomingGalleryFiles,
  validateGalleryMedia,
} from "../data/gallery.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import {
  deleteGalleryPost,
  listAdminGallery,
  listPublicGallery,
  saveGalleryPost,
  uploadGalleryMedia,
} from "../services/galleryService.js";

function formatDate(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", { dateStyle: "medium" }).format(date);
}

function MainMedia({ item, className }) {
  if (!item) {
    return <div className={`aspect-[4/5] w-full border border-white/10 bg-ink/50 ${className || ""}`} aria-hidden="true" />;
  }
  const src = mediaUrl(item.url);
  if (item.kind === "video") {
    return (
      <video src={src} muted playsInline preload="metadata" className={`aspect-[4/5] w-full bg-ink object-contain ${className || ""}`} />
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className={`aspect-[4/5] w-full bg-ink object-contain object-center ${className || ""}`}
    />
  );
}

function GalleryItem({ post, isAdmin, language, t, onOpen, onEdit, onDelete }) {
  const images = orderedGalleryImages(post);
  const video = (post.media || []).find((item) => item.kind === "video");
  const cover = post.cover || post.media?.[0];
  const isVideoPost = cover?.kind === "video" || (Boolean(video) && images.length === 0);
  const [selectedId, setSelectedId] = useState(images[0]?.id || "");
  const selected = images.find((item) => item.id === selectedId) || images[0] || null;
  const main = isVideoPost ? video : selected;

  function openAt(item) {
    const index = Math.max(0, (post.media || []).findIndex((entry) => entry.id === item?.id));
    onOpen({ post, index });
  }

  return (
    <article className="group">
      <button type="button" className="block w-full text-left" onClick={() => openAt(main)}>
        <MainMedia item={main} />
      </button>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="text-xs text-muted">{formatDate(post.publishedAt || post.createdAt, language)}</p>
        {!isVideoPost && images.length > 1 ? (
          <div
            className="ml-auto flex justify-end gap-2 overflow-x-auto pb-1 sm:flex-wrap"
            role="listbox"
            aria-label={post.title}
          >
            {images.map((item) => {
              const active = (selected?.id || images[0]?.id) === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setSelectedId(item.id)}
                  className={`h-[3.2rem] w-[3.2rem] shrink-0 overflow-hidden border bg-ink sm:h-[2.8rem] sm:w-[2.8rem] ${
                    active ? "border-gold" : "border-white/15 hover:border-ivory/50"
                  }`}
                >
                  <img src={mediaUrl(item.url)} alt="" className="h-full w-full object-contain" />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {post.status === "draft" ? (
        <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-gold">{t("gallery.draft")}</p>
      ) : null}
      <h2 className={`${post.status === "draft" ? "mt-2" : "mt-4"} font-display text-2xl tracking-wide text-ivory`}>{post.title}</h2>
      {post.excerpt ? <p className="mt-2 text-sm leading-relaxed text-muted">{post.excerpt}</p> : null}
      {isAdmin ? (
        <div className="mt-4 flex gap-4">
          <button type="button" className="text-[11px] uppercase tracking-[0.16em] text-gold" onClick={onEdit}>
            {t("gallery.edit")}
          </button>
          <button type="button" className="text-[11px] uppercase tracking-[0.16em] text-ivory/70 hover:text-gold" onClick={onDelete}>
            {t("gallery.delete")}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function Lightbox({ post, index, onClose, onMove, t }) {
  const item = post.media?.[index];
  if (!item) return null;
  const src = mediaUrl(item.url);
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-charcoal/90 px-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-5xl">
        {item.kind === "video" ? (
          <video src={src} controls autoPlay className="max-h-[70vh] w-full bg-ink" />
        ) : (
          <img src={src} alt={post.title} className="max-h-[70vh] w-full object-contain" />
        )}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ivory">{post.title}</h2>
            {post.content || post.excerpt ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{post.content || post.excerpt}</p>
            ) : null}
          </div>
          <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-gold" onClick={onClose}>
            {t("guitars.gallery.close")}
          </button>
        </div>
        {post.media.length > 1 ? (
          <div className="mt-4 flex gap-3">
            <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-ivory/80 hover:text-gold" onClick={() => onMove(-1)}>
              {t("guitars.gallery.prev")}
            </button>
            <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-ivory/80 hover:text-gold" onClick={() => onMove(1)}>
              {t("guitars.gallery.next")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Gallery() {
  const { t, language } = useLanguage();
  const { isAdmin, authorizedRequest, authorizedFormRequest } = useAuth();
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyGalleryForm);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [pendingUpload, setPendingUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingMedia, setPendingMedia] = useState(null);
  const [viewer, setViewer] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const listed = isAdmin
      ? await listAdminGallery(authorizedRequest, { limit: 50 })
      : await listPublicGallery({ limit: 50 });
    if (!listed.ok) {
      setItems([]);
      setError(listed.code);
      setLoading(false);
      return;
    }
    setItems(listed.items);
    setLoading(false);
  }, [authorizedRequest, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!viewer) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setViewer(null);
      if (event.key === "ArrowRight") {
        setViewer((current) => {
          if (!current) return current;
          const total = current.post.media?.length || 1;
          return { ...current, index: (current.index + 1) % total };
        });
      }
      if (event.key === "ArrowLeft") {
        setViewer((current) => {
          if (!current) return current;
          const total = current.post.media?.length || 1;
          return { ...current, index: (current.index - 1 + total) % total };
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer]);

  const visible = useMemo(() => filterGalleryPosts(items, filter), [filter, items]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyGalleryForm(), publishedAt: todayDateInput() });
    setPendingUpload(false);
    setSaveError(null);
    setEditorOpen(true);
  }

  function openEdit(post) {
    setEditingId(post.id);
    setForm(formFromPost(post));
    setPendingUpload(false);
    setSaveError(null);
    setEditorOpen(true);
  }

  async function onUpload(files) {
    const selected = selectIncomingGalleryFiles(form.media, files);
    if (selected.code) setSaveError(selected.code);
    if (!selected.files.length) return;
    setUploading(true);
    if (!selected.code) setSaveError(null);
    setUploadProgress({ current: 0, total: selected.files.length });
    const uploaded = [];
    for (let index = 0; index < selected.files.length; index += 1) {
      setUploadProgress({ current: index + 1, total: selected.files.length });
      const result = await uploadGalleryMedia(authorizedFormRequest, selected.files[index]);
      if (!result.ok) {
        setUploading(false);
        setSaveError(result.code);
        if (uploaded.length) setPendingUpload(true);
        return;
      }
      uploaded.push(result.media);
    }
    setForm((current) => {
      const media = [...current.media, ...uploaded];
      return {
        ...current,
        media,
        coverMediaId: current.coverMediaId || media[0]?.id || "",
      };
    });
    setPendingUpload(true);
    setUploading(false);
  }

  async function onSave() {
    const mediaError = validateGalleryMedia(form.media);
    if (mediaError) {
      setSaveError(mediaError);
      return;
    }
    setSaving(true);
    setSaveError(null);
    const result = await saveGalleryPost(authorizedRequest, payloadFromForm(form), editingId);
    setSaving(false);
    if (!result.ok) {
      setSaveError(pendingUpload ? "SAVE_AFTER_UPLOAD" : result.code);
      return;
    }
    setPendingUpload(false);
    setEditorOpen(false);
    await load();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const result = await deleteGalleryPost(authorizedRequest, pendingDelete.id);
    if (!result.ok) {
      setError(result.code);
      setPendingDelete(null);
      return;
    }
    setPendingDelete(null);
    await load();
  }

  return (
    <section className="pb-24">
      <PageHeader eyebrow={t("gallery.eyebrow")} title={t("gallery.title")} description={t("gallery.description")}>
        {isAdmin ? (
          <div className="mt-8">
            <Button type="button" onClick={openCreate}>
              {t("gallery.add")}
            </Button>
          </div>
        ) : null}
      </PageHeader>

      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap gap-3 px-6 lg:px-10" role="tablist" aria-label={t("gallery.title")}>
        {GALLERY_FILTERS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`text-[11px] uppercase tracking-[0.18em] ${
              filter === id ? "text-gold" : "text-ivory/70 hover:text-ivory"
            }`}
          >
            {t(`gallery.filters.${id}`)}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-7xl px-6 lg:px-10">
        {error ? <p className="text-sm text-gold">{t("gallery.unavailable")}</p> : null}
        {loading ? <p className="text-sm text-muted">{t("gallery.loading")}</p> : null}
        {!loading && !error && visible.length === 0 ? (
          <p className="text-sm text-muted">{filter === "all" ? t("gallery.empty") : t("gallery.emptyFilter")}</p>
        ) : null}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((post) => (
            <Reveal key={post.id}>
              <GalleryItem
                post={post}
                isAdmin={isAdmin}
                language={language}
                t={t}
                onOpen={setViewer}
                onEdit={() => openEdit(post)}
                onDelete={() => setPendingDelete(post)}
              />
            </Reveal>
          ))}
        </div>
      </div>

      {viewer ? (
        <Lightbox
          post={viewer.post}
          index={viewer.index}
          t={t}
          onClose={() => setViewer(null)}
          onMove={(delta) => {
            const total = viewer.post.media?.length || 1;
            setViewer((current) => ({
              ...current,
              index: ((current.index + delta) % total + total) % total,
            }));
          }}
        />
      ) : null}

      {editorOpen ? (
        <GalleryEditor
          form={form}
          setForm={setForm}
          editingId={editingId}
          uploading={uploading}
          uploadProgress={uploadProgress}
          pendingUpload={pendingUpload}
          saving={saving}
          error={saveError}
          onUpload={onUpload}
          onSave={() => void onSave()}
          onClose={() => setEditorOpen(false)}
          onRemoveMedia={(item) => setPendingMedia(item)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("gallery.confirmDelete.title")}
        body={t("gallery.confirmDelete.body")}
        confirmLabel={t("gallery.confirmDelete.confirm")}
        cancelLabel={t("gallery.confirmDelete.cancel")}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
      <ConfirmDialog
        open={Boolean(pendingMedia)}
        title={t("gallery.confirmMedia.title")}
        body={t("gallery.confirmMedia.body")}
        confirmLabel={t("gallery.confirmMedia.confirm")}
        cancelLabel={t("gallery.confirmMedia.cancel")}
        onConfirm={() => {
          setForm((current) => {
            const media = current.media.filter((item) => item.id !== pendingMedia.id);
            return {
              ...current,
              media,
              coverMediaId: current.coverMediaId === pendingMedia.id ? media[0]?.id || "" : current.coverMediaId,
            };
          });
          setPendingMedia(null);
        }}
        onCancel={() => setPendingMedia(null)}
      />
    </section>
  );
}
