import { COMPATIBILITY_FIELDS, optionMatchesAlias } from "./wizardCatalog.js";
import { allowedCompatibilityFields, keepAllowedCompatibility } from "./wizardSetupLayout.js";
import { seriesSuggestionFormValues } from "./wizardSeriesSuggestions.js";

function emptyCompatibility() {
  return Object.fromEntries(COMPATIBILITY_FIELDS.map((field) => [field.key, []]));
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

export function formFromWizardOption(option, categoryId, categories) {
  return {
    categoryId,
    code: option.code || "",
    description: option.description || option.translations?.en?.description || option.translations?.vi?.description || "",
    viName: option.translations?.vi?.name || "",
    enName: option.translations?.en?.name || option.name || "",
    icon: option.icon || "",
    imagePath: option.imagePath || "",
    active: option.active !== false,
    isDefault: Boolean(option.isDefault),
    defaultForInstrumentTypeIds: Array.isArray(option.defaultForInstrumentTypeIds)
      ? [...option.defaultForInstrumentTypeIds]
      : [],
    attributes: option.attributes && typeof option.attributes === "object" && !Array.isArray(option.attributes)
      ? { ...option.attributes }
      : {},
    compatibility: storedCompatibility(option.compatibility, categoryId, categories),
  };
}

function sharedBody(form, { canScopeDefault, instrumentTypes, categories }) {
  return {
    name: form.enName || form.viName,
    description: form.description,
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
      vi: { name: form.viName, description: form.description },
      en: { name: form.enName || form.viName, description: form.description },
    },
    compatibility: compatibilityPayload(form.compatibility, form.categoryId, categories),
    attributes: form.attributes && typeof form.attributes === "object" ? form.attributes : {},
  };
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
