import { COMPATIBILITY_FIELDS, optionMatchesAlias } from "./wizardCatalog.js";
import { allowedCompatibilityFields, keepAllowedCompatibility } from "./wizardSetupLayout.js";
import {
  BODY_CONSTRUCTION_ATTR,
  NECK_CONSTRUCTION_ATTR,
  constructionListFromAttributes,
  mergeSeriesConstructionAttributes,
} from "./wizardSeriesConstruction.js";
import { seriesSuggestionFormValues } from "./wizardSeriesSuggestions.js";

function emptyCompatibility() {
  return Object.fromEntries(COMPATIBILITY_FIELDS.map((field) => [field.key, []]));
}

export function wizardOptionImagePath(option) {
  if (!option || typeof option !== "object") return "";
  const attributes = option.attributes && typeof option.attributes === "object" && !Array.isArray(option.attributes)
    ? option.attributes
    : {};
  for (const value of [option.imagePath, option.image, attributes.image]) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function storedCompatibility(compatibility, categoryId, categories) {
  const source = compatibility && typeof compatibility === "object" && !Array.isArray(compatibility)
    ? compatibility
    : {};
  const next = {};
  for (const field of allowedCompatibilityFields(categoryId, categories)) {
    next[field.key] = Array.isArray(source[field.key]) ? [...source[field.key]] : [];
  }
  return next;
}

export function compatibilityPayload(compatibility, categoryId, categories) {
  return storedCompatibility(compatibility, categoryId, categories);
}

function localeDescription(option, locale) {
  const translated = option?.translations?.[locale]?.description;
  if (typeof translated === "string" && translated.trim()) return translated.trim();
  const root = option?.description;
  if (root && typeof root === "object" && !Array.isArray(root)) {
    const nested = root[locale];
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  if (locale === "en" && typeof root === "string") return root.trim();
  return "";
}

export function formFromWizardOption(option, categoryId, categories) {
  const enDescription = localeDescription(option, "en");
  const viDescription = localeDescription(option, "vi");
  return {
    categoryId,
    code: option.code || "",
    description: enDescription,
    enDescription,
    viDescription,
    viName: option.translations?.vi?.name || "",
    enName: option.translations?.en?.name || option.name || "",
    icon: option.icon || (typeof option.attributes?.icon === "string" ? option.attributes.icon : "") || "",
    imagePath: wizardOptionImagePath(option),
    active: option.active !== false,
    isDefault: Boolean(option.isDefault),
    defaultForInstrumentTypeIds: Array.isArray(option.defaultForInstrumentTypeIds)
      ? [...option.defaultForInstrumentTypeIds]
      : [],
    attributes: option.attributes && typeof option.attributes === "object" && !Array.isArray(option.attributes)
      ? { ...option.attributes }
      : {},
    bodyConstruction: constructionListFromAttributes(option.attributes, BODY_CONSTRUCTION_ATTR),
    neckConstruction: constructionListFromAttributes(option.attributes, NECK_CONSTRUCTION_ATTR),
    compatibility: storedCompatibility(option.compatibility, categoryId, categories),
  };
}

function formEnDescription(form) {
  if (typeof form?.enDescription === "string") return form.enDescription;
  if (typeof form?.description === "string") return form.description;
  return "";
}

function formViDescription(form) {
  return typeof form?.viDescription === "string" ? form.viDescription : "";
}

function sharedBody(form, { canScopeDefault, instrumentTypes, categories }) {
  const enDescription = formEnDescription(form);
  const viDescription = formViDescription(form);
  return {
    name: form.enName || form.viName,
    description: enDescription,
    icon: form.icon,
    imagePath: form.imagePath,
    active: form.active,
    isDefault: form.isDefault,
    defaultForInstrumentTypeIds: canScopeDefault
      ? (form.defaultForInstrumentTypeIds || []).filter((id) => (
        (instrumentTypes || []).some((option) => optionMatchesAlias(option, "instrument-type", id))
      ))
      : [],
    translations: {
      vi: { name: form.viName, description: viDescription },
      en: { name: form.enName || form.viName, description: enDescription },
    },
    compatibility: compatibilityPayload(form.compatibility, form.categoryId, categories),
    attributes: attributesForForm(form),
  };
}

function attributesForForm(form) {
  const attributes = form.attributes && typeof form.attributes === "object" && !Array.isArray(form.attributes)
    ? { ...form.attributes }
    : {};
  if (form.categoryId === "series") {
    return mergeSeriesConstructionAttributes(attributes, form.bodyConstruction, form.neckConstruction);
  }
  delete attributes[BODY_CONSTRUCTION_ATTR];
  delete attributes[NECK_CONSTRUCTION_ATTR];
  return attributes;
}

export function buildWizardOptionCreatePayload(form, options = {}) {
  return {
    ...sharedBody(form, options),
    code: form.code,
    compatibility: keepAllowedCompatibility(
      { ...emptyCompatibility(), ...(form.compatibility || {}) },
      form.categoryId,
      options.categories,
    ),
  };
}

export function buildWizardOptionUpdatePayload(form, options = {}) {
  const body = sharedBody(form, options);
  return body;
}

export function applySeriesSuggestion(form, item, { isNew } = {}) {
  const values = seriesSuggestionFormValues(item, { includeCode: Boolean(isNew) });
  if (!values) return form;
  return { ...form, ...values };
}

export function isIdentifierLocked(isNew) {
  return !isNew;
}
