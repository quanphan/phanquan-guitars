import { COMPATIBILITY_FIELDS, WIZARD_SETUP_GROUPS, optionAlias, optionMatchesAlias } from "./wizardCatalog.js";

export const UNASSIGNED_STEP_ID = "unassigned";

/** Copy keys for known public-wizard steps. Tab membership still comes from API categories. */
export const WIZARD_STEP_COPY = {
  1: { titleKey: "customBuild.steps.instrumentShape", descriptionKey: "customBuild.step1.description" },
  2: { titleKey: "customBuild.steps.bodyTop", descriptionKey: "customBuild.step2.description" },
  3: { titleKey: "customBuild.steps.neckFingerboard", descriptionKey: "customBuild.step3.description" },
  4: { titleKey: "customBuild.steps.electronicsHardware", descriptionKey: "customBuild.step4.description" },
  5: { titleKey: "customBuild.steps.finishDetails", descriptionKey: "customBuild.step5.description" },
};

export function categoryStepId(category) {
  if (category?.step != null && category.step !== "") return String(category.step);
  const known = WIZARD_SETUP_GROUPS.find((item) => item.id === category?.id);
  if (known?.step != null) return String(known.step);
  return UNASSIGNED_STEP_ID;
}

export function wizardSetupSteps(categories) {
  const map = new Map();
  for (const category of categories || []) {
    const id = categoryStepId(category);
    const numeric = Number(id);
    if (!map.has(id)) {
      map.set(id, {
        id,
        sort: Number.isFinite(numeric) ? numeric : Number.MAX_SAFE_INTEGER,
        categories: [],
        optionCount: 0,
      });
    }
    const step = map.get(id);
    step.categories.push(category);
    step.optionCount += (category.options || []).length;
  }
  return [...map.values()].sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id));
}

export function groupsWithOptions(categories) {
  return (categories || []).filter((item) => (item.options || []).length > 0);
}

export function resolveGroupAfterStepChange(groupId, groups) {
  if (groupId && groups.some((item) => item.id === groupId)) return groupId;
  return "";
}

export function addTargetCategoryId(groupId, stepCategories, optionGroups) {
  if (groupId && (stepCategories || []).some((item) => item.id === groupId)) return groupId;
  return optionGroups?.[0]?.id || stepCategories?.[0]?.id || "";
}

export function filterWizardSetupRows({ categories, stepId, groupId, status, search }) {
  const query = String(search || "").trim().toLowerCase();
  return (categories || [])
    .flatMap((category) => {
      if (stepId && categoryStepId(category) !== String(stepId)) return [];
      if (groupId && category.id !== groupId) return [];
      return (category.options || []).map((option) => ({ category, option }));
    })
    .filter(({ option }) => {
      if (status === "active" && option.active === false) return false;
      if (status === "inactive" && option.active !== false) return false;
      if (!query) return true;
      const hay = `${option.name || ""} ${option.code || ""} ${option.translations?.vi?.name || ""} ${option.translations?.en?.name || ""}`.toLowerCase();
      return hay.includes(query);
    });
}

export function orderedGroupIds(categories) {
  const known = WIZARD_SETUP_GROUPS.map((item) => item.id);
  const seen = new Set(known);
  const extra = [];
  for (const category of categories || []) {
    if (!category?.id || seen.has(category.id)) continue;
    seen.add(category.id);
    extra.push(category);
  }
  extra.sort((a, b) => {
    const stepA = Number(categoryStepId(a));
    const stepB = Number(categoryStepId(b));
    const knownA = Number.isFinite(stepA) ? stepA : Number.MAX_SAFE_INTEGER;
    const knownB = Number.isFinite(stepB) ? stepB : Number.MAX_SAFE_INTEGER;
    if (knownA !== knownB) return knownA - knownB;
    return (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.id).localeCompare(String(b.id));
  });
  return [...known, ...extra.map((item) => item.id)];
}

export function precedingGroupIds(categoryId, categories) {
  const order = orderedGroupIds(categories);
  const index = order.indexOf(categoryId);
  if (index <= 0) return [];
  return order.slice(0, index);
}

export function knownGroupStep(categoryId, categories) {
  const fromList = (categories || []).find((item) => item.id === categoryId);
  if (fromList?.step != null && fromList.step !== "") {
    const numeric = Number(fromList.step);
    if (Number.isFinite(numeric)) return numeric;
  }
  const known = WIZARD_SETUP_GROUPS.find((item) => item.id === categoryId);
  return known?.step ?? null;
}

export function allowedCompatibilityGroupIds(categoryId, categories) {
  const preceding = precedingGroupIds(categoryId, categories);
  const step = knownGroupStep(categoryId, categories);
  if (Number(step) >= 4) {
    return preceding.filter((id) => {
      const precedingStep = Number(knownGroupStep(id, categories));
      return precedingStep === 1 || precedingStep === Number(step);
    });
  }
  return preceding;
}

export function allowedCompatibilityFields(categoryId, categories) {
  const allowed = new Set(allowedCompatibilityGroupIds(categoryId, categories));
  return COMPATIBILITY_FIELDS.filter((field) => allowed.has(field.categoryId));
}

export function isActiveSetupOption(option) {
  return Boolean(option) && option.active !== false;
}

export function compatibilityEditorOptions(options) {
  return (options || []).filter(isActiveSetupOption);
}

export function keepAllowedCompatibility(compatibility, categoryId, categories) {
  const allowed = new Set(allowedCompatibilityFields(categoryId, categories).map((field) => field.key));
  const next = {};
  for (const field of COMPATIBILITY_FIELDS) {
    if (!allowed.has(field.key) || !Array.isArray(compatibility?.[field.key])) {
      next[field.key] = [];
      continue;
    }
    const category = (categories || []).find((item) => item.id === field.categoryId);
    const active = compatibilityEditorOptions(category?.options);
    next[field.key] = compatibility[field.key].filter((value) => (
      active.some((option) => optionMatchesAlias(option, field.categoryId, value))
    ));
  }
  return next;
}

export function compatibilityStoredValue(field, option, categoryId) {
  const alias = optionAlias(option, categoryId);
  if (
    field?.key === "stringCounts"
    && Number.isFinite(Number(option.attributes?.value))
    && !String(alias).includes("-")
  ) {
    return Number(option.attributes.value);
  }
  return alias;
}

export function isCompatibilityValueSelected(selected, option, categoryId) {
  return (selected || []).some((item) => optionMatchesAlias(option, categoryId, item));
}

export function compatibilitySelectAllState(selected, options, categoryId) {
  const choices = options || [];
  const total = choices.length;
  if (!total) {
    return { total: 0, selectedCount: 0, checked: false, indeterminate: false, disabled: true };
  }
  const selectedCount = choices.filter((option) => isCompatibilityValueSelected(selected, option, categoryId)).length;
  return {
    total,
    selectedCount,
    checked: selectedCount === total,
    indeterminate: selectedCount > 0 && selectedCount < total,
    disabled: false,
  };
}

export function applyCompatibilitySelectAll(selected, options, field, categoryId, selectAll) {
  if (!selectAll) return [];
  return (options || []).map((option) => compatibilityStoredValue(field, option, categoryId));
}

export function groupLabel(t, category) {
  if (!category) return "";
  const key = `admin.wizardSetup.groups.${category.id}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return category.name || category.id;
}
