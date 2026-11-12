import { isPlayableGalleryVideo } from "./galleryVideo.js";

export const GALLERY_SYSTEM_FILTERS = ["all", "video"];
export const GALLERY_CATEGORIES = [
  "process",
  "art-of-making",
  "materials",
  "finish",
  "instruments",
];
export const GALLERY_FILTERS = [...GALLERY_SYSTEM_FILTERS, ...GALLERY_CATEGORIES];
export const FALLBACK_GALLERY_CATEGORIES = [
  { slug: "process", sortOrder: 10, isActive: true, translations: { en: { name: "Build process" }, vi: { name: "Quá trình chế tác" } } },
  { slug: "art-of-making", sortOrder: 20, isActive: true, translations: { en: { name: "Art of Making" }, vi: { name: "Nghệ thuật chế tác" } } },
  { slug: "materials", sortOrder: 30, isActive: true, translations: { en: { name: "Materials & wood" }, vi: { name: "Vật liệu & gỗ" } } },
  { slug: "finish", sortOrder: 40, isActive: true, translations: { en: { name: "Finish" }, vi: { name: "Hoàn thiện" } } },
  { slug: "instruments", sortOrder: 50, isActive: true, translations: { en: { name: "Finished guitars" }, vi: { name: "Guitar hoàn thiện" } } },
];

export const GALLERY_IMAGE_MAX = 5;
export const GALLERY_VIDEO_MAX = 5;
export const PUBLIC_GALLERY_PAGE_SIZE = 12;

export { catalogGridRowDividerAfter as galleryGridRowDividerAfter } from "./catalogGrid.js";

export function galleryPostHasVideo(post) {
  const media = Array.isArray(post?.media) ? post.media : [];
  const cover = post?.cover;
  const items = cover ? [...media, cover] : media;
  return items.some((item) => isPlayableGalleryVideo(item));
}

export function filterGalleryPosts(posts, category) {
  const items = Array.isArray(posts) ? posts : [];
  if (!category || category === "all") return items;
  if (category === "video") return items.filter((post) => galleryPostHasVideo(post));
  return items.filter((post) => post.category === category);
}

export function galleryDisplayTime(post) {
  const value = post?.publishedAt;
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function sortGalleryPosts(posts) {
  return [...(Array.isArray(posts) ? posts : [])].sort((a, b) => {
    const pinLeft = a?.pin === true ? 1 : 0;
    const pinRight = b?.pin === true ? 1 : 0;
    if (pinLeft !== pinRight) return pinRight - pinLeft;
    const hasDateLeft = galleryDisplayTime(a) > 0 ? 1 : 0;
    const hasDateRight = galleryDisplayTime(b) > 0 ? 1 : 0;
    if (hasDateLeft !== hasDateRight) return hasDateRight - hasDateLeft;
    const dateDiff = galleryDisplayTime(b) - galleryDisplayTime(a);
    if (dateDiff) return dateDiff;
    return String(b?.id || "").localeCompare(String(a?.id || ""));
  });
}

export function galleryPostCopy(post, language) {
  const locale = language === "en" ? "en" : "vi";
  const fallback = locale === "en" ? "vi" : "en";
  const translations = post?.translations && typeof post.translations === "object" ? post.translations : {};
  const current = translations[locale] && typeof translations[locale] === "object" ? translations[locale] : {};
  const other = translations[fallback] && typeof translations[fallback] === "object" ? translations[fallback] : {};
  const pick = (key) => current[key] || other[key] || post?.[key] || "";
  return {
    title: pick("title"),
    excerpt: pick("excerpt"),
    content: pick("content"),
  };
}

export function galleryCategoryName(category, language) {
  if (!category) return "";
  const current = category.translations?.[language]?.name;
  if (current) return current;
  const other = category.translations?.[language === "vi" ? "en" : "vi"]?.name;
  return other || category.slug || "";
}

export function publicGalleryFilters(categories) {
  const items = (Array.isArray(categories) ? categories : FALLBACK_GALLERY_CATEGORIES)
    .filter((item) => item && item.isActive !== false && item.slug && !GALLERY_SYSTEM_FILTERS.includes(item.slug))
    .slice()
    .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) || String(a.slug).localeCompare(String(b.slug)));
  return [
    { id: "all", slug: "all", system: true },
    { id: "video", slug: "video", system: true },
    ...items.map((item) => ({ id: item.slug, slug: item.slug, system: false, category: item })),
  ];
}

export function editorGalleryCategories(categories, currentSlug) {
  const items = (Array.isArray(categories) ? categories : FALLBACK_GALLERY_CATEGORIES)
    .filter((item) => item && item.slug && !GALLERY_SYSTEM_FILTERS.includes(item.slug))
    .slice()
    .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  if (currentSlug && !items.some((item) => item.slug === currentSlug)) {
    items.push({ slug: currentSlug, isActive: false, translations: {} });
  }
  return items;
}

export function galleryImages(media) {
  return (Array.isArray(media) ? media : []).filter((item) => item?.kind === "image");
}

export function galleryVideos(media) {
  return (Array.isArray(media) ? media : []).filter((item) => item?.kind === "video");
}

export function orderedGalleryImages(post) {
  const images = galleryImages(post?.media);
  const coverId = post?.coverMediaId || post?.cover?.id;
  if (!coverId) return images;
  const cover = images.find((item) => item.id === coverId);
  if (!cover) return images;
  return [cover, ...images.filter((item) => item.id !== coverId)];
}

export function orderedGalleryMedia(post) {
  const items = Array.isArray(post?.media) ? [...post.media] : [];
  items.sort((a, b) => (Number(a?.sortOrder) || 0) - (Number(b?.sortOrder) || 0));
  return items;
}

export function validateGalleryMedia(media) {
  const images = galleryImages(media);
  const videos = galleryVideos(media);
  if (images.length > GALLERY_IMAGE_MAX) return "TOO_MANY_IMAGES";
  if (videos.length > GALLERY_VIDEO_MAX) return "TOO_MANY_VIDEOS";
  return null;
}

export function selectIncomingGalleryFiles(currentMedia, files) {
  const incoming = Array.from(files || []);
  const accepted = [];
  let code = null;
  const currentImages = galleryImages(currentMedia).length;
  const currentVideos = galleryVideos(currentMedia).length;

  for (const file of incoming) {
    const type = String(file?.type || "");
    const isVideo = type.startsWith("video/");
    const isImage = type.startsWith("image/");
    if (!isImage && !isVideo) {
      code = "UNSUPPORTED_MEDIA_TYPE";
      continue;
    }
    const queuedImages = accepted.filter((item) => String(item.type || "").startsWith("image/")).length;
    const queuedVideos = accepted.filter((item) => String(item.type || "").startsWith("video/")).length;
    if (isVideo) {
      if (currentVideos + queuedVideos >= GALLERY_VIDEO_MAX) {
        code = "TOO_MANY_VIDEOS";
        continue;
      }
    } else if (currentImages + queuedImages >= GALLERY_IMAGE_MAX) {
      code = "TOO_MANY_IMAGES";
      continue;
    }
    accepted.push(file);
  }

  return { files: accepted, code };
}

export function emptyGalleryForm() {
  return {
    title: "",
    excerpt: "",
    content: "",
    titleVi: "",
    titleEn: "",
    excerptVi: "",
    excerptEn: "",
    contentVi: "",
    contentEn: "",
    category: "process",
    status: "draft",
    publishedAt: "",
    order: 0,
    coverMediaId: "",
    showAtHome: false,
    pin: false,
    media: [],
  };
}

export function galleryPostPath(id) {
  const slug = String(id || "").trim();
  return slug ? `/gallery/${encodeURIComponent(slug)}` : "/gallery";
}

export function homeGalleryPosts(posts) {
  return sortGalleryPosts((Array.isArray(posts) ? posts : []).filter((post) => Boolean(post?.showAtHome)));
}

export function storyVideo(post) {
  const media = Array.isArray(post?.media) ? post.media : [];
  const fromMedia = media.find((item) => item?.kind === "video");
  if (fromMedia) return fromMedia;
  return post?.cover?.kind === "video" ? post.cover : null;
}

export function storyExcerpt(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^(https?:\/\/|www\.)/i.test(text)) return "";
  return text;
}
