export const FALLBACK_FOOTER_LINKS = [
  { url: "/custom-build", linkType: "internal", openInNewTab: false, titleKey: "footer.startBuild" },
  { url: "/contact", linkType: "internal", openInNewTab: false, titleKey: "footer.contact" },
];

export function footerLinkLocale(link, language) {
  if (!link || typeof link !== "object") return {};
  const current = link.translations?.[language];
  if (current && typeof current === "object") return current;
  const other = link.translations?.[language === "vi" ? "en" : "vi"];
  return other && typeof other === "object" ? other : {};
}

export function mergePublicFooterLinks(apiItems) {
  const list = Array.isArray(apiItems) ? apiItems.filter((item) => item && item.url) : [];
  if (list.length) {
    return [...list].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  return FALLBACK_FOOTER_LINKS.map((item, index) => ({
    id: item.url,
    url: item.url,
    linkType: "internal",
    openInNewTab: false,
    titleKey: item.titleKey,
    sortOrder: index,
    translations: {},
  }));
}

export function isInternalFooterPath(value) {
  const url = String(value || "").trim();
  if (!url.startsWith("/") || url.startsWith("//") || url.includes("\\") || /[\s<>"]/.test(url)) {
    return false;
  }
  return !/^[a-z][a-z0-9+.-]*:/i.test(url);
}
