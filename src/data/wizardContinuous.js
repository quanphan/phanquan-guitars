export const CONTINUOUS_START_STEP = 2;
export const CONTINUOUS_END_STEP = 5;
export const REVIEW_STEP = 6;

export const STEP_ONE_LIVE_KEYS = new Set(["instrument", "series", "shape"]);

export const CONFIG_GROUP_STEP = {
  instrument: 1,
  series: 1,
  shape: 1,
  bodyPieces: 2,
  bodyWood: 2,
  secondaryBodyWood: 2,
  topWood: 2,
  scale: 3,
  strings: 3,
  radius: 3,
  neckPieces: 3,
  neckWood: 3,
  secondaryNeckWood: 3,
  neckConstruction: 3,
  fingerboard: 3,
  neckProfile: 3,
  frets: 3,
  fretCount: 3,
  customerSuppliedParts: 4,
  pickupConfig: 4,
  pickupType: 4,
  bridge: 4,
  tuners: 4,
  hardwareFinish: 4,
  controls: 4,
  finishType: 5,
  finishColor: 5,
  customColor: 5,
  inlay: 5,
  engraving: 5,
  specialRequests: 5,
};

export const CONFIG_GROUP_TARGET_ID = {
  bodyPieces: "body-pieces",
  bodyWood: "main-body-wood",
  secondaryBodyWood: "secondary-body-wood",
  topWood: "top-wood",
  scale: "scale-length",
  strings: "string-count",
  radius: "fretboard-radius",
  neckPieces: "neck-pieces",
  neckWood: "main-neck-wood",
  secondaryNeckWood: "secondary-neck-wood",
  neckConstruction: "neck-construction",
  fingerboard: "fingerboard-wood",
  neckProfile: "neck-profile",
  frets: "fret-spec",
  fretCount: "fret-count",
  pickupConfig: "pickup-config",
  pickupType: "pickup-type",
  bridge: "bridge",
  tuners: "tuners",
  hardwareFinish: "hardware-finish",
  controls: "control-layout",
  finishType: "finish-type",
  finishColor: "finish-color",
  customColor: "custom-color-note",
  inlay: "inlay",
  engraving: "engraving",
  specialRequests: "special-requests",
};

export const FIELD_GROUP_KEY = {
  bodyConstructionId: "bodyPieces",
  bodyWoodId: "bodyWood",
  secondaryBodyWoodId: "secondaryBodyWood",
  topWoodId: "topWood",
  scaleId: "scale",
  stringCount: "strings",
  radiusId: "radius",
  neckPiecesId: "neckPieces",
  neckWoodId: "neckWood",
  secondaryNeckWoodId: "secondaryNeckWood",
  neckConstructionId: "neckConstruction",
  fingerboardWoodId: "fingerboard",
  neckProfileId: "neckProfile",
  fretSpecId: "frets",
  fretCount: "fretCount",
  pickupConfigId: "pickupConfig",
  pickupTypeId: "pickupType",
  bridgeId: "bridge",
  tunerId: "tuners",
  hardwareFinishId: "hardwareFinish",
  controlLayoutId: "controls",
  finishTypeId: "finishType",
  finishColorId: "finishColor",
};

export function isContinuousConfigStep(step) {
  return step >= CONTINUOUS_START_STEP && step <= CONTINUOUS_END_STEP;
}

export function nextWizardStep(currentStep, { stepOneComplete, configComplete } = {}) {
  if (currentStep <= 1) return stepOneComplete ? CONTINUOUS_START_STEP : 1;
  if (isContinuousConfigStep(currentStep)) return configComplete ? REVIEW_STEP : currentStep;
  return currentStep;
}

export function previousWizardStep(currentStep) {
  if (currentStep >= REVIEW_STEP) return CONTINUOUS_END_STEP;
  if (isContinuousConfigStep(currentStep)) return 1;
  return 1;
}

export function isConfiguredConfigGroup(group) {
  if (!group) return false;
  if ((group.items || []).length > 0) return true;
  return group.configured === true;
}

export function continuousConfigGroups(groups) {
  return (groups || []).filter(
    (group) => (
      group
      && !STEP_ONE_LIVE_KEYS.has(group.key)
      && group.key !== "customerSuppliedParts"
      && isConfiguredConfigGroup(group)
    ),
  );
}

function headingForStep(step, steps = []) {
  const meta = (steps || []).find((item) => item.id === step);
  return { type: "heading", step, key: meta?.key || `step-${step}` };
}

function sectionsFromGroups(list, steps = [], { fillSkippedSteps = false, keepSteps = [] } = {}) {
  const sections = [];
  let currentStep = 0;
  const emitHeading = (step) => {
    if (sections.some((item) => item.type === "heading" && item.step === step)) return;
    sections.push(headingForStep(step, steps));
  };
  (list || []).forEach((group) => {
    const step = CONFIG_GROUP_STEP[group.key] || currentStep;
    if (step !== currentStep) {
      if (fillSkippedSteps) {
        const from = currentStep === 0 ? step : currentStep + 1;
        for (let s = from; s <= step; s += 1) emitHeading(s);
      } else {
        for (const extra of keepSteps) {
          if (extra > currentStep && extra <= step) emitHeading(extra);
        }
        emitHeading(step);
      }
      currentStep = step;
    }
    sections.push({ type: "group", group });
  });
  if (!fillSkippedSteps) {
    for (const extra of keepSteps) {
      if (extra > currentStep) emitHeading(extra);
    }
  }
  return sections;
}

export function continuousConfigSections(groups, steps = []) {
  return sectionsFromGroups(continuousConfigGroups(groups), steps, { keepSteps: [4] });
}

export function wizardSummarySections(groups, steps = []) {
  return sectionsFromGroups((groups || []).filter(Boolean), steps, { fillSkippedSteps: true });
}

export function firstIncompleteGroupKey({
  stepTwoMissing = [],
  stepThreeMissing = [],
  stepFourComplete = true,
  stepFiveComplete = true,
  selections = {},
} = {}) {
  const fromFields = [...stepTwoMissing, ...stepThreeMissing]
    .map((item) => FIELD_GROUP_KEY[item?.key] || item?.key)
    .find(Boolean);
  if (fromFields) return fromFields;
  if (!stepFourComplete && !selections.customerSuppliedParts) return "pickupConfig";
  if (!stepFiveComplete) return "finishType";
  return null;
}

export function scrollToConfigGroup(groupKey) {
  if (typeof document === "undefined") return;
  const targetId = CONFIG_GROUP_TARGET_ID[groupKey] || (groupKey ? `wizard-config-${groupKey}` : "");
  const node = document.getElementById(targetId);
  node?.scrollIntoView({ behavior: "smooth", block: "center" });
  if (typeof node?.focus === "function") node.focus({ preventScroll: true });
}
