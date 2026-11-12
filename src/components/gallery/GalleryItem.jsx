import { useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import ProductPinToggle from "../admin/ProductPinToggle.jsx";
import { CatalogCardShell } from "../cards/CatalogCardFrame.jsx";
import { catalogCard } from "../cards/catalogCardChrome.js";
import { galleryPostCopy, galleryPostPath, orderedGalleryMedia } from "../../data/gallery.js";
import GalleryMediaThumb from "./GalleryMediaThumb.jsx";

function formatDate(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", { dateStyle: "medium" }).format(date);
}

const GALLERY_IMAGE_FRAME = "aspect-[4/3] w-full shrink-0 overflow-hidden bg-ink";

export default function GalleryItem({ post, isAdmin, language, t, onOpen, onEdit, onDelete, onPin, pinSaving }) {
  const copy = galleryPostCopy(post, language);
  const media = orderedGalleryMedia(post);
  const cover = post.cover || media[0];
  const [selectedId, setSelectedId] = useState(cover?.id || media[0]?.id || "");
  const selected = media.find((item) => item.id === selectedId) || media[0] || null;
  const href = galleryPostPath(post.id);
  const isDraft = post.status === "draft";

  function openAt(item) {
    const index = Math.max(0, media.findIndex((entry) => entry.id === item?.id));
    flushSync(() => onOpen({ post: { ...post, media }, index }));
  }

  return (
    <CatalogCardShell className="cursor-default">
      <div className="flex w-full shrink-0 flex-col gap-3">
        <div className={GALLERY_IMAGE_FRAME}>
          {selected?.kind === "video" ? (
            <div className={`h-full w-full ${catalogCard.image}`}>
              <GalleryMediaThumb
                item={selected}
                className="h-full w-full"
                alt={copy.title || ""}
                onPlay={() => openAt(selected)}
                playLabel={t("gallery.video.play")}
              />
            </div>
          ) : (
            <button type="button" className={`block h-full w-full text-left ${catalogCard.image}`} onClick={() => openAt(selected)}>
              <GalleryMediaThumb item={selected} className="h-full w-full" alt={copy.title || ""} />
            </button>
          )}
        </div>
        {media.length > 1 ? (
          <div
            className="flex justify-end gap-1.5 overflow-x-auto px-6"
            role="listbox"
            aria-label={copy.title}
          >
            {media.map((item) => {
              const active = (selected?.id || media[0]?.id) === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setSelectedId(item.id)}
                  className={`h-10 w-10 shrink-0 overflow-hidden border bg-ink ${
                    active ? "border-gold" : "border-white/15 hover:border-ivory/50"
                  }`}
                >
                  <GalleryMediaThumb item={item} className="h-full w-full" alt="" compact />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col px-6 pb-6 pt-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
          {formatDate(post.publishedAt, language) || "\u00a0"}
        </p>
        {isDraft ? (
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-gold">{t("gallery.draft")}</p>
        ) : null}
        <h2 className={`${isDraft ? "mt-2" : "mt-3"} line-clamp-2 font-display text-2xl leading-tight tracking-wide sm:text-3xl`}>
          <Link
            to={href}
            className="text-ivory transition-colors duration-300 hover:text-gold focus-visible:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            {copy.title}
          </Link>
        </h2>
        {isAdmin ? (
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <ProductPinToggle
              pinned={post.pin === true}
              saving={pinSaving}
              label={post.pin === true ? t("gallery.pinned") : t("gallery.pin")}
              onToggle={onPin}
            />
            <button type="button" className="text-[11px] uppercase tracking-[0.16em] text-gold" onClick={onEdit}>
              {t("gallery.edit")}
            </button>
            <button type="button" className="text-[11px] uppercase tracking-[0.16em] text-ivory/70 hover:text-gold" onClick={onDelete}>
              {t("gallery.delete")}
            </button>
          </div>
        ) : null}
      </div>
    </CatalogCardShell>
  );
}
