import { optionAlias, optionMatchesAlias } from "./wizardCatalog.js";
import { allowedCompatibilityFields, followingGroupIds } from "./wizardSetupLayout.js";

const SHAPE_CATEGORY_ID = "body-shape";

function compatibilityObject(option) {
  return option?.compatibility && typeof option.compatibility === "object" && !Array.isArray(option.compatibility)
    ? option.compatibility
    : {};
}

export function groupsUsingBodyShapeCompatibility(categories) {
  const later = new Set(followingGroupIds(SHAPE_CATEGORY_ID, categories));
  return (categories || []).filter((category) => {
    if (!category?.id || category.id === SHAPE_CATEGORY_ID) return false;
    if (!later.has(category.id)) return false;
    return allowedCompatibilityFields(category.id, categories).some((field) => field.key === "shapeIds");
  });
}

export function storedShapeCompatibilityValue(shape, existingIds) {
  const id = shape?.id != null ? String(shape.id) : "";
  const code = shape?.code != null ? String(shape.code) : "";
  const alias = optionAlias(shape, SHAPE_CATEGORY_ID);
  const sample = (existingIds || []).find((value) => value != null && String(value).trim());
  if (sample && String(sample).includes(".") && id) return id;
  return alias || code || id;
}

export function shapeAlreadyListed(shape, shapeIds) {
  return (shapeIds || []).some((value) => optionMatchesAlias(shape, SHAPE_CATEGORY_ID, value));
}

export function mergeShapeIntoExistingList(shapeIds, shape) {
  const list = Array.isArray(shapeIds) ? [...shapeIds] : [];
  if (!list.length) return null;
  if (shapeAlreadyListed(shape, list)) return null;
  const nextValue = storedShapeCompatibilityValue(shape, list);
  if (!nextValue) return null;
  return [...list, nextValue];
}

export function addToAllConfigUpdates(categories, shape) {
  if (!shape || !(shape.id || shape.code || optionAlias(shape, SHAPE_CATEGORY_ID))) return [];
  const updates = [];
  for (const category of groupsUsingBodyShapeCompatibility(categories)) {
    for (const option of category.options || []) {
      if (!option) continue;
      const compatibility = compatibilityObject(option);
      const nextShapeIds = mergeShapeIntoExistingList(compatibility.shapeIds, shape);
      if (!nextShapeIds) continue;
      updates.push({
        categoryId: category.id,
        option,
        previousShapeIds: [...compatibility.shapeIds],
        shapeIds: nextShapeIds,
        compatibility: {
          ...compatibility,
          shapeIds: nextShapeIds,
        },
      });
    }
  }
  return updates;
}
