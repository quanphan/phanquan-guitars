import { isPlayableGalleryVideo } from "./galleryVideo.js";

export const GALLERY_CATEGORIES = [
  "process",
  "art-of-making",
  "materials",
  "finish",
  "instruments",
  "video",
];

export const GALLERY_FILTERS = ["all", ...GALLERY_CATEGORIES];

export const GALLERY_IMAGE_MAX = 5;
export const GALLERY_VIDEO_MAX = 5;

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
    category: "process",
    status: "draft",
    publishedAt: "",
    order: 0,
    coverMediaId: "",
    showAtHome: false,
    media: [],
  };
}

export function galleryPostPath(id) {
  const slug = String(id || "").trim();
  return slug ? `/gallery/${encodeURIComponent(slug)}` : "/gallery";
}

export function homeGalleryPosts(posts) {
  return (Array.isArray(posts) ? posts : []).filter((post) => Boolean(post?.showAtHome));
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
