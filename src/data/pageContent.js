import { tFor } from "../i18n/translations.js";

export const PAGE_KEYS = ["about", "build-process"];
export const PAGE_LANGUAGES = ["en", "vi"];
export const SECTION_TYPES = [
  "hero",
  "text",
  "image",
  "text-image",
  "quote",
  "cta",
  "process-step",
  "gallery",
  "video",
];
export const SECTION_LAYOUTS = ["image-left", "image-right", "center"];
export const MAX_GALLERY_IMAGES = 8;

export function isPageKey(value) {
  return PAGE_KEYS.includes(value);
}

export function emptyLocale() {
  return { title: "", sections: [] };
}

export function emptySection(type = "text") {
  const allowed = SECTION_TYPES.includes(type) ? type : "text";
  return {
    id: `section-${Math.random().toString(36).slice(2, 10)}`,
    type: allowed,
    visible: true,
    title: "",
    subtitle: "",
    body: "",
    quote: "",
    image: "",
    imageAlt: "",
    images: [],
    videoUrl: "",
    ctaLabel: "",
    ctaUrl: allowed === "cta" ? "/custom-build" : "",
    layout: allowed === "hero" || allowed === "cta" || allowed === "quote" ? "center" : "image-left",
    number: "",
  };
}

function copyValue(t, language, key) {
  const value = tFor(language, key);
  if (!value || value === key) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join("\n\n");
  return String(value);
}

export function splitParagraphs(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  return value.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

export function defaultLocaleContent(pageKey, language) {
  if (pageKey === "build-process") {
    const stages = [
      { id: "craft", number: "01" },
      { id: "wood", number: "02" },
      { id: "construction", number: "03" },
      { id: "finish", number: "04" },
      { id: "setup", number: "05" },
      { id: "delivery", number: "06" },
    ];
    return {
      title: copyValue(tFor, language, "process.title"),
      sections: [
        {
          ...emptySection("hero"),
          id: "process-hero",
          title: copyValue(tFor, language, "process.title"),
          subtitle: copyValue(tFor, language, "process.eyebrow"),
          body: copyValue(tFor, language, "process.description"),
          layout: "center",
        },
        ...stages.map((stage, index) => ({
          ...emptySection("process-step"),
          id: `process-${stage.id}`,
          title: copyValue(tFor, language, `process.stages.${stage.id}.title`),
          subtitle: copyValue(tFor, language, `process.stages.${stage.id}.tagline`),
          body: [
            copyValue(tFor, language, `process.stages.${stage.id}.body`),
            copyValue(tFor, language, `process.stages.${stage.id}.closing`),
          ]
            .filter(Boolean)
            .join("\n\n"),
          imageAlt: copyValue(tFor, language, `process.stages.${stage.id}.imageAlt`),
          number: stage.number,
          layout: index % 2 === 1 ? "image-right" : "image-left",
        })),
        {
          ...emptySection("cta"),
          id: "process-cta",
          title: copyValue(tFor, language, "process.cta.title"),
          body: copyValue(tFor, language, "process.cta.body"),
          ctaLabel: copyValue(tFor, language, "process.cta.button"),
          ctaUrl: "/custom-build",
          layout: "center",
        },
      ],
    };
  }

  return {
    title: copyValue(tFor, language, "about.title"),
    sections: [
      {
        ...emptySection("hero"),
        id: "about-hero",
        title: copyValue(tFor, language, "about.title"),
        subtitle: copyValue(tFor, language, "about.eyebrow"),
        body: copyValue(tFor, language, "about.lede"),
        layout: "center",
      },
      {
        ...emptySection("text-image"),
        id: "about-opening",
        body: copyValue(tFor, language, "about.opening"),
        imageAlt: copyValue(tFor, language, "about.images.wood"),
        layout: "image-left",
      },
      {
        ...emptySection("text-image"),
        id: "about-turning",
        title: copyValue(tFor, language, "about.turningPoint.title"),
        body: [copyValue(tFor, language, "about.turningPoint.body"), copyValue(tFor, language, "about.turningPoint.after")]
          .filter(Boolean)
          .join("\n\n"),
        quote: copyValue(tFor, language, "about.turningPoint.quote"),
        imageAlt: copyValue(tFor, language, "about.images.instrument"),
        layout: "image-right",
      },
      {
        ...emptySection("text-image"),
        id: "about-craft",
        title: copyValue(tFor, language, "about.craft.title"),
        body: copyValue(tFor, language, "about.craft.body"),
        imageAlt: copyValue(tFor, language, "about.images.workshop"),
        layout: "image-left",
      },
      {
        ...emptySection("text"),
        id: "about-philosophy",
        title: copyValue(tFor, language, "about.philosophy.title"),
        subtitle: copyValue(tFor, language, "about.philosophy.signature"),
        body: copyValue(tFor, language, "about.philosophy.body"),
        layout: "center",
      },
      {
        ...emptySection("cta"),
        id: "about-cta",
        title: copyValue(tFor, language, "about.cta.title"),
        body: copyValue(tFor, language, "about.cta.body"),
        ctaLabel: copyValue(tFor, language, "about.cta.button"),
        ctaUrl: "/custom-build",
        layout: "center",
      },
    ],
  };
}

export function localeFromRecord(record, language, pageKey) {
  const locale = record?.locales?.[language] || record?.draft?.[language] || record?.published?.[language];
  if (locale && Array.isArray(locale.sections) && locale.sections.length) {
    return {
      title: locale.title || "",
      sections: locale.sections.map((section) => ({ ...emptySection(section.type), ...section })),
    };
  }
  return defaultLocaleContent(pageKey, language);
}

export function visibleSections(locale) {
  return (locale?.sections || []).filter((section) => section && section.visible !== false);
}

export function moveSection(sections, index, direction) {
  const next = [...(sections || [])];
  const target = index + direction;
  if (index < 0 || target < 0 || index >= next.length || target >= next.length) return next;
  const swap = next[index];
  next[index] = next[target];
  next[target] = swap;
  return next;
}

export function duplicateSection(sections, index) {
  const next = [...(sections || [])];
  const source = next[index];
  if (!source) return next;
  next.splice(index + 1, 0, { ...source, id: `${source.id}-copy-${Math.random().toString(36).slice(2, 8)}` });
  return next;
}

export function publicPagePath(pageKey) {
  return pageKey === "build-process" ? "/build-process" : "/about";
}

export function addGalleryImage(section, item) {
  const images = Array.isArray(section?.images) ? [...section.images] : [];
  const path = typeof item?.path === "string" ? item.path.trim() : "";
  if (!path || images.length >= MAX_GALLERY_IMAGES) return section;
  return { ...section, images: [...images, { path, alt: typeof item.alt === "string" ? item.alt : "" }] };
}

export function updateGalleryImage(section, index, patch) {
  const images = Array.isArray(section?.images) ? section.images.map((item) => ({ ...item })) : [];
  if (!images[index]) return section;
  images[index] = { ...images[index], ...patch };
  return { ...section, images };
}

export function removeGalleryImage(section, index) {
  const images = Array.isArray(section?.images) ? section.images.filter((_, current) => current !== index) : [];
  return { ...section, images };
}

export function moveGalleryImage(section, index, direction) {
  return { ...section, images: moveSection(section?.images || [], index, direction) };
}
