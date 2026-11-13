import { optionDescription, optionLabel, wizardOptionLabel } from "./wizardCatalog.js";
import { isCustomScale, isValidFretCountSelection, parsePositiveFretCount, scaleDisplayValue } from "./wizardScaleAttributes.js";
import { isCustomerSuppliedParts, optionIdEquals } from "./wizardSelection.js";
import { usesSecondaryBodyWood, usesSecondaryNeckWood } from "./wizardSeriesConstruction.js";

function stringCountLabel(option, t, language) {
  if (!option) return "";
  const countTemplate = t("customBuild.strings.count");
  const fromOption = optionLabel(option, language, t);
  if (fromOption && !fromOption.includes("{count}")) return fromOption;
  if (countTemplate.includes("{count}") && option.value != null) {
    return countTemplate.replace("{count}", String(option.value));
  }
  return fromOption || String(option.value ?? option.id ?? "");
}

function named(option, language, t, groupKey) {
  if (!option) return "";
  return wizardOptionLabel(option, language, t, groupKey) || optionLabel(option, language, t) || option.name || "";
}

function constructionName(option, language) {
  return option?.translations?.[language]?.name || option?.translations?.en?.name || option?.name || option?.id || "";
}

function liveOptionValue(option, extra = {}) {
  if (typeof extra.resolveValue === "function") return extra.resolveValue(option);
  const candidates = [option?.id, option?.code, option?.wizardId];
  for (const value of candidates) {
    if (value == null || value === "") continue;
    if (typeof value === "string" || typeof value === "number") return value;
    const text = String(value);
    if (text && text !== "[object Object]") return text;
  }
  return "";
}

export function liveConfigEmptyLabel(t) {
  return t("customBuild.summary.empty");
}

export function buildLiveConfigGroups(builder, t, language) {
  const selections = builder.selections || {};
  const empty = liveConfigEmptyLabel(t);
  const selectable = (options, selectedId, labelFor, selectKey, extra = {}) => {
    const items = (options || []).map((option) => ({
      id: option.optionId || option.id,
      value: liveOptionValue(option, extra),
      label: labelFor(option),
      description: optionDescription(option, language),
      image: typeof option.image === "string" ? option.image : "",
      swatch: typeof option.swatch === "string" ? option.swatch : "",
      selected: extra.equals ? extra.equals(option, selectedId) : optionIdEquals(option, selectedId),
    }));
    return {
      items,
      selectable: extra.selectable !== false && items.length > 0,
      selectKey,
    };
  };

  const scaleLabel = builder.scale
    ? (isCustomScale(builder.scale)
      ? (selections.customScaleValue || t("customBuild.step1.customScaleLabel"))
      : scaleDisplayValue(builder.scale, selections.customScaleValue) || builder.scale.display || named(builder.scale, language, t, "scales"))
    : "";

  const groups = [
    {
      key: "instrument",
      label: t("customBuild.summary.instrument"),
      value: named(builder.instrumentType, language, t, "types") || empty,
      filled: Boolean(builder.instrumentType),
      ...selectable(builder.instrumentTypes, selections.instrumentTypeId, (item) => named(item, language, t, "types"), "instrumentTypeId", { selectable: false }),
    },
    {
      key: "series",
      label: t("customBuild.summary.series"),
      value: named(builder.series, language, t, "series") || empty,
      filled: Boolean(builder.series),
      ...selectable(builder.availableSeries, selections.seriesId, (item) => named(item, language, t, "series"), "seriesId", { selectable: false }),
    },
    {
      key: "shape",
      label: t("customBuild.summary.shape"),
      value: named(builder.shape, language, t, "shapes") || empty,
      filled: Boolean(builder.shape),
      ...selectable(builder.availableShapes, selections.shapeId, (item) => named(item, language, t, "shapes"), "shapeId", { selectable: false }),
    },
    {
      key: "bodyPieces",
      label: t("customBuild.summary.bodyPieces"),
      value: constructionName(builder.bodyConstruction, language) || empty,
      filled: Boolean(builder.bodyConstruction),
      ...selectable(builder.availableBodyConstructions, selections.bodyConstructionId, (item) => constructionName(item, language), "bodyConstructionId"),
    },
    {
      key: "bodyWood",
      label: t("customBuild.summary.mainBodyWood"),
      value: named(builder.bodyWood, language, t, "woods") || empty,
      filled: Boolean(builder.bodyWood),
      ...selectable(builder.availableBodyWoods, selections.bodyWoodId, (item) => named(item, language, t, "woods"), "bodyWoodId"),
    },
    usesSecondaryBodyWood(builder.bodyConstruction)
      ? {
          key: "secondaryBodyWood",
          label: t("customBuild.summary.secondaryBodyWood"),
          value: named(builder.secondaryBodyWood, language, t, "woods") || empty,
          filled: Boolean(builder.secondaryBodyWood),
          ...selectable(builder.availableBodyWoods, selections.secondaryBodyWoodId, (item) => named(item, language, t, "woods"), "secondaryBodyWoodId"),
        }
      : null,
    builder.topApplicable || builder.availableTopWoods?.length
      ? {
          key: "topWood",
          label: t("customBuild.summary.topWood"),
          value: named(builder.topWood, language, t, "woods") || empty,
          filled: Boolean(builder.topWood),
          ...selectable(builder.availableTopWoods, selections.topWoodId, (item) => named(item, language, t, "woods"), "topWoodId"),
        }
      : {
          key: "topWood",
          label: t("customBuild.summary.topWood"),
          value: empty,
          filled: false,
          items: [],
          selectable: false,
          selectKey: "topWoodId",
        },
    {
      key: "scale",
      label: t("customBuild.summary.scale"),
      value: scaleLabel || empty,
      filled: Boolean(scaleLabel),
      ...selectable(
        builder.availableScales,
        selections.scaleId,
        (item) => (isCustomScale(item) ? (optionLabel(item, language, t) || t("customBuild.step1.customScaleLabel")) : (scaleDisplayValue(item) || optionLabel(item, language, t))),
        "scaleId",
      ),
    },
    {
      key: "strings",
      label: t("customBuild.summary.strings"),
      value: selections.stringCount != null
        ? t("customBuild.strings.count").replace("{count}", String(selections.stringCount))
        : empty,
      filled: selections.stringCount != null,
      ...selectable(
        builder.availableStringCounts,
        selections.stringCount,
        (item) => stringCountLabel(item, t, language),
        "stringCount",
        {
          equals: (option, selected) => option.value != null && Number(option.value) === Number(selected),
          resolveValue: (option) => option.value,
        },
      ),
    },
    {
      key: "radius",
      label: t("customBuild.summary.radius"),
      value: builder.radius ? (optionLabel(builder.radius, language, t) || builder.radius.display || "") : empty,
      filled: Boolean(builder.radius),
      ...selectable(builder.availableRadii, selections.radiusId, (item) => optionLabel(item, language, t) || item.display || item.id, "radiusId"),
    },
    {
      key: "neckPieces",
      label: t("customBuild.summary.neckPieces"),
      value: constructionName(builder.neckPieces, language) || empty,
      filled: Boolean(builder.neckPieces),
      ...selectable(builder.availableNeckPieces, selections.neckPiecesId, (item) => constructionName(item, language), "neckPiecesId"),
    },
    {
      key: "neckWood",
      label: t("customBuild.summary.mainNeckWood"),
      value: named(builder.neckWood, language, t, "neckWoods") || empty,
      filled: Boolean(builder.neckWood),
      ...selectable(builder.availableNeckWoods, selections.neckWoodId, (item) => named(item, language, t, "neckWoods"), "neckWoodId"),
    },
    usesSecondaryNeckWood(builder.neckPieces)
      ? {
          key: "secondaryNeckWood",
          label: t("customBuild.summary.secondaryNeckWood"),
          value: named(builder.secondaryNeckWood, language, t, "neckWoods") || empty,
          filled: Boolean(builder.secondaryNeckWood),
          ...selectable(builder.availableNeckWoods, selections.secondaryNeckWoodId, (item) => named(item, language, t, "neckWoods"), "secondaryNeckWoodId"),
        }
      : null,
    {
      key: "neckConstruction",
      label: t("customBuild.summary.neckConstruction"),
      value: named(builder.neckConstruction, language, t, "constructions") || empty,
      filled: Boolean(builder.neckConstruction),
      ...selectable(builder.availableNeckConstructions, selections.neckConstructionId, (item) => named(item, language, t, "constructions"), "neckConstructionId"),
    },
    {
      key: "fingerboard",
      label: t("customBuild.summary.fingerboard"),
      value: named(builder.fingerboardWood, language, t, "fingerboards") || empty,
      filled: Boolean(builder.fingerboardWood),
      ...selectable(builder.availableFingerboardWoods, selections.fingerboardWoodId, (item) => named(item, language, t, "fingerboards"), "fingerboardWoodId"),
    },
    {
      key: "neckProfile",
      label: t("customBuild.summary.neckProfile"),
      value: named(builder.neckProfile, language, t, "profiles") || empty,
      filled: Boolean(builder.neckProfile),
      ...selectable(builder.availableNeckProfiles, selections.neckProfileId, (item) => named(item, language, t, "profiles"), "neckProfileId"),
    },
    {
      key: "frets",
      label: t("customBuild.summary.frets"),
      value: named(builder.fretSpec, language, t, "frets") || empty,
      filled: Boolean(builder.fretSpec),
      ...selectable(builder.availableFretSpecs, selections.fretSpecId, (item) => named(item, language, t, "frets"), "fretSpecId"),
    },
    {
      key: "fretCount",
      label: t("customBuild.summary.fretCount"),
      value: isValidFretCountSelection(selections.fretCount)
        ? t("customBuild.step3.fretCountValue").replace("{count}", String(parsePositiveFretCount(selections.fretCount)))
        : empty,
      filled: isValidFretCountSelection(selections.fretCount),
      items: [],
      selectable: false,
      selectKey: "fretCount",
    },
  ];

  if (isCustomerSuppliedParts(selections)) {
    groups.push({
      key: "customerSuppliedParts",
      label: t("customBuild.summary.customerSuppliedParts"),
      value: t("customBuild.step4.customerSuppliedSummary"),
      filled: true,
      items: [],
      selectable: false,
      selectKey: "customerSuppliedParts",
    });
  } else {
    groups.push(
      {
        key: "pickupConfig",
        label: t("customBuild.summary.pickupConfig"),
        value: named(builder.pickupConfig, language, t, "pickupConfigs") || empty,
        filled: Boolean(builder.pickupConfig),
        ...selectable(builder.availablePickupConfigs, selections.pickupConfigId, (item) => named(item, language, t, "pickupConfigs"), "pickupConfigId"),
      },
      {
        key: "pickupType",
        label: t("customBuild.summary.pickupType"),
        value: named(builder.pickupType, language, t, "pickupTypes") || empty,
        filled: Boolean(builder.pickupType),
        ...selectable(builder.availablePickupTypes, selections.pickupTypeId, (item) => named(item, language, t, "pickupTypes"), "pickupTypeId"),
      },
      {
        key: "bridge",
        label: t("customBuild.summary.bridge"),
        value: named(builder.bridge, language, t, "bridges") || empty,
        filled: Boolean(builder.bridge),
        ...selectable(builder.availableBridges, selections.bridgeId, (item) => named(item, language, t, "bridges"), "bridgeId"),
      },
      builder.tunersApplicable
        ? {
            key: "tuners",
            label: t("customBuild.summary.tuners"),
            value: named(builder.tuner, language, t, "tuners") || empty,
            filled: Boolean(builder.tuner),
            ...selectable(builder.availableTuners, selections.tunerId, (item) => named(item, language, t, "tuners"), "tunerId"),
          }
        : null,
      {
        key: "hardwareFinish",
        label: t("customBuild.summary.hardwareFinish"),
        value: named(builder.hardwareFinish, language, t, "hardwareFinishes") || empty,
        filled: Boolean(builder.hardwareFinish),
        ...selectable(builder.availableHardwareFinishes, selections.hardwareFinishId, (item) => named(item, language, t, "hardwareFinishes"), "hardwareFinishId"),
      },
      {
        key: "controls",
        label: t("customBuild.summary.controls"),
        value: named(builder.controlLayout, language, t, "controls") || empty,
        filled: Boolean(builder.controlLayout),
        ...selectable(builder.availableControlLayouts, selections.controlLayoutId, (item) => named(item, language, t, "controls"), "controlLayoutId"),
      },
    );
  }

  groups.push(
    {
      key: "finishType",
      label: t("customBuild.summary.finishType"),
      value: named(builder.finishType, language, t, "finishTypes") || empty,
      filled: Boolean(builder.finishType),
      ...selectable(builder.availableFinishTypes, selections.finishTypeId, (item) => named(item, language, t, "finishTypes"), "finishTypeId"),
    },
    {
      key: "finishColor",
      label: t("customBuild.summary.finishColor"),
      value: named(builder.finishColor, language, t, "finishColors") || empty,
      filled: Boolean(builder.finishColor),
      ...selectable(builder.availableFinishColors, selections.finishColorId, (item) => named(item, language, t, "finishColors"), "finishColorId"),
    },
    {
      key: "customColor",
      label: t("customBuild.summary.customColor"),
      value: selections.customColorNote?.trim() || empty,
      filled: Boolean(selections.customColorNote?.trim()),
      items: [],
      selectable: false,
      selectKey: "customColorNote",
    },
    {
      key: "inlay",
      label: t("customBuild.summary.inlay"),
      value: named(builder.inlay, language, t, "inlays") || empty,
      filled: Boolean(builder.inlay),
      ...selectable(builder.availableInlays, selections.inlayId, (item) => named(item, language, t, "inlays"), "inlayId"),
    },
    {
      key: "engraving",
      label: t("customBuild.summary.engraving"),
      value: named(builder.engraving, language, t, "engravings") || empty,
      filled: Boolean(builder.engraving),
      ...selectable(builder.availableEngravings, selections.engravingId, (item) => named(item, language, t, "engravings"), "engravingId"),
    },
    {
      key: "specialRequests",
      label: t("customBuild.summary.specialRequests"),
      value: selections.specialRequests?.trim() || empty,
      filled: Boolean(selections.specialRequests?.trim()),
      items: [],
      selectable: false,
      selectKey: "specialRequests",
    },
  );

  return groups.filter(Boolean);
}

export function applyLiveConfigSelection(builder, selectKey, value) {
  const actions = {
    bodyConstructionId: builder.selectBodyConstruction,
    bodyWoodId: builder.selectBodyWood,
    secondaryBodyWoodId: builder.selectSecondaryBodyWood,
    topWoodId: builder.selectTopWood,
    scaleId: builder.selectScale,
    stringCount: builder.selectStringCount,
    radiusId: builder.selectRadius,
    neckPiecesId: builder.selectNeckPieces,
    neckWoodId: builder.selectNeckWood,
    secondaryNeckWoodId: builder.selectSecondaryNeckWood,
    neckConstructionId: builder.selectNeckConstruction,
    fingerboardWoodId: builder.selectFingerboardWood,
    neckProfileId: builder.selectNeckProfile,
    fretSpecId: builder.selectFretSpec,
    fretCount: builder.selectFretCount,
    pickupConfigId: builder.selectPickupConfig,
    pickupTypeId: builder.selectPickupType,
    bridgeId: builder.selectBridge,
    tunerId: builder.selectTuner,
    hardwareFinishId: builder.selectHardwareFinish,
    controlLayoutId: builder.selectControlLayout,
    finishTypeId: builder.selectFinishType,
    finishColorId: builder.selectFinishColor,
    inlayId: builder.selectInlay,
    engravingId: builder.selectEngraving,
  };
  const action = actions[selectKey];
  if (typeof action !== "function") return false;
  if (value == null || value === "" || typeof value === "object") return false;
  action(value);
  return true;
}
