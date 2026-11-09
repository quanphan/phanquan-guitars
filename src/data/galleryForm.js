import { emptyGalleryForm } from "./gallery.js";
import { hydrateGalleryMedia } from "./galleryVideo.js";

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

function localeText(post, locale, key) {
  const block = post?.translations?.[locale];
  return (block && typeof block === "object" && block[key]) || "";
}

export function formFromPost(post) {
  if (!post) return { ...emptyGalleryForm(), publishedAt: todayDateInput() };
  const titleVi = localeText(post, "vi", "title") || post.title || "";
  const titleEn = localeText(post, "en", "title");
  const excerptVi = localeText(post, "vi", "excerpt") || post.excerpt || "";
  const excerptEn = localeText(post, "en", "excerpt");
  const contentVi = localeText(post, "vi", "content") || post.content || "";
  const contentEn = localeText(post, "en", "content");
  return {
    title: titleVi || titleEn,
    excerpt: excerptVi || excerptEn,
    content: contentVi || contentEn,
    titleVi,
    titleEn,
    excerptVi,
    excerptEn,
    contentVi,
    contentEn,
    category: post.category || "process",
    status: post.status || "draft",
    publishedAt: toDateInput(post.publishedAt) || "",
    order: post.order || 0,
    coverMediaId: post.coverMediaId || post.cover?.id || "",
    showAtHome: Boolean(post.showAtHome),
    pin: post.pin === true,
    media: Array.isArray(post.media) ? post.media.map((item) => hydrateGalleryMedia(item)) : [],
  };
}

function formLocale(form, viKey, enKey, legacyKey) {
  const vi = String(form?.[viKey] ?? "");
  const en = String(form?.[enKey] ?? "");
  const legacy = String(form?.[legacyKey] ?? "");
  return {
    vi: vi || (!en ? legacy : ""),
    en,
  };
}

export function payloadFromForm(form) {
  const title = formLocale(form, "titleVi", "titleEn", "title");
  const excerpt = formLocale(form, "excerptVi", "excerptEn", "excerpt");
  const content = formLocale(form, "contentVi", "contentEn", "content");
  return {
    title: title.vi || title.en,
    excerpt: excerpt.vi || excerpt.en,
    content: content.vi || content.en,
    translations: {
      vi: { title: title.vi, excerpt: excerpt.vi, content: content.vi },
      en: { title: title.en, excerpt: excerpt.en, content: content.en },
    },
    category: form.category,
    status: form.status,
    publishedAt: fromDateInput(form.publishedAt),
    order: Number(form.order) || 0,
    coverMediaId: form.coverMediaId,
    showAtHome: Boolean(form.showAtHome),
    pin: form.pin === true,
    media: form.media.map((item, index) => {
      const hydrated = hydrateGalleryMedia(item);
      const sourceUrl = hydrated.sourceUrl || hydrated.url || hydrated.path || "";
      return {
        id: hydrated.id,
        kind: hydrated.kind,
        type: hydrated.kind,
        path: hydrated.path || sourceUrl,
        url: sourceUrl,
        sourceUrl,
        provider: hydrated.provider || (hydrated.kind === "video" ? undefined : "upload"),
        videoId: hydrated.videoId || "",
        thumbnail: hydrated.thumbnail || "",
        sortOrder: index,
        mime: hydrated.mime,
        size: hydrated.size,
        originalName: hydrated.originalName,
      };
    }),
  };
}
