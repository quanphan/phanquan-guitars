export const STEP_TWO_FIELDS = [
  { key: "bodyConstructionId", targetId: "body-pieces", labelKey: "customBuild.step2.bodyPiecesLabel" },
  { key: "bodyWoodId", targetId: "main-body-wood", labelKey: "customBuild.step2.mainWoodLabel" },
  { key: "secondaryBodyWoodId", targetId: "secondary-body-wood", labelKey: "customBuild.step2.secondaryWoodLabel" },
  { key: "topWoodId", targetId: "top-wood", labelKey: "customBuild.step2.topLabel" },
];

export function collectStepTwoMissing(selections, available = {}) {
  const missing = [];
  function add(key) {
    const field = STEP_TWO_FIELDS.find((item) => item.key === key);
    if (field) missing.push(field);
  }
  if ((available.constructions || []).length > 0 && !selections?.bodyConstructionId) add("bodyConstructionId");
  if ((available.bodyWoods || []).length > 0 && !selections?.bodyWoodId) add("bodyWoodId");
  if (available.usesSecondary && !selections?.secondaryBodyWoodId) add("secondaryBodyWoodId");
  if (available.topApplicable && (available.tops || []).length > 0 && !selections?.topWoodId) add("topWoodId");
  return missing;
}
