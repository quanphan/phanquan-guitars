import { sanitizeReferenceImages } from "../data/referenceImages.js";
import { optionMatchesAlias, WIZARD_SETUP_GROUPS } from "../data/wizardCatalog.js";
import { allowedCompatibilityFields, isShapeChildGroup, knownGroupStep } from "../data/wizardSetupLayout.js";
import { DEFAULT_FRET_COUNT, parsePositiveFretCount } from "../data/wizardScaleAttributes.js";
import { isCustomerSuppliedParts, STEP4_OPTION_KEYS } from "../data/wizardSelection.js";
import {
  findSeriesConstructionOption,
  findSeriesNeckConstructionOption,
  seriesNeckConstructionOptions,
  usesSecondaryBodyWood,
  usesSecondaryNeckWood,
} from "../data/wizardSeriesConstruction.js";

const NOTES_MAX = 2000;

const INSTRUMENT_TYPE_MAP = {
  "electric-guitar": "instrument-type.solid-body-electric",
  bass: "instrument-type.electric-bass",
  "acoustic-guitar": "instrument-type.acoustic",
};

const SHAPE_MAP = {
  "double-cut": "body-shape.double-cut",
  offset: "body-shape.offset",
  "t-style": "body-shape.slab",
};

const BODY_WOOD_MAP = {
  alder: "body-wood.alder",
  mahogany: "body-wood.mahogany",
  "swamp-ash": "body-wood.swamp-ash",
};

const TOP_WOOD_MAP = {
  none: "top-wood.no-separate-top",
};

const NECK_WOOD_MAP = {
  "roasted-maple": "neck-wood.roasted-maple",
  mahogany: "neck-wood.mahogany",
  "mahogany-maple-laminate": "neck-wood.mahogany",
};

const FINGERBOARD_MAP = {
  ebony: "fingerboard.ebony",
  "roasted-maple-board": "fingerboard.maple",
};

const BRIDGE_MAP = {
  hardtail: "bridge.hardtail",
  "individual-saddle-hardtail": "bridge.hardtail",
};

const HARDWARE_MAP = {
  black: "hardware.black",
};

const FINISH_TYPE_BY_SHEEN = {
  gloss: "finish-type.gloss",
  satin: "finish-type.satin",
};

const FINISH_COLOR_MAP = {
  "natural-wood": "finish-color.natural",
  "natural-dark-figure": "finish-color.natural",
  "natural-amber-burst": "finish-color.sunburst",
};

const CONTROL_TO_ELECTRONICS = {
  "vol-blend-tone-passive": "electronics.passive",
  "vol-tone-3way": "electronics.passive",
};

export const SELECTION_CATEGORY_BINDINGS = [
  { categoryId: "instrument-type", selectionKey: "instrumentTypeId", summaryKey: "customBuild.summary.instrument", legacy: INSTRUMENT_TYPE_MAP },
  { categoryId: "series", selectionKey: "seriesId", summaryKey: "customBuild.summary.series" },
  { categoryId: "body-shape", selectionKey: "shapeId", summaryKey: "customBuild.summary.shape", legacy: SHAPE_MAP },
  { categoryId: "scale", selectionKey: "scaleId", summaryKey: "customBuild.summary.scale" },
  { categoryId: "string-count", selectionKey: "stringCount", summaryKey: "customBuild.summary.strings" },
  { categoryId: "radius", selectionKey: "radiusId", summaryKey: "customBuild.summary.radius" },
  { categoryId: "body-wood", selectionKey: "bodyWoodId", summaryKey: "customBuild.summary.bodyWood", legacy: BODY_WOOD_MAP },
  { categoryId: "top-wood", selectionKey: "topWoodId", summaryKey: "customBuild.summary.topWood", legacy: TOP_WOOD_MAP },
  { categoryId: "neck-wood", selectionKey: "neckWoodId", summaryKey: "customBuild.summary.neckWood", legacy: NECK_WOOD_MAP },
  { categoryId: "neck-construction", selectionKey: "neckConstructionId", summaryKey: "customBuild.summary.neckConstruction" },
  { categoryId: "fingerboard", selectionKey: "fingerboardWoodId", summaryKey: "customBuild.summary.fingerboard", legacy: FINGERBOARD_MAP },
  { categoryId: "neck-profile", selectionKey: "neckProfileId", summaryKey: "customBuild.summary.neckProfile" },
  { categoryId: "fret-spec", selectionKey: "fretSpecId", summaryKey: "customBuild.summary.frets" },
  { categoryId: "pickup-config", selectionKey: "pickupConfigId", summaryKey: "customBuild.summary.pickupConfig", stepFour: true },
  { categoryId: "pickups", selectionKey: "pickupTypeId", summaryKey: "customBuild.summary.pickupType", stepFour: true },
  { categoryId: "bridge", selectionKey: "bridgeId", summaryKey: "customBuild.summary.bridge", legacy: BRIDGE_MAP, stepFour: true },
  { categoryId: "tuners", selectionKey: "tunerId", summaryKey: "customBuild.summary.tuners", stepFour: true },
  { categoryId: "hardware", selectionKey: "hardwareFinishId", summaryKey: "customBuild.summary.hardwareFinish", legacy: HARDWARE_MAP, stepFour: true },
  { categoryId: "electronics", selectionKey: "controlLayoutId", summaryKey: "customBuild.summary.controls", legacy: CONTROL_TO_ELECTRONICS, stepFour: true },
  { categoryId: "finish-type", selectionKey: "finishTypeId", summaryKey: "customBuild.summary.finishType" },
  { categoryId: "finish-color", selectionKey: "finishColorId", summaryKey: "customBuild.summary.finishColor", legacy: FINISH_COLOR_MAP },
  { categoryId: "inlay", selectionKey: "inlayId", summaryKey: "customBuild.summary.inlay" },
  { categoryId: "engraving", selectionKey: "engravingId", summaryKey: "customBuild.summary.engraving" },
];

const BINDING_BY_CATEGORY = new Map(
  SELECTION_CATEGORY_BINDINGS.map((item) => [item.categoryId, item]),
);

function findCategory(catalog, categoryId) {
  return catalog?.categories?.find((category) => category.id === categoryId) ?? null;
}

function optionMatchesNeedle(option, categoryId, needle) {
  if (!option || needle == null || needle === "") return false;
  const value = String(needle);
  if (option.id === value) return true;
  if (option.code === value) return true;
  if (option.id === `${categoryId}.${value}`) return true;
  return optionMatchesAlias(option, categoryId, value);
}

function resolveCatalogOption(catalog, categoryId, code, mappedId) {
  const category = findCategory(catalog, categoryId);
  if (!category) return null;
  const options = category.options || [];
  if (code != null && code !== "") {
    const direct = options.find((item) => optionMatchesNeedle(item, categoryId, code));
    if (direct) return direct;
  }
  if (mappedId) {
    return options.find((item) => optionMatchesNeedle(item, categoryId, mappedId)) ?? null;
  }
  return null;
}

function catalogHint(categoryId, code) {
  if (code == null || code === "") return undefined;
  const value = String(code);
  if (value.includes(".")) return value;
  return `${categoryId}.${value}`;
}

function resolveSelectionId(catalog, categoryId, code, mappedId) {
  if (code == null || code === "") return undefined;
  const category = findCategory(catalog, categoryId);
  if (!category) return undefined;
  const option = resolveCatalogOption(catalog, categoryId, code, mappedId);
  if (option?.id) return option.id;
  return catalogHint(categoryId, code);
}

function setIfPresent(selections, categoryId, optionId) {
  if (optionId) selections[categoryId] = optionId;
}

function catalogSeriesOption(catalog, seriesId) {
  return resolveCatalogOption(catalog, "series", seriesId, seriesId);
}

function selectedBodyConstruction(catalog, selections) {
  return findSeriesConstructionOption(
    catalogSeriesOption(catalog, selections?.seriesId),
    selections?.bodyConstructionId,
  );
}

function selectedNeckPieces(catalog, selections) {
  return findSeriesNeckConstructionOption(
    catalogSeriesOption(catalog, selections?.seriesId),
    selections?.neckPiecesId,
  );
}

function wizardLines(selections, catalog) {
  const keys = [
    "instrumentTypeId",
    "seriesId",
    "shapeId",
    "scaleId",
    "customScaleValue",
    "stringCount",
    "radiusId",
    "bodyWoodId",
    "bodyConstructionId",
    "secondaryBodyWoodId",
    "topWoodId",
    "neckWoodId",
    "neckPiecesId",
    "secondaryNeckWoodId",
    "neckConstructionId",
    "fingerboardWoodId",
    "neckProfileId",
    "fretSpecId",
    "fretCount",
    "pickupConfigId",
    "pickupTypeId",
    "bridgeId",
    "tunerId",
    "hardwareFinishId",
    "controlLayoutId",
    "customerSuppliedParts",
    "finishTypeId",
    "finishColorId",
    "customColorNote",
    "inlayId",
    "engravingId",
    "specialRequests",
  ];
  const skipStepFour = isCustomerSuppliedParts(selections);
  return keys
    .map((key) => {
      if (skipStepFour && STEP4_OPTION_KEYS.includes(key)) return null;
      if (key === "secondaryBodyWoodId" && !usesSecondaryBodyWood(selectedBodyConstruction(catalog, selections))) {
        return null;
      }
      if (key === "secondaryNeckWoodId" && !usesSecondaryNeckWood(selectedNeckPieces(catalog, selections))) {
        return null;
      }
      const value = selections[key];
      if (value == null || value === false) return null;
      const text = String(value).trim();
      if (!text) return null;
      return `${key}=${text}`;
    })
    .filter(Boolean);
}

function buildNotes({ selections, language, draftId, catalog }) {
  const lines = [
    draftId ? `draftId=${draftId}` : null,
    language ? `language=${language}` : null,
    selections.contactCountry?.trim()
      ? `country=${selections.contactCountry.trim()}`
      : null,
    "wizard:",
    ...wizardLines(selections, catalog),
  ].filter(Boolean);

  const notes = lines.join("\n").trim();
  if (!notes) return null;
  if (notes.length <= NOTES_MAX) return notes;
  return notes.slice(0, NOTES_MAX);
}

export function encodeCatalogSelection(category, optionId) {
  if (optionId == null || optionId === "") return undefined;
  if (category?.selectionMode === "multiple") {
    return Array.isArray(optionId) ? optionId : [optionId];
  }
  return optionId;
}

function customDetailSelections(catalog, selections) {
  const ids = [];
  if (selections.inlayId === "offset-dots" || selections.inlayId === "side-dots") {
    const option = resolveCatalogOption(
      catalog,
      "custom-details",
      "custom-details.dot-inlays",
      "custom-details.dot-inlays",
    );
    if (option?.id) ids.push(option.id);
  }
  if (selections.engravingId === "optional-top") {
    const option = resolveCatalogOption(
      catalog,
      "custom-details",
      "custom-details.engraved-ornament",
      "custom-details.engraved-ornament",
    );
    if (option?.id) ids.push(option.id);
  }
  return ids;
}

function legacyId(binding, selected) {
  if (!binding?.legacy || selected == null) return undefined;
  return binding.legacy[selected];
}

function mapCatalogSelections(catalog, selections, finishSheen) {
  const mapped = {};
  const skipStepFour = isCustomerSuppliedParts(selections);

  for (const binding of SELECTION_CATEGORY_BINDINGS) {
    if (skipStepFour && binding.stepFour) continue;
    const selected = selections[binding.selectionKey];
    if (binding.categoryId === "finish-type") {
      if (!findCategory(catalog, "finish-type")) continue;
      const option = resolveCatalogOption(
        catalog,
        "finish-type",
        selected,
        FINISH_TYPE_BY_SHEEN[finishSheen],
      );
      if (option?.id) {
        mapped["finish-type"] = option.id;
      } else if (selected) {
        mapped["finish-type"] = catalogHint("finish-type", selected);
      }
      continue;
    }
    const category = findCategory(catalog, binding.categoryId);
    setIfPresent(
      mapped,
      binding.categoryId,
      encodeCatalogSelection(
        category,
        resolveSelectionId(catalog, binding.categoryId, selected, legacyId(binding, selected)),
      ),
    );
  }

  const details = customDetailSelections(catalog, selections);
  if (details.length > 0) mapped["custom-details"] = details;
  return mapped;
}

function optionAliases(option, categoryId) {
  const aliases = new Set();
  if (!option) return aliases;
  if (option.id) aliases.add(String(option.id));
  if (option.code) aliases.add(String(option.code));
  const prefix = `${categoryId}.`;
  if (typeof option.id === "string" && option.id.startsWith(prefix)) {
    aliases.add(option.id.slice(prefix.length));
  }
  if (option.attributes?.wizardId) aliases.add(String(option.attributes.wizardId));
  if (option.attributes?.value != null && option.attributes.value !== "") {
    aliases.add(String(option.attributes.value));
  }
  return aliases;
}

function findOptionInCategory(category, value) {
  if (!category || value == null || value === "") return null;
  return (
    (category.options || []).find((item) => item.id === value) ||
    (category.options || []).find((item) => optionMatchesNeedle(item, category.id, value)) ||
    null
  );
}

function constraintAllows(allowed, selectedAliases) {
  if (!Array.isArray(allowed) || allowed.length === 0) return true;
  if (!selectedAliases || selectedAliases.size === 0) return true;
  return allowed.some((value) => selectedAliases.has(String(value)));
}

function validateSingleValue(category, value, field) {
  if (typeof value !== "string" && typeof value !== "number") {
    return { ok: false, issue: { field, code: "INVALID_TYPE" } };
  }
  const option = findOptionInCategory(category, value);
  if (!option) return { ok: false, issue: { field, code: "UNKNOWN_OPTION" } };
  if (option.active === false) return { ok: false, issue: { field, code: "INACTIVE_OPTION" } };
  return { ok: true, value: option.id, option };
}

/**
 * Mirror backend inquiry selection rules for the mapped catalog payload.
 * Backend remains the final gate on submit.
 */
export function evaluateMappedSelections(mapped, catalog) {
  const issues = [];
  const categories = catalog?.categories || [];
  const normalized = {};

  for (const category of categories) {
    const value = mapped?.[category.id];
    const field = `selections.${category.id}`;
    if (value === undefined || value === null || value === "") {
      if (category.required) issues.push({ field, code: "REQUIRED" });
      continue;
    }
    if (category.selectionMode === "multiple") {
      if (!Array.isArray(value)) {
        issues.push({ field, code: "INVALID_TYPE" });
        continue;
      }
      const ids = [];
      for (const item of value) {
        const result = validateSingleValue(category, item, field);
        if (!result.ok) {
          issues.push(result.issue);
          break;
        }
        ids.push(result.value);
      }
      if (ids.length) normalized[category.id] = ids;
      continue;
    }
    const result = validateSingleValue(category, value, field);
    if (!result.ok) {
      issues.push(result.issue);
      continue;
    }
    normalized[category.id] = result.value;
  }

  if (issues.length > 0) return issues;

  for (const category of categories) {
    const step = category.step ?? knownGroupStep(category.id, categories);
    if (Number(step) < 4 && !isShapeChildGroup(category.id) && category.id !== "series" && category.id !== "body-shape") continue;
    const selectedId = normalized[category.id];
    if (!selectedId || Array.isArray(selectedId)) continue;
    const option = findOptionInCategory(category, selectedId);
    if (!option) continue;
    const compatibility =
      option.compatibility && typeof option.compatibility === "object"
        ? option.compatibility
        : {};
    const allowedFields = allowedCompatibilityFields(category.id, categories);
    for (const compatField of allowedFields) {
      const target = categories.find((item) => item.id === compatField.categoryId);
      const selectedTarget = normalized[compatField.categoryId];
      const targetOption = findOptionInCategory(target, selectedTarget);
      const aliases = optionAliases(targetOption, compatField.categoryId);
      if (selectedTarget && aliases.size === 0) aliases.add(String(selectedTarget));
      if (!constraintAllows(compatibility[compatField.key], aliases)) {
        issues.push({
          field: `selections.${category.id}`,
          code: "INCOMPATIBLE_OPTION",
        });
        break;
      }
    }
  }

  return issues;
}

export function evaluateWizardNotesSelections(selections, catalog) {
  const issues = [];
  const series = catalogSeriesOption(catalog, selections?.seriesId);
  const constructions = series
    ? (Array.isArray(series.bodyConstruction)
      ? series.bodyConstruction
      : Array.isArray(series.attributes?.bodyConstruction)
        ? series.attributes.bodyConstruction
        : [])
    : [];
  const activeConstructions = constructions.filter((item) => item && item.active !== false && String(item.id || "").trim());
  if (activeConstructions.length > 0) {
    if (!selections?.bodyConstructionId) {
      issues.push({ field: "selections.body-construction", code: "REQUIRED" });
    } else if (!findSeriesConstructionOption(series, selections.bodyConstructionId)) {
      issues.push({ field: "selections.body-construction", code: "UNKNOWN_OPTION" });
    }
  }
  const construction = selectedBodyConstruction(catalog, selections);
  if (usesSecondaryBodyWood(construction)) {
    if (!selections?.secondaryBodyWoodId) {
      issues.push({ field: "selections.secondary-body-wood", code: "REQUIRED" });
    } else {
      const result = validateSingleValue(
        findCategory(catalog, "body-wood"),
        selections.secondaryBodyWoodId,
        "selections.secondary-body-wood",
      );
      if (!result.ok) issues.push(result.issue);
    }
  }

  const neckPieces = seriesNeckConstructionOptions(series);
  if (neckPieces.length > 0) {
    if (!selections?.neckPiecesId) {
      issues.push({ field: "selections.neck-pieces", code: "REQUIRED" });
    } else if (!findSeriesNeckConstructionOption(series, selections.neckPiecesId)) {
      issues.push({ field: "selections.neck-pieces", code: "UNKNOWN_OPTION" });
    }
  }
  const selectedNeck = selectedNeckPieces(catalog, selections);
  if (usesSecondaryNeckWood(selectedNeck)) {
    if (!selections?.secondaryNeckWoodId) {
      issues.push({ field: "selections.secondary-neck-wood", code: "REQUIRED" });
    } else {
      const result = validateSingleValue(
        findCategory(catalog, "neck-wood"),
        selections.secondaryNeckWoodId,
        "selections.secondary-neck-wood",
      );
      if (!result.ok) issues.push(result.issue);
    }
  }
  return issues;
}

export function selectionIssueMeta(field) {
  if (field === "selections.body-construction") {
    return {
      categoryId: "body-construction",
      selectionKey: "bodyConstructionId",
      summaryKey: "customBuild.summary.bodyPieces",
      step: 2,
    };
  }
  if (field === "selections.secondary-body-wood") {
    return {
      categoryId: "secondary-body-wood",
      selectionKey: "secondaryBodyWoodId",
      summaryKey: "customBuild.summary.secondaryBodyWood",
      step: 2,
    };
  }
  if (field === "selections.neck-pieces") {
    return {
      categoryId: "neck-pieces",
      selectionKey: "neckPiecesId",
      summaryKey: "customBuild.summary.neckPieces",
      step: 3,
    };
  }
  if (field === "selections.secondary-neck-wood") {
    return {
      categoryId: "secondary-neck-wood",
      selectionKey: "secondaryNeckWoodId",
      summaryKey: "customBuild.summary.secondaryNeckWood",
      step: 3,
    };
  }
  if (typeof field !== "string" || !field.startsWith("selections.")) return null;
  const categoryId = field.slice("selections.".length);
  const binding = BINDING_BY_CATEGORY.get(categoryId);
  const group = WIZARD_SETUP_GROUPS.find((item) => item.id === categoryId);
  return {
    categoryId,
    selectionKey: binding?.selectionKey || null,
    summaryKey: binding?.summaryKey || null,
    step: group?.step ?? binding?.step ?? null,
  };
}

export function isMissingRequiredConfig(issues, configIssueStep) {
  if (!configIssueStep) return false;
  const list = Array.isArray(issues) ? issues : [];
  if (list.length === 0) return true;
  return list.some((issue) => issue.code === "REQUIRED");
}

export function firstIssueStep(issues) {
  let step = null;
  for (const issue of issues || []) {
    const meta = selectionIssueMeta(issue.field);
    if (meta?.step == null) continue;
    if (step == null || meta.step < step) step = meta.step;
  }
  return step;
}

export function formatSelectionIssueLabel(t, issue) {
  const meta = selectionIssueMeta(issue?.field);
  const codeKey = `customBuild.step6.serverCodes.${issue?.code}`;
  const codeLabel = t(codeKey);
  const resolvedCode = codeLabel === codeKey ? issue?.code || "" : codeLabel;
  let name = issue?.field || "";
  if (meta?.summaryKey) {
    const label = t(meta.summaryKey);
    if (label && label !== meta.summaryKey) name = label;
  }
  return `${name}: ${resolvedCode}`.trim();
}

/**
 * Map wizard state onto the backend inquiry contract.
 * Selected wizard codes are resolved to catalog option IDs, including inactive
 * rows so the API can return INACTIVE_OPTION instead of a false REQUIRED.
 */
export function buildInquiryPayload({
  selections,
  language,
  draftId,
  catalog,
  finishSheen,
}) {
  const mapped = mapCatalogSelections(catalog, selections, finishSheen);

  const customer = {
    name: selections.contactName.trim(),
    email: selections.contactEmail.trim(),
    phone: (selections.contactPhone ?? "").trim(),
  };

  const configuration = {
    selections: mapped,
  };
  const notes = buildNotes({
    selections: {
      ...selections,
      fretCount: parsePositiveFretCount(selections.fretCount) ?? DEFAULT_FRET_COUNT,
    },
    language,
    draftId,
    catalog,
  });
  if (notes) configuration.notes = notes;

  const payload = { customer, configuration };
  const message = selections.contactMessage.trim();
  if (message) payload.message = message;
  const referenceImages = sanitizeReferenceImages(selections.referenceImages);
  if (referenceImages.length) payload.referenceImages = referenceImages;
  return payload;
}

export function mapServerFieldToContact(field) {
  if (field === "customer.name") return "contactName";
  if (field === "customer.email") return "contactEmail";
  if (field === "customer.phone") return "contactPhone";
  if (field === "message") return "contactMessage";
  return null;
}
