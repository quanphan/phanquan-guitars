export function decodeLocationHash(hash) {
  if (!hash || hash === "#") return "";
  const raw = String(hash).startsWith("#") ? String(hash).slice(1) : String(hash);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function resolveScrollAction({ navigationType, pathnameChanged, hash, savedY }) {
  const id = decodeLocationHash(hash);
  if (id) return { type: "hash", id };
  if (!pathnameChanged) return { type: "preserve" };
  if (navigationType === "POP" && typeof savedY === "number") {
    return { type: "restore", y: savedY };
  }
  return { type: "top" };
}

export function applyScrollAction(action, root = typeof window !== "undefined" ? window : null, doc = typeof document !== "undefined" ? document : null) {
  if (!root || !action || action.type === "preserve") return;

  const scrollToY = (y) => {
    if (typeof root.scrollTo === "function") {
      try {
        root.scrollTo({ top: y, left: 0, behavior: "instant" });
        return;
      } catch {
        /* Safari without scroll options */
      }
      root.scrollTo(0, y);
      return;
    }
    if (doc?.documentElement) doc.documentElement.scrollTop = y;
    if (doc?.body) doc.body.scrollTop = y;
  };

  if (action.type === "restore") {
    scrollToY(action.y);
    return;
  }
  if (action.type === "top") {
    scrollToY(0);
    return;
  }
  if (action.type === "hash") {
    const el = doc?.getElementById?.(action.id);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "start", behavior: "auto" });
      return;
    }
    scrollToY(0);
  }
}
