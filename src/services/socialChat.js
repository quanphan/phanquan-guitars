const MME_TEXT_LIMIT = 1500;

function hostOf(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function isMessengerChatUrl(value) {
  const host = hostOf(value);
  if (!host) return false;
  if (host === "m.me" || host === "messenger.com") return true;
  if (host === "facebook.com") {
    try {
      return new URL(value).pathname.toLowerCase().startsWith("/messages/");
    } catch {
      return false;
    }
  }
  return false;
}

export function isFacebookProfileUrl(value) {
  const host = hostOf(value);
  if (host !== "facebook.com") return false;
  return !isMessengerChatUrl(value);
}

export function supportsMessengerPrefill(value) {
  const host = hostOf(value);
  return host === "m.me" || host === "messenger.com";
}

export function chatUrlWithPrefill(url, message) {
  const trimmed = String(url || "").trim();
  const text = String(message || "");
  if (!trimmed || !text || !supportsMessengerPrefill(trimmed)) return trimmed;
  try {
    const target = new URL(trimmed);
    if (target.searchParams.has("text")) return trimmed;
    const clipped = text.length > MME_TEXT_LIMIT ? text.slice(0, MME_TEXT_LIMIT) : text;
    target.searchParams.set("text", clipped);
    return target.toString();
  } catch {
    return trimmed;
  }
}

export function copyTextSynchronously(text) {
  if (typeof document === "undefined") return false;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.focus();
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  return copied;
}

export async function copyTextWithClipboardApi(text) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("clipboard-unavailable");
  }
  await navigator.clipboard.writeText(text);
}
