const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;
const IMAGE_PATH = /\.(jpe?g|png|webp|gif)(\?|#|$)/i;
const DIRECT_VIDEO = /\.(mp4|webm)(\?|#|$)/i;
const FACEBOOK_HOSTS = new Set(["facebook.com", "m.facebook.com", "web.facebook.com", "fb.com", "fb.watch"]);
const YOUTUBE_HOSTS = new Set(["youtu.be", "youtube.com", "m.youtube.com", "youtube-nocookie.com"]);
const VIMEO_HOSTS = new Set(["vimeo.com", "player.vimeo.com"]);

function parseHttpUrl(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return parsed;
}

function hostOf(parsed) {
  return parsed.hostname.replace(/^www\./i, "").toLowerCase();
}

function youtubeResult(id, sourceUrl) {
  return {
    ok: true,
    kind: "video",
    provider: "youtube",
    videoId: id,
    url: sourceUrl,
    sourceUrl,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

function parseYouTube(parsed, sourceUrl) {
  const host = hostOf(parsed);
  if (!YOUTUBE_HOSTS.has(host)) return null;
  let id = "";
  if (host === "youtu.be") {
    id = parsed.pathname.split("/").filter(Boolean)[0] || "";
  } else {
    id = parsed.searchParams.get("v") || "";
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (!id && ["embed", "shorts", "live", "v"].includes(parts[0])) id = parts[1] || "";
  }
  id = String(id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 11);
  if (!YOUTUBE_ID.test(id)) return { ok: false, code: "INVALID_VIDEO_URL" };
  return youtubeResult(id, sourceUrl);
}

function parseVimeo(parsed, sourceUrl) {
  const host = hostOf(parsed);
  if (!VIMEO_HOSTS.has(host)) return null;
  const parts = parsed.pathname.split("/").filter(Boolean);
  const id =
    host === "player.vimeo.com" && parts[0] === "video"
      ? parts[1] || ""
      : [...parts].reverse().find((part) => VIMEO_ID.test(part)) || "";
  if (!VIMEO_ID.test(id)) return { ok: false, code: "INVALID_VIDEO_URL" };
  return {
    ok: true,
    kind: "video",
    provider: "vimeo",
    videoId: id,
    url: sourceUrl,
    sourceUrl,
    embedUrl: `https://player.vimeo.com/video/${id}`,
    watchUrl: `https://vimeo.com/${id}`,
    thumbnail: "",
  };
}

const FACEBOOK_ID = /^(PFBID[a-zA-Z0-9]+|\d{8,}|[A-Za-z0-9_-]{5,})$/;
const FACEBOOK_RESERVED = new Set(["watch", "videos", "reel", "reels", "video", "share", "plugins", "video.php"]);

function isFacebookToken(value) {
  const token = String(value || "");
  if (!token || FACEBOOK_RESERVED.has(token.toLowerCase())) return false;
  return FACEBOOK_ID.test(token);
}

function facebookVideoId(parsed) {
  const parts = parsed.pathname.split("/").filter(Boolean);
  const fromQuery = parsed.searchParams.get("v") || parsed.searchParams.get("reel_id") || "";
  if (isFacebookToken(fromQuery)) return fromQuery;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index].toLowerCase();
    const next = parts[index + 1] || "";
    if (["videos", "reel", "reels", "video", "v", "r"].includes(part) && isFacebookToken(next)) {
      return next;
    }
  }
  if (hostOf(parsed) === "fb.watch" && isFacebookToken(parts[0] || "")) return parts[0];
  const last = parts[parts.length - 1] || "";
  return isFacebookToken(last) ? last : "";
}

function isFacebookVideoPath(parsed) {
  const host = hostOf(parsed);
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (host === "fb.watch") return isFacebookToken(parts[0] || "");
  const path = parsed.pathname.toLowerCase();
  if (/\/video\.php$/i.test(path)) return isFacebookToken(parsed.searchParams.get("v") || "");
  if (parts[0]?.toLowerCase() === "watch") return isFacebookToken(parsed.searchParams.get("v") || "");
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index].toLowerCase();
    const next = parts[index + 1] || "";
    if (["videos", "reel", "reels", "video", "v", "r"].includes(part) && isFacebookToken(next)) return true;
  }
  return false;
}

function facebookCanonicalHref(parsed, sourceUrl) {
  const host = hostOf(parsed);
  const id = facebookVideoId(parsed);
  const path = parsed.pathname.toLowerCase();
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (host === "fb.watch") {
    return id ? `https://fb.watch/${id}/` : sourceUrl;
  }
  if ((path.includes("/reel/") || path.includes("/reels/")) && id) {
    return `https://www.facebook.com/reel/${id}`;
  }
  if (path.includes("/videos/") && id) {
    const page = parts[0] && parts[1] && parts[1].toLowerCase() === "videos" ? parts[0] : "";
    return page ? `https://www.facebook.com/${page}/videos/${id}/` : `https://www.facebook.com/watch/?v=${id}`;
  }
  if (path.includes("/share/v/") && id) return `https://www.facebook.com/share/v/${id}/`;
  if (path.includes("/share/r/") && id) return `https://www.facebook.com/share/r/${id}/`;
  if (id && /^\d+$/.test(id)) return `https://www.facebook.com/watch/?v=${id}`;
  try {
    const copy = new URL(parsed.href);
    copy.hash = "";
    if (host !== "fb.watch") copy.hostname = "www.facebook.com";
    copy.protocol = "https:";
    return copy.href;
  } catch {
    return sourceUrl;
  }
}

function facebookEmbedUrl(href) {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(href)}&show_text=false&width=560&height=315&t=0`;
}

function parseFacebook(parsed, sourceUrl) {
  const host = hostOf(parsed);
  if (!FACEBOOK_HOSTS.has(host)) return null;
  if (parsed.pathname.toLowerCase().includes("/plugins/video.php")) {
    const nested = parsed.searchParams.get("href");
    if (!nested) return { ok: false, code: "INVALID_VIDEO_URL" };
    return parseGalleryVideoUrl(nested);
  }
  if (!isFacebookVideoPath(parsed)) return { ok: false, code: "UNSUPPORTED_VIDEO_URL" };
  const id = facebookVideoId(parsed);
  const embedHref = facebookCanonicalHref(parsed, sourceUrl);
  return {
    ok: true,
    kind: "video",
    provider: "facebook",
    videoId: id,
    url: sourceUrl,
    sourceUrl,
    embedUrl: facebookEmbedUrl(embedHref),
    watchUrl: sourceUrl,
    thumbnail: "",
  };
}

export function parseGalleryVideoUrl(raw, { expectedProvider } = {}) {
  const sourceUrl = String(raw || "").trim();
  if (!sourceUrl) return { ok: false, code: "VIDEO_URL_REQUIRED" };
  if (/<\s*iframe[\s>]/i.test(sourceUrl) || /<\s*script[\s>]/i.test(sourceUrl)) {
    return { ok: false, code: "UNSUPPORTED_VIDEO_URL" };
  }
  const parsed = parseHttpUrl(sourceUrl);
  if (!parsed) return { ok: false, code: "INVALID_VIDEO_URL" };

  const detected =
    parseYouTube(parsed, sourceUrl) ||
    parseFacebook(parsed, sourceUrl) ||
    parseVimeo(parsed, sourceUrl);

  if (detected) {
    if (detected.ok === false) return detected;
    const expected = expectedProvider && expectedProvider !== "auto" ? expectedProvider : "";
    if (expected && detected.provider !== expected) {
      return { ok: false, code: "PROVIDER_MISMATCH" };
    }
    return detected;
  }

  if (DIRECT_VIDEO.test(parsed.pathname)) {
    if (expectedProvider && expectedProvider !== "auto" && expectedProvider !== "direct") {
      return { ok: false, code: "PROVIDER_MISMATCH" };
    }
    return {
      ok: true,
      kind: "video",
      provider: "direct",
      videoId: "",
      url: sourceUrl,
      sourceUrl,
      embedUrl: "",
      watchUrl: sourceUrl,
      thumbnail: "",
    };
  }

  return { ok: false, code: "UNSUPPORTED_VIDEO_URL" };
}

export function resolveGalleryVideo(item) {
  if (!item || item.kind === "image") return { ok: false, code: "INVALID_VIDEO_URL" };
  const source = String(item.sourceUrl || item.url || item.path || "").trim();
  const parsed = parseGalleryVideoUrl(source);
  if (parsed.ok) {
    return {
      ...parsed,
      videoId: item.videoId || parsed.videoId,
      thumbnail: item.thumbnail || parsed.thumbnail,
    };
  }
  if (item.provider === "youtube" && YOUTUBE_ID.test(String(item.videoId || ""))) {
    return youtubeResult(item.videoId, source || `https://www.youtube.com/watch?v=${item.videoId}`);
  }
  return parsed;
}

export function galleryVideoEmbedSrc(item, { autoplay = false } = {}) {
  const resolved = item?.embedUrl && item?.provider ? item : resolveGalleryVideo(item);
  const provider = resolved.provider || item?.provider;
  const id = String(resolved.videoId || item?.videoId || "");
  let src = "";
  if (provider === "youtube" && YOUTUBE_ID.test(id)) {
    src = `https://www.youtube-nocookie.com/embed/${id}`;
  } else if (provider === "vimeo" && VIMEO_ID.test(id)) {
    src = `https://player.vimeo.com/video/${id}`;
  } else if (provider === "facebook") {
    src = resolved.embedUrl || "";
    if (!src) {
      const href = resolved.sourceUrl || resolved.url || item?.sourceUrl || item?.url || item?.path || "";
      const parsed = parseGalleryVideoUrl(href);
      if (parsed.ok && parsed.provider === "facebook") src = parsed.embedUrl;
    }
  } else if (resolved.ok && resolved.embedUrl) {
    src = resolved.embedUrl;
  }
  if (!src) return "";
  if (!autoplay) return src;
  if (provider === "facebook") {
    const parsed = new URL(src);
    parsed.searchParams.set("autoplay", "1");
    parsed.searchParams.delete("muted");
    parsed.searchParams.set("mute", "0");
    return parsed.toString();
  }
  return src.includes("?") ? `${src}&autoplay=1` : `${src}?autoplay=1`;
}

export function galleryWatchUrl(item) {
  const resolved = resolveGalleryVideo(item);
  if (resolved.ok && resolved.watchUrl) return resolved.watchUrl;
  const url = String(item?.sourceUrl || item?.url || item?.path || "");
  const parsed = parseHttpUrl(url);
  return parsed ? parsed.href : "";
}

export function isExternalGalleryVideo(item) {
  const provider = item?.provider || resolveGalleryVideo(item).provider;
  return item?.kind === "video" && ["youtube", "vimeo", "facebook", "direct"].includes(provider);
}

export function galleryDirectVideoPath(item) {
  if (!item || item.kind === "image") return "";
  if (galleryVideoEmbedSrc(item)) return "";
  const resolved = resolveGalleryVideo(item);
  const isUpload = item.provider === "upload" || String(item.path || item.url || "").startsWith("/uploads/");
  if (resolved.provider === "direct" || isUpload) {
    return String(item.sourceUrl || item.url || item.path || "").trim();
  }
  return "";
}

export function galleryUploadMime(path) {
  const value = String(path || "").toLowerCase();
  if (/\.webm(\?|#|$)/i.test(value)) return "video/webm";
  if (/\.(mp4|m4v|mov)(\?|#|$)/i.test(value)) return "video/mp4";
  if (/\.(jpe?g)(\?|#|$)/i.test(value)) return "image/jpeg";
  if (/\.png(\?|#|$)/i.test(value)) return "image/png";
  if (/\.webp(\?|#|$)/i.test(value)) return "image/webp";
  if (/\.gif(\?|#|$)/i.test(value)) return "image/gif";
  return "";
}

export function galleryVideoPreviewSrc(src) {
  const value = String(src || "").trim();
  if (!value || value.includes("#")) return value;
  return `${value}#t=0.001`;
}

export function isPlayableGalleryVideo(item) {
  if (!item || item.kind === "image") return false;
  if (galleryVideoEmbedSrc(item) || galleryDirectVideoPath(item)) return true;
  return resolveGalleryVideo(item).ok === true;
}

export function normalizeThumbnailUrl(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  if (/^\/uploads\/gallery\/images\/[a-f0-9]{32}\.(jpg|png|webp|gif)$/i.test(trimmed)) return trimmed;
  const parsed = parseHttpUrl(trimmed);
  if (!parsed || !IMAGE_PATH.test(parsed.pathname)) return "";
  return parsed.href;
}

export function galleryPosterUrl(item, resolve = (value) => value) {
  const custom = normalizeThumbnailUrl(item?.thumbnail) || "";
  if (custom) return resolve(custom);
  const resolved = resolveGalleryVideo(item);
  if (resolved.ok && resolved.thumbnail) return resolved.thumbnail;
  if (item?.kind === "image") return resolve(item.url || item.path || "");
  return "";
}

export function hydrateGalleryMedia(item) {
  if (!item || typeof item !== "object") return item;
  const sourceUrl = String(item.sourceUrl || item.url || item.path || "").trim();
  const resolved = item.kind === "video" ? parseGalleryVideoUrl(sourceUrl) : null;
  return {
    ...item,
    sourceUrl,
    url: sourceUrl,
    path: item.path || sourceUrl,
    provider: resolved?.ok
      ? resolved.provider
      : item.provider || (item.kind === "image" ? "upload" : ""),
    videoId: item.videoId || (resolved?.ok ? resolved.videoId : "") || "",
    thumbnail: item.thumbnail || (resolved?.ok ? resolved.thumbnail : "") || "",
  };
}

export function newGalleryMediaId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
