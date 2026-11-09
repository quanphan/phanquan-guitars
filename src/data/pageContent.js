import { tFor } from "../i18n/translations.js";

export const PAGE_KEYS = ["about", "build-process", "services", "contact"];
export const SERVICES_EXPERTISE_SECTION_ID = "services-expertise";
export const CONTACT_HERO_SECTION_ID = "contact-hero";
export const SHARED_IMAGE_FIELDS = ["image", "imageSecondary"];
export const SHARED_MEDIA_FIELDS = [...SHARED_IMAGE_FIELDS, "videoUrl"];
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
    imageSecondary: "",
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
  if (pageKey === "contact") {
    return {
      title: copyValue(tFor, language, "contact.title"),
      sections: [
        {
          ...emptySection("image"),
          id: CONTACT_HERO_SECTION_ID,
          title: copyValue(tFor, language, "contact.title"),
          imageAlt: copyValue(tFor, language, "contact.imageAlt"),
        },
      ],
    };
  }
  if (pageKey === "services") {
    return {
      title: copyValue(tFor, language, "services.intro.title"),
      sections: [
        {
          ...emptySection("image"),
          id: SERVICES_EXPERTISE_SECTION_ID,
          title: copyValue(tFor, language, "services.expertise.title"),
          imageAlt: copyValue(tFor, language, "services.expertise.imageAlt"),
        },
      ],
    };
  }
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

export function localeHasContent(locale) {
  if (!locale || typeof locale !== "object") return false;
  if (typeof locale.title === "string" && locale.title.trim()) return true;
  return Array.isArray(locale.sections) && locale.sections.length > 0;
}

export function normalizeLocaleContent(locale) {
  return {
    title: typeof locale?.title === "string" ? locale.title : "",
    sections: Array.isArray(locale?.sections)
      ? locale.sections.map((section) => ({ ...emptySection(section.type), ...section }))
      : [],
  };
}

export function siblingLanguage(language) {
  return language === "vi" ? "en" : "vi";
}

export function siblingLocaleFromRecord(record, language) {
  const other = siblingLanguage(language);
  const candidates = [record?.draft?.[other], record?.published?.[other], record?.locales?.[other]];
  return candidates.find((item) => localeHasContent(item)) || null;
}

export function localeFromRecord(record, language, pageKey) {
  const locale = record?.locales?.[language] || record?.draft?.[language] || record?.published?.[language];
  const base = localeHasContent(locale)
    ? normalizeLocaleContent(locale)
    : defaultLocaleContent(pageKey, language);
  return mergeSharedSectionMedia(base, siblingLocaleFromRecord(record, language));
}

export function editorLocaleFromDocument(document, language, pageKey) {
  const draft = document?.draft?.[language];
  if (localeHasContent(draft)) {
    return {
      locale: mergeSharedSectionMedia(normalizeLocaleContent(draft), siblingLocaleFromRecord(document, language)),
      source: "draft",
    };
  }
  const published = document?.published?.[language];
  if (localeHasContent(published)) {
    return {
      locale: mergeSharedSectionMedia(normalizeLocaleContent(published), siblingLocaleFromRecord(document, language)),
      source: "published",
    };
  }
  return {
    locale: mergeSharedSectionMedia(defaultLocaleContent(pageKey, language), siblingLocaleFromRecord(document, language)),
    source: "fallback",
  };
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
  if (pageKey === "build-process") return "/build-process";
  if (pageKey === "services") return "/services";
  if (pageKey === "contact") return "/contact";
  return "/about";
}

export function setSectionImage(locale, sectionId, field, path) {
  if (!SHARED_IMAGE_FIELDS.includes(field)) return locale;
  const sections = Array.isArray(locale?.sections) ? locale.sections : [];
  const nextPath = typeof path === "string" ? path : "";
  const exists = sections.some((section) => section.id === sectionId);
  const nextSections = exists
    ? sections.map((section) => (section.id === sectionId ? { ...section, [field]: nextPath } : section))
    : [...sections, { ...emptySection("image"), id: sectionId, [field]: nextPath }];
  return { ...locale, sections: nextSections };
}

function galleryItems(value) {
  return Array.isArray(value)
    ? value.map((item) => ({ path: typeof item?.path === "string" ? item.path : "", alt: typeof item?.alt === "string" ? item.alt : "" })).filter((item) => item.path)
    : [];
}

function copyGalleryMedia(sourceImages, targetImages, overwrite) {
  const source = galleryItems(sourceImages);
  const target = galleryItems(targetImages);
  if (!overwrite && target.length) return target;
  return source.map((item, index) => ({
    path: item.path,
    alt: target[index]?.alt || item.alt || "",
  }));
}

export function applySharedSectionMedia(sourceLocale, targetLocale, { overwrite = true } = {}) {
  const sourceSections = Array.isArray(sourceLocale?.sections) ? sourceLocale.sections : [];
  const targetSections = Array.isArray(targetLocale?.sections) ? targetLocale.sections.map((section) => ({ ...section })) : [];
  for (const source of sourceSections) {
    const index = targetSections.findIndex((section) => section.id === source.id);
    if (index === -1 && !overwrite) continue;
    const current = index === -1 ? { ...emptySection(source.type || "image"), id: source.id, type: source.type || "image" } : targetSections[index];
    const patch = { ...current };
    for (const field of SHARED_MEDIA_FIELDS) {
      const nextValue = typeof source[field] === "string" ? source[field] : "";
      const currentValue = typeof current[field] === "string" ? current[field] : "";
      patch[field] = overwrite || !currentValue.trim() ? nextValue : currentValue;
    }
    patch.images = copyGalleryMedia(source.images, current.images, overwrite);
    if (index === -1) targetSections.push(patch);
    else targetSections[index] = patch;
  }
  return { ...targetLocale, title: targetLocale?.title || "", sections: targetSections };
}

export function copySharedSectionImages(sourceLocale, targetLocale) {
  return applySharedSectionMedia(sourceLocale, targetLocale, { overwrite: true });
}

export function mergeSharedSectionMedia(targetLocale, sourceLocale) {
  if (!sourceLocale || !Array.isArray(sourceLocale.sections) || !sourceLocale.sections.length) {
    return targetLocale;
  }
  return applySharedSectionMedia(sourceLocale, targetLocale, { overwrite: false });
}

export function storedSectionImage(locale, sectionId, field, fallback) {
  const section = (locale?.sections || []).find((item) => item.id === sectionId);
  const path = section?.[field];
  if (typeof path === "string" && path.trim()) {
    return { src: path, srcSet: undefined, stored: true };
  }
  return { ...fallback, stored: false };
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
