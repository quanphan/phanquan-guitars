import { optionLabel, wizardOptionLabel } from "../data/wizardCatalog.js";
import { visibleReviewRows } from "../data/wizardDisplay.js";
import { sanitizeReferenceImages } from "../data/referenceImages.js";
import { isCustomScale, isMultiscale, scaleDisplayValue } from "../data/wizardScaleAttributes.js";
import { usesSecondaryBodyWood, usesSecondaryNeckWood } from "../data/wizardSeriesConstruction.js";

function scaleDisplay(builder, t) {
  if (!builder?.scale) return null;
  const display = scaleDisplayValue(builder.scale);
  if (isCustomScale(builder.scale)) {
    return builder.selections?.customScaleValue || t("customBuild.step1.customScaleLabel");
  }
  if (isMultiscale(builder.scale)) {
    return (
      t("customBuild.step1.multiscaleHint")
        .replace("{bass}", builder.scale.bass)
        .replace("{treble}", builder.scale.treble) + (display ? ` (${display})` : "")
    );
  }
  return display || null;
}

export function customBuildReviewGroups({ t, builder, optionName, language }) {
  const selections = builder?.selections || {};
  return [
    {
      title: t("customBuild.steps.instrumentShape"),
      rows: [
        { key: "instrument", label: t("customBuild.summary.instrument"), value: optionName(builder.instrumentType, "types") },
        { key: "series", label: t("customBuild.summary.series"), value: optionName(builder.series, "series") },
        { key: "shape", label: t("customBuild.summary.shape"), value: optionName(builder.shape, "shapes") },
      ],
    },
    {
      title: t("customBuild.steps.bodyTop"),
      rows: [
        {
          key: "bodyPieces",
          label: t("customBuild.summary.bodyPieces"),
          value: builder.bodyConstruction?.translations?.[language]?.name
            || builder.bodyConstruction?.translations?.en?.name
            || builder.bodyConstruction?.name
            || null,
        },
        { key: "bodyWood", label: t("customBuild.summary.mainBodyWood"), value: optionName(builder.bodyWood, "woods") },
        {
          key: "secondaryBodyWood",
          label: t("customBuild.summary.secondaryBodyWood"),
          value: usesSecondaryBodyWood(builder.bodyConstruction)
            ? optionName(builder.secondaryBodyWood, "woods")
            : null,
        },
        { key: "topWood", label: t("customBuild.summary.topWood"), value: optionName(builder.topWood, "woods") },
      ],
    },
    {
      title: t("customBuild.steps.neckFingerboard"),
      rows: [
        { key: "scale", label: t("customBuild.summary.scale"), value: scaleDisplay(builder, t) },
        {
          key: "strings",
          label: t("customBuild.summary.strings"),
          value:
            selections.stringCount != null
              ? t("customBuild.strings.count").replace("{count}", String(selections.stringCount))
              : null,
        },
        {
          key: "radius",
          label: t("customBuild.summary.radius"),
          value: builder.radius ? (optionLabel(builder.radius, language, t) || builder.radius.display || null) : null,
        },
        {
          key: "neckPieces",
          label: t("customBuild.summary.neckPieces"),
          value: builder.neckPieces?.translations?.[language]?.name
            || builder.neckPieces?.translations?.en?.name
            || builder.neckPieces?.name
            || null,
        },
        { key: "neckWood", label: t("customBuild.summary.mainNeckWood"), value: optionName(builder.neckWood, "neckWoods") },
        {
          key: "secondaryNeckWood",
          label: t("customBuild.summary.secondaryNeckWood"),
          value: usesSecondaryNeckWood(builder.neckPieces)
            ? optionName(builder.secondaryNeckWood, "neckWoods")
            : null,
        },
        {
          key: "neckConstruction",
          label: t("customBuild.summary.neckConstruction"),
          value: optionName(builder.neckConstruction, "constructions"),
        },
        {
          key: "fingerboard",
          label: t("customBuild.summary.fingerboard"),
          value: optionName(builder.fingerboardWood, "fingerboards"),
        },
        { key: "neckProfile", label: t("customBuild.summary.neckProfile"), value: optionName(builder.neckProfile, "profiles") },
        { key: "frets", label: t("customBuild.summary.frets"), value: optionName(builder.fretSpec, "frets") },
        {
          key: "fretCount",
          label: t("customBuild.summary.fretCount"),
          value:
            (builder.fretCount ?? builder.inheritedFretCount) != null
              ? t("customBuild.step3.fretCountValue").replace(
                  "{count}",
                  String(builder.fretCount ?? builder.inheritedFretCount),
                )
              : null,
        },
      ],
    },
    {
      title: t("customBuild.steps.electronicsHardware"),
      rows: selections.customerSuppliedParts
        ? [
            {
              key: "customerSuppliedParts",
              label: t("customBuild.summary.customerSuppliedParts"),
              value: t("customBuild.step4.customerSuppliedSummary"),
            },
          ]
        : [
            {
              key: "pickupConfig",
              label: t("customBuild.summary.pickupConfig"),
              value: optionName(builder.pickupConfig, "pickupConfigs"),
            },
            {
              key: "pickupType",
              label: t("customBuild.summary.pickupType"),
              value: optionName(builder.pickupType, "pickupTypes"),
            },
            { key: "bridge", label: t("customBuild.summary.bridge"), value: optionName(builder.bridge, "bridges") },
            { key: "tuners", label: t("customBuild.summary.tuners"), value: optionName(builder.tuner, "tuners") },
            {
              key: "hardwareFinish",
              label: t("customBuild.summary.hardwareFinish"),
              value: optionName(builder.hardwareFinish, "hardwareFinishes"),
            },
            {
              key: "controls",
              label: t("customBuild.summary.controls"),
              value: optionName(builder.controlLayout, "controls"),
            },
          ],
    },
    {
      title: t("customBuild.steps.finishDetails"),
      rows: [
        {
          key: "finishType",
          label: t("customBuild.summary.finishType"),
          value: optionName(builder.finishType, "finishTypes"),
        },
        {
          key: "finishColor",
          label: t("customBuild.summary.finishColor"),
          value: optionName(builder.finishColor, "finishColors"),
        },
        {
          key: "customColor",
          label: t("customBuild.summary.customColor"),
          value: selections.customColorNote?.trim() || null,
        },
        { key: "inlay", label: t("customBuild.summary.inlay"), value: optionName(builder.inlay, "inlays") },
        {
          key: "engraving",
          label: t("customBuild.summary.engraving"),
          value: optionName(builder.engraving, "engravings"),
        },
        {
          key: "specialRequests",
          label: t("customBuild.summary.specialRequests"),
          value: selections.specialRequests?.trim() || null,
        },
      ],
    },
  ];
}

export function buildCustomBuildChatSummary({ builder, language, t }) {
  const selections = builder?.selections || {};
  const optionName = (option, group) => wizardOptionLabel(option, language, t, group) || null;
  const lines = [`${t("cart.share.website")}: PhanQuan Guitars`];
  const name = String(selections.contactName || "").trim();
  const email = String(selections.contactEmail || "").trim();
  const phone = String(selections.contactPhone || "").trim();
  const country = String(selections.contactCountry || "").trim();
  if (name) lines.push(`${t("customBuild.step6.fields.name")}: ${name}`);
  if (email) lines.push(`${t("customBuild.step6.fields.email")}: ${email}`);
  if (phone) lines.push(`${t("customBuild.step6.fields.phone")}: ${phone}`);
  if (country) lines.push(`${t("customBuild.step6.fields.country")}: ${country}`);

  for (const group of customBuildReviewGroups({ t, builder, optionName, language })) {
    const rows = visibleReviewRows(group.rows);
    if (!rows.length) continue;
    lines.push("");
    lines.push(group.title);
    for (const row of rows) {
      lines.push(`${row.label}: ${row.value}`);
    }
  }

  const message = String(selections.contactMessage || "").trim();
  if (message) {
    lines.push("");
    lines.push(`${t("customBuild.step6.fields.message")}:`);
    lines.push(message);
  }

  const images = sanitizeReferenceImages(selections.referenceImages);
  if (images.length) {
    lines.push("");
    lines.push(`${t("customBuild.step6.fields.referenceImages")}: ${images.length}`);
    images.forEach((path) => lines.push(path));
  }

  return lines.join("\n").trim();
}
