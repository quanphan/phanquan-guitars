import { parseGalleryVideoUrl } from "../data/galleryVideo.js";
import { loadFacebookSdk, requestFacebookAudiblePlayback } from "./facebookSdk.js";

const pool = new Map();

export function facebookVideoHref(raw) {
  const parsed = parseGalleryVideoUrl(raw);
  if (parsed.ok && parsed.provider === "facebook") {
    return parsed.sourceUrl || parsed.watchUrl || String(raw || "").trim();
  }
  return String(raw || "").trim();
}

function playerId(href) {
  let hash = 0;
  const value = facebookVideoHref(href);
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return `fb-warm-${hash.toString(16)}`;
}

function parkHost(host) {
  host.style.cssText =
    "position:fixed;left:0;top:0;width:560px;height:315px;transform:translate(-100%,-100%);overflow:hidden;opacity:0;pointer-events:none;";
  document.body.appendChild(host);
}

export function warmupFacebookVideo(raw) {
  const href = facebookVideoHref(raw);
  if (!href || pool.has(href)) return;
  pool.set(href, { host: null, player: null, pending: true });

  void loadFacebookSdk()
    .then((FB) => {
      if (!FB?.XFBML || !FB?.Event) return;
      const id = playerId(href);
      if (document.getElementById(id)) return;
      const host = document.createElement("div");
      const tag = document.createElement("div");
      tag.id = id;
      tag.className = "fb-video";
      tag.setAttribute("data-href", href);
      tag.setAttribute("data-width", "560");
      tag.setAttribute("data-allowfullscreen", "true");
      tag.setAttribute("data-autoplay", "false");
      tag.setAttribute("data-show-text", "false");
      host.appendChild(tag);
      parkHost(host);

      const onReady = (msg) => {
        if (msg?.type !== "video" || msg.id !== id) return;
        pool.set(href, { host, player: msg.instance, pending: false });
        try {
          FB.Event.unsubscribe("xfbml.ready", onReady);
        } catch {
          /* ignore */
        }
      };
      FB.Event.subscribe("xfbml.ready", onReady);
      FB.XFBML.parse(host);
    })
    .catch(() => {
      pool.delete(href);
    });
}

export function warmupFacebookMedia(media) {
  (Array.isArray(media) ? media : []).forEach((item) => {
    if (item?.kind !== "video") return;
    const href = facebookVideoHref(item.sourceUrl || item.url || item.path);
    if (href && /facebook\.com|fb\.watch/i.test(href)) warmupFacebookVideo(href);
  });
}

export function attachFacebookPlayer(raw, container) {
  const href = facebookVideoHref(raw);
  const entry = pool.get(href);
  if (!href || !container || !entry?.player || !entry.host) return false;
  entry.host.style.cssText = "width:100%;height:100%;";
  container.appendChild(entry.host);
  requestFacebookAudiblePlayback(entry.player);
  return true;
}

export function facebookPlayerIsMuted(raw) {
  const entry = pool.get(facebookVideoHref(raw));
  try {
    return Boolean(entry?.player && typeof entry.player.isMuted === "function" && entry.player.isMuted());
  } catch {
    return false;
  }
}

export function unmuteFacebookPlayer(raw) {
  const entry = pool.get(facebookVideoHref(raw));
  if (!entry?.player) return false;
  return requestFacebookAudiblePlayback(entry.player, { force: true });
}

export function detachFacebookPlayer(raw) {
  const href = facebookVideoHref(raw);
  const entry = pool.get(href);
  if (!entry?.host) return;
  try {
    entry.player?.pause?.();
  } catch {
    /* ignore */
  }
  parkHost(entry.host);
}
