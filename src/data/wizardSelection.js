import { LIST_CATEGORY_IDS } from "./wizardCatalog.js";
import { isCustomScale } from "./wizardScaleAttributes.js";
import {
  findSeriesConstructionOption,
  findSeriesNeckConstructionOption,
  seriesBodyConstructionOptions,
  seriesNeckConstructionOptions,
  usesSecondaryBodyWood,
  usesSecondaryNeckWood,
} from "./wizardSeriesConstruction.js";
import { allowedCompatibilityFields } from "./wizardSetupLayout.js";

function asList(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value;
  return null;
}

export function selectionAliases(option, selected) {
  const aliases = new Set();
  if (selected != null && selected !== "") aliases.add(String(selected));
  if (!option) return aliases;
  for (const value of [
    option.id,
    option.code,
    option.optionId,
    option.wizardId,
    option.attributes?.wizardId,
    option.value,
    option.attributes?.value,
  ]) {
    if (value != null && value !== "") aliases.add(String(value));
  }
  const optionId = String(option.optionId || option.id || "");
  const dot = optionId.indexOf(".");
  if (dot > 0) aliases.add(optionId.slice(dot + 1));
  return aliases;
}

export function isActiveOption(option) {
  return Boolean(option) && option.active !== false;
}

export function findSelectedOption(options, selected) {
  if (!Array.isArray(options) || selected == null || selected === "") return null;
  const needle = String(selected);
  return (
    options.find((option) => {
      if (!isActiveOption(option)) return false;
      const aliases = selectionAliases(option, option?.id);
      return aliases.has(needle);
    }) || null
  );
}

function listOptionAliases(options, { activeOnly = true } = {}) {
  const aliases = new Set();
  for (const option of options || []) {
    if (activeOnly && !isActiveOption(option)) continue;
    for (const value of selectionAliases(option, option.id)) aliases.add(String(value));
  }
  return aliases;
}

function listActiveAliases(options) {
  return listOptionAliases(options, { activeOnly: true });
}

function listCatalogAliases(options) {
  return listOptionAliases(options, { activeOnly: false });
}

export function constraintAllows(allowed, selected, selectedOption, activeAliases, catalogAliases, ignoreMissingCatalog = false) {
  const list = asList(allowed);
  if (list === null) return false;
  if (list.length === 0) return true;
  const usable = activeAliases
    ? list.filter((value) => activeAliases.has(String(value)))
    : list;
  if (!usable.length) {
    if (catalogAliases && list.some((value) => catalogAliases.has(String(value)))) return false;
    if (ignoreMissingCatalog && activeAliases) return true;
    return false;
  }
  if (selected == null || selected === "") return true;
  const aliases = selectionAliases(selectedOption, selected);
  return usable.some((value) => aliases.has(String(value)));
}

export function isNoneTopOption(option) {
  if (!option) return false;
  if (option.kind === "none" || option.attributes?.kind === "none") return true;
  const aliases = selectionAliases(option, option.id);
  return aliases.has("none") || aliases.has("no-separate-top");
}

export function isHeadlessOption(option) {
  if (!option) return false;
  if (option.headless === true || option.attributes?.headless === true) return true;
  const aliases = selectionAliases(option, option.id);
  return aliases.has("headless");
}

function inferCategoryId(options) {
  for (const option of options || []) {
    const raw = String(option.optionId || "");
    const dot = raw.indexOf(".");
    if (dot > 0) return raw.slice(0, dot);
  }
  return "";
}

export function optionMatches(option, selections, lists = {}, categoryId) {
  if (!option) return false;
  const allowed = categoryId
    ? new Set(allowedCompatibilityFields(categoryId).map((field) => field.key))
    : null;
  const type = findSelectedOption(lists.instrumentTypes, selections.instrumentTypeId);
  const series = findSelectedOption(lists.series, selections.seriesId);
  const shape = findSelectedOption(lists.shapes, selections.shapeId);
  const scale = findSelectedOption(lists.scales, selections.scaleId);
  const ignoreScaleIds = isCustomScale(scale);
  const check = (key, selected, selectedOption, listKey) => {
    if (allowed && !allowed.has(key)) return true;
    if (ignoreScaleIds && key === "scaleIds") return true;
    return constraintAllows(
      option[key],
      selected,
      selectedOption,
      listActiveAliases(lists[listKey]),
      listCatalogAliases(lists[listKey]),
      categoryId === "scale" && key === "seriesIds",
    );
  };
  const strings = findSelectedOption(lists.stringCounts, selections.stringCount);
  const body = findSelectedOption(lists.bodyWoods, selections.bodyWoodId);
  const top = findSelectedOption(lists.topWoods, selections.topWoodId);
  const neck = findSelectedOption(lists.neckWoods, selections.neckWoodId);
  const construction = findSelectedOption(lists.neckConstructions, selections.neckConstructionId);
  const fingerboard = findSelectedOption(lists.fingerboardWoods, selections.fingerboardWoodId);
  const pickupConfig = findSelectedOption(lists.pickupConfigs, selections.pickupConfigId);
  const pickupType = findSelectedOption(lists.pickupTypes, selections.pickupTypeId);
  const bridge = findSelectedOption(lists.bridges, selections.bridgeId);
  const finishType = findSelectedOption(lists.finishTypes, selections.finishTypeId);

  return (
    check("instrumentTypeIds", selections.instrumentTypeId, type, "instrumentTypes") &&
    check("seriesIds", selections.seriesId, series, "series") &&
    check("shapeIds", selections.shapeId, shape, "shapes") &&
    check("scaleIds", selections.scaleId, scale, "scales") &&
    check("stringCounts", selections.stringCount, strings, "stringCounts") &&
    check("bodyWoodIds", selections.bodyWoodId, body, "bodyWoods") &&
    check("topWoodIds", selections.topWoodId, top, "topWoods") &&
    check("neckWoodIds", selections.neckWoodId, neck, "neckWoods") &&
    check("neckConstructionIds", selections.neckConstructionId, construction, "neckConstructions") &&
    check("fingerboardWoodIds", selections.fingerboardWoodId, fingerboard, "fingerboardWoods") &&
    check("pickupConfigIds", selections.pickupConfigId, pickupConfig, "pickupConfigs") &&
    check("pickupTypeIds", selections.pickupTypeId, pickupType, "pickupTypes") &&
    check("bridgeIds", selections.bridgeId, bridge, "bridges") &&
    check("finishTypeIds", selections.finishTypeId, finishType, "finishTypes")
  );
}

export const STEP4_OPTION_KEYS = [
  "pickupConfigId",
  "pickupTypeId",
  "bridgeId",
  "tunerId",
  "hardwareFinishId",
  "controlLayoutId",
];

export function isCustomerSuppliedParts(selections) {
  return Boolean(selections?.customerSuppliedParts);
}

export function clearStepFourOptions(next) {
  const target = next && typeof next === "object" ? next : {};
  for (const key of STEP4_OPTION_KEYS) target[key] = null;
  return target;
}

export function filterOptions(options, selections, lists = {}, categoryId) {
  if (!Array.isArray(options)) return [];
  const resolved = categoryId || inferCategoryId(options);
  return options.filter((option) => isActiveOption(option) && optionMatches(option, selections, lists, resolved));
}

export function listedTuners(lists, selections) {
  const catalog = lists || {};
  const series = findSelectedOption(catalog.series, selections?.seriesId);
  if (isHeadlessOption(series)) return [];
  return filterOptions(catalog.tuners || [], selections, catalog, "tuners");
}

export function optionIdEquals(option, selected) {
  if (!option || selected == null || selected === "") return false;
  return selectionAliases(option, option.id).has(String(selected));
}

function firstOptionId(options) {
  const item = (options || []).find((option) => option && option.id != null && String(option.id) !== "");
  return item ? item.id : null;
}

function otherOptionId(options, selectedId) {
  const other = (options || []).find((option) => option && !optionIdEquals(option, selectedId));
  return other?.id || firstOptionId(options);
}

export function applyVisibleSelectDefaults(selections, lists = {}) {
  const next = { ...(selections || {}) };
  if (!next.seriesId || !next.shapeId) return next;
  const series = findSelectedOption(lists.series, next.seriesId);
  const constructions = seriesBodyConstructionOptions(series);
  if (!next.bodyConstructionId) {
    const id = firstOptionId(constructions);
    if (id) next.bodyConstructionId = id;
  }
  const bodyWoods = filterOptions(lists.bodyWoods || [], next, lists, "body-wood");
  if (!next.bodyWoodId) {
    const id = firstOptionId(bodyWoods);
    if (id) next.bodyWoodId = id;
  }
  const bodyConstruction = findSeriesConstructionOption(series, next.bodyConstructionId);
  if (usesSecondaryBodyWood(bodyConstruction) && !next.secondaryBodyWoodId) {
    const id = otherOptionId(bodyWoods, next.bodyWoodId);
    if (id) next.secondaryBodyWoodId = id;
  }
  const neckPieces = seriesNeckConstructionOptions(series);
  if (!next.neckPiecesId) {
    const id = firstOptionId(neckPieces);
    if (id) next.neckPiecesId = id;
  }
  const neckWoods = filterOptions(lists.neckWoods || [], next, lists, "neck-wood");
  if (!next.neckWoodId) {
    const id = firstOptionId(neckWoods);
    if (id) next.neckWoodId = id;
  }
  const neckPiece = findSeriesNeckConstructionOption(series, next.neckPiecesId);
  if (usesSecondaryNeckWood(neckPiece) && !next.secondaryNeckWoodId) {
    const id = otherOptionId(neckWoods, next.neckWoodId);
    if (id) next.secondaryNeckWoodId = id;
  }
  return next;
}

function stringCountEquals(option, selected) {
  if (!option || selected == null || selected === "") return false;
  if (option.value != null && Number(option.value) === Number(selected) && Number.isFinite(Number(selected))) {
    return true;
  }
  return optionIdEquals(option, selected);
}

export function pruneSelections(selections, lists) {
  if (!selections || typeof selections !== "object") return selections;
  if (!lists) {
    if (!isCustomerSuppliedParts(selections)) return selections;
    return clearStepFourOptions({ ...selections });
  }
  const next = { ...selections };
  const available = (key) => filterOptions(lists[key] || [], next, lists, LIST_CATEGORY_IDS[key]);

  if (next.instrumentTypeId && !findSelectedOption(lists.instrumentTypes, next.instrumentTypeId)) {
    next.instrumentTypeId = null;
    next.seriesId = null;
    next.shapeId = null;
    next.scaleId = null;
    next.stringCount = null;
    next.radiusId = null;
    next.bodyWoodId = null;
    next.topWoodId = null;
    next.bodyConstructionId = null;
    next.secondaryBodyWoodId = null;
    next.neckPiecesId = null;
    next.secondaryNeckWoodId = null;
    clearStepThreeSelections(next);
    next.neckConstructionId = null;
    next.neckProfileId = null;
    next.fretSpecId = null;
    clearStepFourAndFiveSelections(next);
  }

  if (next.seriesId && !available("series").some((item) => optionIdEquals(item, next.seriesId))) {
    next.seriesId = null;
    next.shapeId = null;
    next.scaleId = null;
    next.stringCount = null;
    next.radiusId = null;
    next.bodyWoodId = null;
    next.topWoodId = null;
    next.bodyConstructionId = null;
    next.secondaryBodyWoodId = null;
    next.neckPiecesId = null;
    next.secondaryNeckWoodId = null;
    clearStepThreeSelections(next);
  }

  if (next.shapeId && !available("shapes").some((item) => optionIdEquals(item, next.shapeId))) {
    next.shapeId = null;
    next.bodyWoodId = null;
    next.topWoodId = null;
    clearStepThreeSelections(next);
  }

  if (!next.shapeId) {
    next.scaleId = null;
    next.stringCount = null;
    next.radiusId = null;
  } else {
    if (next.scaleId && !available("scales").some((item) => optionIdEquals(item, next.scaleId))) {
      next.scaleId = null;
    }
    if (
      next.stringCount != null
      && !available("stringCounts").some((item) => stringCountEquals(item, next.stringCount))
    ) {
      next.stringCount = null;
    }
    if (next.radiusId && !available("radii").some((item) => optionIdEquals(item, next.radiusId))) {
      next.radiusId = null;
    }
  }

  const selectedSeries = findSelectedOption(lists.series, next.seriesId);
  if (!next.seriesId || (next.bodyConstructionId && !findSeriesConstructionOption(selectedSeries, next.bodyConstructionId))) {
    next.bodyConstructionId = null;
  }

  if (!next.seriesId || (next.neckPiecesId && !findSeriesNeckConstructionOption(selectedSeries, next.neckPiecesId))) {
    next.neckPiecesId = null;
  }

  if (next.bodyWoodId && !available("bodyWoods").some((item) => optionIdEquals(item, next.bodyWoodId))) {
    next.bodyWoodId = null;
    next.topWoodId = null;
    clearStepThreeSelections(next);
  }

  if (
    next.secondaryBodyWoodId
    && !available("bodyWoods").some((item) => optionIdEquals(item, next.secondaryBodyWoodId))
  ) {
    next.secondaryBodyWoodId = null;
  }

  const body = findSelectedOption(lists.bodyWoods, next.bodyWoodId);
  const topApplicable = Boolean(body) && body.allowsTop !== false;
  const noneTops = (lists.topWoods || []).filter(isNoneTopOption);
  if (!topApplicable) {
    next.topWoodId = null;
  } else if (isNoneTopOption(findSelectedOption(lists.topWoods, next.topWoodId))) {
    if (!body?.noneTopAllowed || noneTops.length === 0) next.topWoodId = null;
  } else if (
    next.topWoodId &&
    !filterOptions(
      (lists.topWoods || []).filter((item) => !isNoneTopOption(item)),
      next,
      lists,
    ).some((item) => optionIdEquals(item, next.topWoodId))
  ) {
    next.topWoodId = null;
  }

  if (next.neckWoodId && !available("neckWoods").some((item) => optionIdEquals(item, next.neckWoodId))) {
    next.neckWoodId = null;
    next.fingerboardWoodId = null;
  }

  if (
    next.secondaryNeckWoodId
    && !available("neckWoods").some((item) => optionIdEquals(item, next.secondaryNeckWoodId))
  ) {
    next.secondaryNeckWoodId = null;
  }

  if (
    next.neckConstructionId &&
    !available("neckConstructions").some((item) => optionIdEquals(item, next.neckConstructionId))
  ) {
    next.neckConstructionId = null;
  }

  if (
    next.fingerboardWoodId &&
    !(next.neckWoodId
      ? available("fingerboardWoods").some((item) => optionIdEquals(item, next.fingerboardWoodId))
      : false)
  ) {
    next.fingerboardWoodId = null;
  }

  if (next.neckProfileId && !available("neckProfiles").some((item) => optionIdEquals(item, next.neckProfileId))) {
    next.neckProfileId = null;
  }

  if (next.fretSpecId && !available("fretSpecs").some((item) => optionIdEquals(item, next.fretSpecId))) {
    next.fretSpecId = null;
  }

  if (next.pickupConfigId && !available("pickupConfigs").some((item) => optionIdEquals(item, next.pickupConfigId))) {
    next.pickupConfigId = null;
  }

  if (next.pickupTypeId && !available("pickupTypes").some((item) => optionIdEquals(item, next.pickupTypeId))) {
    next.pickupTypeId = null;
  }

  if (next.bridgeId && !available("bridges").some((item) => optionIdEquals(item, next.bridgeId))) {
    next.bridgeId = null;
  }

  const series = findSelectedOption(lists.series, next.seriesId);
  if (isHeadlessOption(series) || (next.tunerId && !available("tuners").some((item) => optionIdEquals(item, next.tunerId)))) {
    next.tunerId = null;
  }

  if (
    next.hardwareFinishId &&
    !available("hardwareFinishes").some((item) => optionIdEquals(item, next.hardwareFinishId))
  ) {
    next.hardwareFinishId = null;
  }

  if (next.controlLayoutId && !available("controlLayouts").some((item) => optionIdEquals(item, next.controlLayoutId))) {
    next.controlLayoutId = null;
  }

  if (next.finishTypeId && !available("finishTypes").some((item) => optionIdEquals(item, next.finishTypeId))) {
    next.finishTypeId = null;
  }

  if (next.finishColorId && !available("finishColors").some((item) => optionIdEquals(item, next.finishColorId))) {
    next.finishColorId = null;
  }

  if (next.inlayId && !available("inlays").some((item) => optionIdEquals(item, next.inlayId))) {
    next.inlayId = null;
  }

  if (next.engravingId && !available("engravings").some((item) => optionIdEquals(item, next.engravingId))) {
    next.engravingId = null;
  }

  if (isCustomerSuppliedParts(next)) clearStepFourOptions(next);

  return applyVisibleSelectDefaults(next, lists);
}

function clearStepThreeSelections(next) {
  next.neckWoodId = null;
  next.secondaryNeckWoodId = null;
  next.fingerboardWoodId = null;
}

function clearStepFourAndFiveSelections(next) {
  next.pickupConfigId = null;
  next.pickupTypeId = null;
  next.bridgeId = null;
  next.tunerId = null;
  next.hardwareFinishId = null;
  next.controlLayoutId = null;
  next.finishTypeId = null;
  next.finishColorId = null;
  next.inlayId = null;
  next.engravingId = null;
}
