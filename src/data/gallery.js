export const GALLERY_CATEGORIES = [
  "process",
  "materials",
  "finish",
  "instruments",
  "video",
];

export const GALLERY_FILTERS = ["all", ...GALLERY_CATEGORIES];

export const GALLERY_IMAGE_MAX = 5;
export const GALLERY_VIDEO_MAX = 1;

export function filterGalleryPosts(posts, category) {
  const items = Array.isArray(posts) ? posts : [];
  if (!category || category === "all") return items;
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

export function validateGalleryMedia(media) {
  const images = galleryImages(media);
  const videos = galleryVideos(media);
  if (images.length > GALLERY_IMAGE_MAX) return "TOO_MANY_IMAGES";
  if (videos.length > GALLERY_VIDEO_MAX) return "TOO_MANY_VIDEOS";
  if (images.length > 0 && videos.length > 0) return "MIXED_MEDIA";
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
      if (currentImages + queuedImages > 0) {
        code = "MIXED_MEDIA";
        continue;
      }
      if (currentVideos + queuedVideos >= GALLERY_VIDEO_MAX) {
        code = "TOO_MANY_VIDEOS";
        continue;
      }
    } else {
      if (currentVideos + queuedVideos > 0) {
        code = "MIXED_MEDIA";
        continue;
      }
      if (currentImages + queuedImages >= GALLERY_IMAGE_MAX) {
        code = "TOO_MANY_IMAGES";
        continue;
      }
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
    media: [],
  };
}
