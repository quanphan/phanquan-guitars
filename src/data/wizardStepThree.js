import { isValidFretCountSelection } from "./wizardScaleAttributes.js";

export const STEP_THREE_FIELDS = [
  { key: "neckPiecesId", targetId: "neck-pieces", labelKey: "customBuild.step3.neckPiecesLabel" },
  { key: "neckWoodId", targetId: "main-neck-wood", labelKey: "customBuild.step3.mainWoodLabel" },
  { key: "secondaryNeckWoodId", targetId: "secondary-neck-wood", labelKey: "customBuild.step3.secondaryWoodLabel" },
  { key: "neckConstructionId", targetId: "neck-construction", labelKey: "customBuild.step3.constructionLabel" },
  { key: "fingerboardWoodId", targetId: "fingerboard-wood", labelKey: "customBuild.step3.fingerboardLabel" },
  { key: "neckProfileId", targetId: "neck-profile", labelKey: "customBuild.step3.profileLabel" },
  { key: "fretSpecId", targetId: "fret-spec", labelKey: "customBuild.step3.fretLabel" },
  { key: "fretCount", targetId: "fret-count", labelKey: "customBuild.step3.fretCountLabel" },
];

export function fingerboardMatchOptions(options) {
  return (options || []).map((option) => ({
    ...option,
    bodyWoodIds: [],
    topWoodIds: [],
  }));
}

export function collectStepThreeMissing(selections, available = {}) {
  const missing = [];
  function add(key) {
    const field = STEP_THREE_FIELDS.find((item) => item.key === key);
    if (field) missing.push(field);
  }
  if ((available.neckPieces || []).length > 0 && !selections?.neckPiecesId) add("neckPiecesId");
  if ((available.neckWoods || []).length > 0 && !selections?.neckWoodId) add("neckWoodId");
  if (available.usesSecondary && !selections?.secondaryNeckWoodId) add("secondaryNeckWoodId");
  if ((available.constructions || []).length > 0 && !selections?.neckConstructionId) add("neckConstructionId");
  if ((available.fingerboards || []).length > 0 && !selections?.fingerboardWoodId) add("fingerboardWoodId");
  if ((available.profiles || []).length > 0 && !selections?.neckProfileId) add("neckProfileId");
  if ((available.fretSpecs || []).length > 0 && !selections?.fretSpecId) add("fretSpecId");
  if (!isValidFretCountSelection(selections?.fretCount)) add("fretCount");
  return missing;
}
