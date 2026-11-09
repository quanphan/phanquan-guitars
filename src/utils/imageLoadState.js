/** Browser image element status used by ContentImage. */

export function imageElementStatus(img) {
  if (!img) return "empty";
  if (img.complete && img.naturalWidth > 0) return "ready";
  if (img.complete) return "broken";
  return "loading";
}

export function shouldIgnoreImageError(img) {
  if (!img || img.isConnected === false) return true;
  const attr = img.getAttribute("src");
  return !attr;
}

export function restartImageLoad(img, src) {
  if (!img || typeof src !== "string" || !src) return false;
  if (img.getAttribute("src") === src) {
    img.removeAttribute("src");
  }
  img.setAttribute("src", src);
  return true;
}
