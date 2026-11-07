import { wizardOptionLabel } from "../data/wizardCatalog.js";
import { visibleReviewRows } from "../data/wizardDisplay.js";
import { sanitizeReferenceImages } from "../data/referenceImages.js";

function scaleDisplay(builder, t) {
  if (!builder?.scale) return null;
  if (builder.scale.type === "multiscale") {
    return (
      t("customBuild.step1.multiscaleHint")
        .replace("{bass}", builder.scale.bass)
        .replace("{treble}", builder.scale.treble) + ` (${builder.scale.display})`
    );
  }
  return builder.scale.display || null;
}

export function customBuildReviewGroups({ t, builder, optionName }) {
  const selections = builder?.selections || {};
  return [
    {
      title: t("customBuild.steps.instrumentShape"),
      rows: [
        { key: "instrument", label: t("customBuild.summary.instrument"), value: optionName(builder.instrumentType, "types") },
        { key: "series", label: t("customBuild.summary.series"), value: optionName(builder.series, "series") },
        { key: "shape", label: t("customBuild.summary.shape"), value: optionName(builder.shape, "shapes") },
        { key: "scale", label: t("customBuild.summary.scale"), value: scaleDisplay(builder, t) },
        {
          key: "strings",
          label: t("customBuild.summary.strings"),
          value:
            selections.stringCount != null
              ? t("customBuild.strings.count").replace("{count}", String(selections.stringCount))
              : null,
        },
        { key: "radius", label: t("customBuild.summary.radius"), value: builder.radius?.display ?? null },
      ],
    },
    {
      title: t("customBuild.steps.bodyTop"),
      rows: [
        { key: "bodyWood", label: t("customBuild.summary.bodyWood"), value: optionName(builder.bodyWood, "woods") },
        { key: "topWood", label: t("customBuild.summary.topWood"), value: optionName(builder.topWood, "woods") },
      ],
    },
    {
      title: t("customBuild.steps.neckFingerboard"),
      rows: [
        { key: "neckWood", label: t("customBuild.summary.neckWood"), value: optionName(builder.neckWood, "neckWoods") },
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
            builder.inheritedFretCount != null
              ? t("customBuild.step3.fretCountValue").replace("{count}", String(builder.inheritedFretCount))
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

  for (const group of customBuildReviewGroups({ t, builder, optionName })) {
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
