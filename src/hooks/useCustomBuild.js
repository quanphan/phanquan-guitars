import { useEffect, useMemo, useRef, useState } from "react";
import {
  BUILDER_STEPS,
  CONTACT_MESSAGE_MAX,
  CUSTOM_COLOR_MAX,
  SPECIAL_REQUEST_MAX,
  isContactComplete,
  getFirstIncompleteStep,
  validateContact,
  getAvailableBodyWoods,
  getAvailableBridges,
  getAvailableControlLayouts,
  getAvailableEngravings,
  getAvailableFingerboardWoods,
  getAvailableFinishColors,
  getAvailableFinishTypes,
  getAvailableFretSpecs,
  getAvailableHardwareFinishes,
  getAvailableInlays,
  getAvailableNeckConstructions,
  getAvailableNeckProfiles,
  getAvailableNeckWoods,
  getAvailablePickupConfigs,
  getAvailablePickupTypes,
  getAvailableRadii,
  getAvailableScales,
  getAvailableSeries,
  getAvailableShapes,
  getAvailableStringCounts,
  getAvailableTopWoods,
  getAvailableTuners,
  getBodyWoodById,
  getBridgeById,
  getControlLayoutById,
  getEngravingById,
  getFingerboardWoodById,
  getFinishColorById,
  getFinishTypeById,
  getFretSpecById,
  getHardwareFinishById,
  getInheritedFretCount,
  getInlayById,
  getInstrumentTypeById,
  getNeckConstructionById,
  getNeckProfileById,
  getNeckWoodById,
  getPickupConfigById,
  getPickupTypeById,
  getRadiusById,
  getScaleById,
  getSeriesById,
  getShapeById,
  getTopWoodById,
  getTunerById,
  isHeadlessSeries,
  isStepFiveComplete,
  isStepFourComplete,
  isStepOneComplete,
  isStepThreeComplete,
  isStepTwoComplete,
  isTopApplicable,
  isTunersApplicable,
  pruneSelections,
} from "../data/customBuild.js";
import {
  INQUIRY_CODES,
  isCustomBuildInquiryConfigured,
  submitCustomBuildInquiry,
} from "../services/customBuildService.js";
import { nextSubmitAction } from "../utils/customBuildSubmitFlow.js";
import { debugSubmit } from "../utils/submitDebug.js";
import {
  buildPersistedDraft,
  clearCustomBuildDraft,
  createEmptyDraft,
  readCustomBuildDraft,
  writeCustomBuildDraft,
} from "../data/customBuildDraft.js";

function getInitialBuilderState() {
  const stored = readCustomBuildDraft();
  if (stored) return stored;
  return createEmptyDraft();
}

export function useCustomBuild() {
  const [initial] = useState(getInitialBuilderState);
  const draftMetaRef = useRef({
    draftId: initial.draftId,
    createdAt: initial.createdAt,
    expiresAt: initial.expiresAt,
    updatedAt: initial.updatedAt,
  });
  const skipAutosaveRef = useRef(true);
  const persistableRef = useRef({
    currentStep: initial.currentStep,
    selections: initial.selections,
    submitStatus: initial.submitStatus,
    inquiryReference: initial.inquiryReference,
  });

  const [currentStep, setCurrentStep] = useState(initial.currentStep);
  const [selections, setSelections] = useState(initial.selections);
  const [contactErrors, setContactErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(initial.submitStatus);
  const [inquiryReference, setInquiryReference] = useState(
    initial.inquiryReference,
  );
  const [submitIssues, setSubmitIssues] = useState([]);
  const [configIssueStep, setConfigIssueStep] = useState(null);
  const submitLockRef = useRef(false);
  const [submitAttempt, setSubmitAttempt] = useState(0);

  const update = (patch) => {
    setSelections((previous) => pruneSelections({ ...previous, ...patch }));
  };

  const availableSeries = getAvailableSeries(selections);
  const availableShapes = getAvailableShapes(selections);
  const availableScales = getAvailableScales(selections);
  const availableStringCounts = getAvailableStringCounts(selections);
  const availableRadii = getAvailableRadii(selections);
  const availableBodyWoods = getAvailableBodyWoods(selections);
  const availableTopWoods = getAvailableTopWoods(selections);
  const availableNeckWoods = getAvailableNeckWoods(selections);
  const availableNeckConstructions = getAvailableNeckConstructions(selections);
  const availableFingerboardWoods = getAvailableFingerboardWoods(selections);
  const availableNeckProfiles = getAvailableNeckProfiles(selections);
  const availableFretSpecs = getAvailableFretSpecs(selections);
  const availablePickupConfigs = getAvailablePickupConfigs(selections);
  const availablePickupTypes = getAvailablePickupTypes(selections);
  const availableBridges = getAvailableBridges(selections);
  const availableTuners = getAvailableTuners(selections);
  const availableHardwareFinishes = getAvailableHardwareFinishes(selections);
  const availableControlLayouts = getAvailableControlLayouts(selections);
  const availableFinishTypes = getAvailableFinishTypes(selections);
  const availableFinishColors = getAvailableFinishColors(selections);
  const availableInlays = getAvailableInlays(selections);
  const availableEngravings = getAvailableEngravings(selections);
  const inheritedFretCount = getInheritedFretCount(selections);
  const topApplicable = isTopApplicable(selections);
  const tunersApplicable = isTunersApplicable(selections);
  const headless = isHeadlessSeries(selections);
  const totalSteps = BUILDER_STEPS.length;

  const selectInstrumentType = (instrumentTypeId) => {
    update({ instrumentTypeId });
  };

  const selectSeries = (seriesId) => {
    update({ seriesId });
  };

  const selectShape = (shapeId) => {
    update({ shapeId });
  };

  const selectScale = (scaleId) => {
    update({ scaleId });
  };

  const selectStringCount = (stringCount) => {
    update({ stringCount });
  };

  const selectRadius = (radiusId) => {
    update({ radiusId });
  };

  const selectBodyWood = (bodyWoodId) => {
    update({ bodyWoodId });
  };

  const selectTopWood = (topWoodId) => {
    update({ topWoodId });
  };

  const selectNeckWood = (neckWoodId) => {
    update({ neckWoodId });
  };

  const selectNeckConstruction = (neckConstructionId) => {
    update({ neckConstructionId });
  };

  const selectFingerboardWood = (fingerboardWoodId) => {
    update({ fingerboardWoodId });
  };

  const selectNeckProfile = (neckProfileId) => {
    update({ neckProfileId });
  };

  const selectFretSpec = (fretSpecId) => {
    update({ fretSpecId });
  };

  const selectPickupConfig = (pickupConfigId) => {
    update({ pickupConfigId });
  };

  const selectPickupType = (pickupTypeId) => {
    update({ pickupTypeId });
  };

  const selectBridge = (bridgeId) => {
    update({ bridgeId });
  };

  const selectTuner = (tunerId) => {
    update({ tunerId });
  };

  const selectHardwareFinish = (hardwareFinishId) => {
    update({ hardwareFinishId });
  };

  const selectControlLayout = (controlLayoutId) => {
    update({ controlLayoutId });
  };

  const selectFinishType = (finishTypeId) => {
    update({ finishTypeId });
  };

  const selectFinishColor = (finishColorId) => {
    update({ finishColorId });
  };

  const setCustomColorNote = (customColorNote) => {
    update({ customColorNote });
  };

  const selectInlay = (inlayId) => {
    update({ inlayId });
  };

  const selectEngraving = (engravingId) => {
    update({ engravingId });
  };

  const setSpecialRequests = (specialRequests) => {
    update({ specialRequests });
  };

  const setContactName = (contactName) => {
    update({ contactName });
  };

  const setContactEmail = (contactEmail) => {
    update({ contactEmail });
  };

  const setContactCountry = (contactCountry) => {
    update({ contactCountry });
  };

  const setContactPhone = (contactPhone) => {
    update({ contactPhone });
  };

  const setContactMessage = (contactMessage) => {
    update({ contactMessage });
  };

  const setAcknowledgement = (acknowledgement) => {
    update({ acknowledgement });
  };

  const stepOneComplete = isStepOneComplete(selections);
  const stepTwoComplete = isStepTwoComplete(selections);
  const stepThreeComplete = isStepThreeComplete(selections);
  const stepFourComplete = isStepFourComplete(selections);
  const stepFiveComplete = isStepFiveComplete(selections);
  const canContinue =
    currentStep === 1
      ? stepOneComplete
      : currentStep === 2
        ? stepTwoComplete
        : currentStep === 3
          ? stepThreeComplete
          : currentStep === 4
            ? stepFourComplete
            : currentStep === 5
              ? stepFiveComplete
              : currentStep < totalSteps;

  const goNext = () => {
    if (!canContinue) return;
    setCurrentStep((step) => Math.min(step + 1, totalSteps));
  };

  const goBack = () => {
    if (submitStatus === "success" || submitStatus === "submitting") return;
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const goToStep = (step) => {
    if (submitStatus === "success" || submitStatus === "submitting") return;
    if (step < 1 || step > totalSteps) return;
    setCurrentStep(step);
  };

  const persistDraft = (snapshot, { refreshExpiry = true } = {}) => {
    const draft = buildPersistedDraft({
      previous: draftMetaRef.current,
      ...snapshot,
      refreshExpiry,
    });
    draftMetaRef.current = {
      draftId: draft.draftId,
      createdAt: draft.createdAt,
      expiresAt: draft.expiresAt,
      updatedAt: draft.updatedAt,
    };
    persistableRef.current = snapshot;
    writeCustomBuildDraft(draft);
  };

  const reset = () => {
    if (submitStatus === "submitting") return;
    const empty = createEmptyDraft();
    draftMetaRef.current = {
      draftId: empty.draftId,
      createdAt: empty.createdAt,
      expiresAt: empty.expiresAt,
      updatedAt: empty.updatedAt,
    };
    persistableRef.current = {
      currentStep: empty.currentStep,
      selections: empty.selections,
      submitStatus: empty.submitStatus,
      inquiryReference: empty.inquiryReference,
    };
    skipAutosaveRef.current = true;
    submitLockRef.current = false;
    clearCustomBuildDraft();
    writeCustomBuildDraft(empty);
    setSelections(empty.selections);
    setContactErrors({});
    setSubmitIssues([]);
    setConfigIssueStep(null);
    setSubmitStatus(empty.submitStatus);
    setInquiryReference(empty.inquiryReference);
    setCurrentStep(empty.currentStep);
  };

  const submitInquiry = async (language) => {
    const attempt = async (allowStaleRetry) => {
      const incompleteStep = getFirstIncompleteStep(selections);
      const errors = validateContact(selections);
      const contactErrorKeys = Object.keys(errors);
      const configured = isCustomBuildInquiryConfigured();
      const decision = nextSubmitAction({
        locked: submitLockRef.current,
        status: submitStatus,
        incompleteStep,
        contactErrorKeys,
        configured,
      });

      debugSubmit("decision", {
        action: decision.action,
        status: submitStatus,
        incompleteStep: incompleteStep ?? 0,
        contactFieldCount: contactErrorKeys.length,
        configured,
      });

      if (decision.action === "stale-lock" && allowStaleRetry) {
        submitLockRef.current = false;
        debugSubmit("stale-lock-cleared", { status: submitStatus });
        return attempt(false);
      }

      if (
        decision.action === "ignore-duplicate" ||
        decision.action === "ignore-success" ||
        decision.action === "stale-lock"
      ) {
        return;
      }

      setSubmitAttempt((count) => count + 1);

      if (decision.action === "invalid-config") {
        setConfigIssueStep(incompleteStep);
        setSubmitIssues([]);
        setSubmitStatus("invalid-config");
        setCurrentStep(incompleteStep);
        return;
      }

      if (decision.action === "invalid") {
        setContactErrors(errors);
        setConfigIssueStep(null);
        setSubmitStatus("invalid");
        return;
      }

      if (decision.action === "unavailable") {
        setSubmitStatus("unavailable");
        return;
      }

      submitLockRef.current = true;
      setContactErrors({});
      setSubmitIssues([]);
      setConfigIssueStep(null);
      setSubmitStatus("submitting");
      debugSubmit("request-start", { phase: "options-validate-inquiry" });

      try {
        const result = await submitCustomBuildInquiry({
          selections,
          language,
          draftId: draftMetaRef.current.draftId,
          finishSheen: getFinishTypeById(selections.finishTypeId)?.sheen,
        });
        debugSubmit("request-end", {
          ok: Boolean(result?.ok),
          confirmed: Boolean(result?.confirmed),
          hasReference: Boolean(result?.reference),
          code: result?.code ?? "",
        });
        if (result?.ok && result.confirmed && result.reference) {
          setInquiryReference(result.reference);
          setSubmitStatus("success");
          return;
        }
        submitLockRef.current = false;
        const mappedContactErrors = result?.contactErrors ?? {};
        if (Object.keys(mappedContactErrors).length > 0) {
          setContactErrors(mappedContactErrors);
        }
        setSubmitIssues(result?.details ?? []);
        if (result?.code === INQUIRY_CODES.UNAVAILABLE) {
          setSubmitStatus("unavailable");
          return;
        }
        if (result?.code === INQUIRY_CODES.NETWORK) {
          setSubmitStatus("network");
          return;
        }
        if (result?.code === INQUIRY_CODES.VALIDATION) {
          setSubmitStatus(
            Object.keys(mappedContactErrors).length > 0
              ? "invalid"
              : "invalid-config",
          );
          return;
        }
        setSubmitStatus("failure");
      } catch (error) {
        debugSubmit("request-exception", { name: error?.name ?? "Error" });
        submitLockRef.current = false;
        setSubmitStatus("failure");
      }
    };

    await attempt(true);
  };

  useEffect(() => {
    setContactErrors((previous) => {
      const keys = Object.keys(previous);
      if (keys.length === 0) return previous;
      const latest = validateContact(selections);
      const next = {};
      for (const key of keys) {
        if (latest[key]) next[key] = latest[key];
      }
      const previousKeys = keys.join(",");
      const nextKeys = Object.keys(next).join(",");
      const sameValues = nextKeys
        .split(",")
        .every((key) => !key || previous[key] === next[key]);
      if (previousKeys === nextKeys && sameValues) return previous;
      return next;
    });
  }, [selections]);

  useEffect(() => {
    persistableRef.current = {
      currentStep,
      selections,
      submitStatus,
      inquiryReference,
    };
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      persistDraft(
        {
          currentStep,
          selections,
          submitStatus,
          inquiryReference,
        },
        { refreshExpiry: false },
      );
      return;
    }
    persistDraft({
      currentStep,
      selections,
      submitStatus,
      inquiryReference,
    });
  }, [currentStep, selections, submitStatus, inquiryReference]);

  const currentStepMeta = useMemo(
    () => BUILDER_STEPS.find((step) => step.id === currentStep) ?? BUILDER_STEPS[0],
    [currentStep],
  );

  return {
    currentStep,
    currentStepMeta,
    totalSteps,
    steps: BUILDER_STEPS,
    selections,
    instrumentType: getInstrumentTypeById(selections.instrumentTypeId),
    series: getSeriesById(selections.seriesId),
    shape: getShapeById(selections.shapeId),
    scale: getScaleById(selections.scaleId),
    radius: getRadiusById(selections.radiusId),
    bodyWood: getBodyWoodById(selections.bodyWoodId),
    topWood: getTopWoodById(selections.topWoodId),
    neckWood: getNeckWoodById(selections.neckWoodId),
    neckConstruction: getNeckConstructionById(selections.neckConstructionId),
    fingerboardWood: getFingerboardWoodById(selections.fingerboardWoodId),
    neckProfile: getNeckProfileById(selections.neckProfileId),
    fretSpec: getFretSpecById(selections.fretSpecId),
    pickupConfig: getPickupConfigById(selections.pickupConfigId),
    pickupType: getPickupTypeById(selections.pickupTypeId),
    bridge: getBridgeById(selections.bridgeId),
    tuner: getTunerById(selections.tunerId),
    hardwareFinish: getHardwareFinishById(selections.hardwareFinishId),
    controlLayout: getControlLayoutById(selections.controlLayoutId),
    finishType: getFinishTypeById(selections.finishTypeId),
    finishColor: getFinishColorById(selections.finishColorId),
    inlay: getInlayById(selections.inlayId),
    engraving: getEngravingById(selections.engravingId),
    inheritedFretCount,
    availableSeries,
    availableShapes,
    availableScales,
    availableStringCounts,
    availableRadii,
    availableBodyWoods,
    availableTopWoods,
    availableNeckWoods,
    availableNeckConstructions,
    availableFingerboardWoods,
    availableNeckProfiles,
    availableFretSpecs,
    availablePickupConfigs,
    availablePickupTypes,
    availableBridges,
    availableTuners,
    availableHardwareFinishes,
    availableControlLayouts,
    availableFinishTypes,
    availableFinishColors,
    availableInlays,
    availableEngravings,
    topApplicable,
    tunersApplicable,
    headless,
    customColorMax: CUSTOM_COLOR_MAX,
    specialRequestMax: SPECIAL_REQUEST_MAX,
    contactMessageMax: CONTACT_MESSAGE_MAX,
    stepOneComplete,
    stepTwoComplete,
    stepThreeComplete,
    stepFourComplete,
    stepFiveComplete,
    contactComplete: isContactComplete(selections),
    contactErrors,
    submitIssues,
    configIssueStep,
    submitStatus,
    inquiryReference,
    inquiryConfigured: isCustomBuildInquiryConfigured(),
    submitAttempt,
    canContinue,
    selectInstrumentType,
    selectSeries,
    selectShape,
    selectScale,
    selectStringCount,
    selectRadius,
    selectBodyWood,
    selectTopWood,
    selectNeckWood,
    selectNeckConstruction,
    selectFingerboardWood,
    selectNeckProfile,
    selectFretSpec,
    selectPickupConfig,
    selectPickupType,
    selectBridge,
    selectTuner,
    selectHardwareFinish,
    selectControlLayout,
    selectFinishType,
    selectFinishColor,
    setCustomColorNote,
    selectInlay,
    selectEngraving,
    setSpecialRequests,
    setContactName,
    setContactEmail,
    setContactCountry,
    setContactPhone,
    setContactMessage,
    setAcknowledgement,
    goNext,
    goBack,
    goToStep,
    submitInquiry,
    reset,
  };
}
