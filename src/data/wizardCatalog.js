const CATEGORY_LIST_KEYS = {
  "instrument-type": "instrumentTypes",
  series: "series",
  "body-shape": "shapes",
  scale: "scales",
  "string-count": "stringCounts",
  radius: "radii",
  "body-wood": "bodyWoods",
  "top-wood": "topWoods",
  "neck-wood": "neckWoods",
  "neck-construction": "neckConstructions",
  fingerboard: "fingerboardWoods",
  "neck-profile": "neckProfiles",
  "fret-spec": "fretSpecs",
  "pickup-config": "pickupConfigs",
  pickups: "pickupTypes",
  bridge: "bridges",
  tuners: "tuners",
  hardware: "hardwareFinishes",
  electronics: "controlLayouts",
  "finish-type": "finishTypes",
  "finish-color": "finishColors",
  inlay: "inlays",
  engraving: "engravings",
};

export const COMPATIBILITY_FIELDS = [
  { key: "instrumentTypeIds", categoryId: "instrument-type" },
  { key: "seriesIds", categoryId: "series" },
  { key: "shapeIds", categoryId: "body-shape" },
  { key: "scaleIds", categoryId: "scale" },
  { key: "stringCounts", categoryId: "string-count" },
  { key: "bodyWoodIds", categoryId: "body-wood" },
  { key: "topWoodIds", categoryId: "top-wood" },
  { key: "neckWoodIds", categoryId: "neck-wood" },
  { key: "neckConstructionIds", categoryId: "neck-construction" },
  { key: "fingerboardWoodIds", categoryId: "fingerboard" },
  { key: "pickupConfigIds", categoryId: "pickup-config" },
  { key: "pickupTypeIds", categoryId: "pickups" },
  { key: "bridgeIds", categoryId: "bridge" },
  { key: "finishTypeIds", categoryId: "finish-type" },
];

export function optionAlias(option, categoryId) {
  if (!option) return "";
  if (option.attributes?.wizardId) return String(option.attributes.wizardId);
  if (option.code) return option.code;
  const prefix = `${categoryId}.`;
  if (typeof option.id === "string" && option.id.startsWith(prefix)) return option.id.slice(prefix.length);
  return option.id;
}

export function optionMatchesAlias(option, categoryId, value) {
  const needle = String(value);
  const aliases = [
    optionAlias(option, categoryId),
    option.id,
    option.code,
    option.attributes?.wizardId,
    option.attributes?.value,
  ]
    .filter((item) => item != null && item !== "")
    .map(String);
  return aliases.includes(needle);
}

export const LIST_CATEGORY_IDS = Object.fromEntries(
  Object.entries(CATEGORY_LIST_KEYS).map(([categoryId, listKey]) => [listKey, categoryId]),
);

export const WIZARD_SETUP_GROUPS = [
  { id: "instrument-type", step: 1 },
  { id: "series", step: 1 },
  { id: "body-shape", step: 1 },
  { id: "scale", step: 1 },
  { id: "string-count", step: 1 },
  { id: "radius", step: 1 },
  { id: "body-wood", step: 2 },
  { id: "top-wood", step: 2 },
  { id: "neck-wood", step: 3 },
  { id: "neck-construction", step: 3 },
  { id: "fingerboard", step: 3 },
  { id: "neck-profile", step: 3 },
  { id: "fret-spec", step: 3 },
  { id: "pickup-config", step: 4 },
  { id: "pickups", step: 4 },
  { id: "bridge", step: 4 },
  { id: "tuners", step: 4 },
  { id: "hardware", step: 4 },
  { id: "electronics", step: 4 },
  { id: "finish-type", step: 5 },
  { id: "finish-color", step: 5 },
  { id: "inlay", step: 5 },
  { id: "engraving", step: 5 },
];

function toWizardOption(option) {
  const attributes = option.attributes && typeof option.attributes === "object" ? option.attributes : {};
  const compatibility = option.compatibility && typeof option.compatibility === "object" && !Array.isArray(option.compatibility)
    ? option.compatibility
    : {};
  const id = attributes.wizardId || option.code || option.id;
  const mapped = {
    ...compatibility,
    ...attributes,
    id,
    optionId: option.id,
    code: option.code || id,
    name: option.name,
    description: option.description,
    translations: option.translations,
    image: option.imagePath || attributes.image || null,
    icon: option.icon || attributes.icon || "",
    active: option.active !== false,
    isDefault: Boolean(option.isDefault),
    defaultForInstrumentTypeIds: Array.isArray(option.defaultForInstrumentTypeIds)
      ? option.defaultForInstrumentTypeIds
      : [],
    sortOrder: option.sortOrder || 0,
    kind: attributes.kind,
    value: attributes.value,
    display: attributes.display,
    type: attributes.type,
    silhouette: attributes.silhouette,
    allowsTop: attributes.allowsTop,
    noneTopAllowed: attributes.noneTopAllowed,
    traditionalTuners: attributes.traditionalTuners,
    sheen: attributes.sheen,
    swatch: typeof attributes.swatch === "string" ? attributes.swatch : "",
    positions: Array.isArray(attributes.positions) ? attributes.positions : [],
  };
  for (const field of COMPATIBILITY_FIELDS) {
    if (mapped[field.key] == null) continue;
    mapped[field.key] = Array.isArray(mapped[field.key]) ? mapped[field.key] : [];
  }
  return mapped;
}

export function interpretPublicCatalog(result) {
  if (!result?.ok || !result.catalog) {
    return { ok: false, lists: null, reason: result?.reason || "unavailable" };
  }
  const lists = listsFromPublicCatalog(result.catalog);
  if (!lists) return { ok: false, lists: null, reason: "empty" };
  if (!Array.isArray(lists.instrumentTypes)) {
    return { ok: false, lists: null, reason: "incomplete" };
  }
  return { ok: true, lists, catalog: result.catalog };
}

export function listsFromPublicCatalog(catalog) {
  if (!catalog || !Array.isArray(catalog.categories)) return null;
  const lists = {};
  for (const category of catalog.categories) {
    const key = CATEGORY_LIST_KEYS[category.id];
    if (!key) continue;
    lists[key] = (category.options || [])
      .filter((option) => option && option.active !== false)
      .map(toWizardOption)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  return Object.keys(lists).length ? lists : null;
}

export function looksLikeI18nKey(value) {
  const text = String(value ?? "").trim();
  return /^(customBuild|admin|contact|nav|auth)\.[A-Za-z0-9_.-]+$/.test(text);
}

export function humanizeOptionId(value) {
  const text = String(value ?? "").trim();
  if (!text || looksLikeI18nKey(text)) return "";
  const leaf = text.includes(".") ? text.slice(text.lastIndexOf(".") + 1) : text;
  return leaf
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function translatedLabel(t, key) {
  if (!t || !key) return "";
  const value = t(key);
  if (!value || value === key || looksLikeI18nKey(value)) return "";
  return String(value);
}

function pickDisplayName(value) {
  const text = String(value ?? "").trim();
  if (!text || looksLikeI18nKey(text)) return "";
  return text;
}

export function optionLabel(option, language, t, key) {
  if (!option) return "";
  const current = language === "vi" ? option.translations?.vi?.name : option.translations?.en?.name;
  const other = language === "vi" ? option.translations?.en?.name : option.translations?.vi?.name;
  return (
    pickDisplayName(current) ||
    translatedLabel(t, key) ||
    pickDisplayName(option.name) ||
    pickDisplayName(option.display) ||
    pickDisplayName(other) ||
    humanizeOptionId(option.id) ||
    humanizeOptionId(option.code)
  );
}

export function wizardOptionLabel(option, language, t, groupKey) {
  if (!option) return "";
  const key =
    groupKey === "types" ? `customBuild.types.${option.id}` : `customBuild.${groupKey}.${option.id}.name`;
  return optionLabel(option, language, t, key);
}

export function optionDescription(option, language, t, key) {
  if (!option) return "";
  const current = language === "vi" ? option.translations?.vi?.description : option.translations?.en?.description;
  const other = language === "vi" ? option.translations?.en?.description : option.translations?.vi?.description;
  const fromData = pickDisplayName(current) || pickDisplayName(option.description) || pickDisplayName(other);
  if (fromData) return fromData;
  if (!key) return "";
  const translated = translatedLabel(t, key);
  if (!translated) return "";
  if (translated.endsWith(".description") || translated.endsWith(".detail")) return "";
  return translated;
}

export function choiceImageSrc(image, resolveUpload) {
  if (!image) return "";
  if (typeof image === "string" && image.startsWith("/uploads/") && typeof resolveUpload === "function") {
    return resolveUpload(image);
  }
  return image;
}
