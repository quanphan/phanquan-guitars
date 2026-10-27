import { sanitizeReferenceImages } from "../data/referenceImages.js";
import {
  humanizeOptionId,
  optionLabel,
  optionMatchesAlias,
  translatedLabel,
} from "../data/wizardCatalog.js";

export { humanizeOptionId };

const SCALE_DISPLAY = {
  "24.75": "24.75″",
  "25.5": "25.5″",
  "27": "27″",
  "25-25.5-multi": "25″–25.5″",
  "34": "34″",
};

const RADIUS_DISPLAY = {
  "compound-12-16": "12″–16″ compound",
  "16": "16″",
};

const API_TO_WIZARD = {
  "instrument-type": {
    field: "instrumentTypeId",
    map: {
      "instrument-type.solid-body-electric": "electric-guitar",
      "instrument-type.electric-bass": "bass",
      "instrument-type.acoustic": "acoustic-guitar",
    },
  },
  "body-shape": {
    field: "shapeId",
    map: {
      "body-shape.double-cut": "double-cut",
      "body-shape.offset": "offset",
      "body-shape.slab": "t-style",
    },
  },
  "body-wood": {
    field: "bodyWoodId",
    map: {
      "body-wood.alder": "alder",
      "body-wood.mahogany": "mahogany",
      "body-wood.swamp-ash": "swamp-ash",
    },
  },
  "top-wood": {
    field: "topWoodId",
    map: {
      "top-wood.no-separate-top": "none",
    },
  },
  "neck-wood": {
    field: "neckWoodId",
    map: {
      "neck-wood.roasted-maple": "roasted-maple",
      "neck-wood.mahogany": "mahogany",
    },
  },
  "fingerboard": {
    field: "fingerboardWoodId",
    map: {
      "fingerboard.ebony": "ebony",
      "fingerboard.maple": "roasted-maple-board",
    },
  },
  bridge: {
    field: "bridgeId",
    map: {
      "bridge.hardtail": "hardtail",
    },
  },
  hardware: {
    field: "hardwareFinishId",
    map: {
      "hardware.black": "black",
    },
  },
};

export function parseInquiryNotes(notes) {
  const metadata = {
    draftId: null,
    language: null,
    country: null,
    inquiryType: null,
    productId: null,
    productRef: null,
    subject: null,
  };
  const wizard = {};
  const extra = [];
  if (typeof notes !== "string" || !notes.trim()) {
    return { metadata, wizard, extra };
  }

  let inWizard = false;
  for (const rawLine of notes.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^wizard:?$/i.test(line)) {
      inWizard = true;
      continue;
    }
    const separator = line.indexOf("=");
    if (separator <= 0) {
      extra.push(line);
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (
      !inWizard &&
      (key === "draftId" ||
        key === "language" ||
        key === "country" ||
        key === "inquiryType" ||
        key === "productId" ||
        key === "productRef" ||
        key === "subject")
    ) {
      metadata[key] = value || null;
      continue;
    }
    if (
      inWizard ||
      key.endsWith("Id") ||
      key === "stringCount" ||
      key === "customColorNote" ||
      key === "specialRequests" ||
      key === "customerSuppliedParts"
    ) {
      wizard[key] = key === "customerSuppliedParts" ? value === "true" || value === "1" : value;
      continue;
    }
    extra.push(line);
  }

  return { metadata, wizard, extra };
}

function named(t, key) {
  return translatedLabel(t, key) || null;
}

function wizardFromCatalog(selections) {
  const wizard = {};
  if (!selections || typeof selections !== "object") return wizard;
  for (const [categoryId, mapping] of Object.entries(API_TO_WIZARD)) {
    const raw = selections[categoryId];
    const optionId = Array.isArray(raw) ? raw[0] : raw;
    const mapped = mapping.map[optionId];
    if (mapped) wizard[mapping.field] = mapped;
  }
  return wizard;
}

const CHOICE_I18N = {
  instrumentTypeId: (id) => `customBuild.types.${id}`,
  seriesId: (id) => `customBuild.series.${id}.name`,
  shapeId: (id) => `customBuild.shapes.${id}.name`,
  bodyWoodId: (id) => `customBuild.woods.${id}.name`,
  topWoodId: (id) => `customBuild.woods.${id}.name`,
  neckWoodId: (id) => `customBuild.neckWoods.${id}.name`,
  neckConstructionId: (id) => `customBuild.constructions.${id}.name`,
  fingerboardWoodId: (id) => `customBuild.fingerboards.${id}.name`,
  neckProfileId: (id) => `customBuild.profiles.${id}.name`,
  fretSpecId: (id) => `customBuild.frets.${id}.name`,
  pickupConfigId: (id) => `customBuild.pickupConfigs.${id}.name`,
  pickupTypeId: (id) => `customBuild.pickupTypes.${id}.name`,
  bridgeId: (id) => `customBuild.bridges.${id}.name`,
  tunerId: (id) => `customBuild.tuners.${id}.name`,
  hardwareFinishId: (id) => `customBuild.hardwareFinishes.${id}.name`,
  controlLayoutId: (id) => `customBuild.controls.${id}.name`,
  finishTypeId: (id) => `customBuild.finishTypes.${id}.name`,
  finishColorId: (id) => `customBuild.finishColors.${id}.name`,
  inlayId: (id) => `customBuild.inlays.${id}.name`,
  engravingId: (id) => `customBuild.engravings.${id}.name`,
};

function findCatalogOption(catalog, optionId) {
  if (!catalog || optionId == null || optionId === "") return null;
  for (const category of catalog.categories || []) {
    const option = (category.options || []).find((item) => optionMatchesAlias(item, category.id, optionId));
    if (option) return option;
  }
  return null;
}

function catalogName(catalog, optionId, t, language) {
  const option = findCatalogOption(catalog, optionId);
  if (!option) return null;
  return optionLabel(option, language, t) || null;
}

function listCatalogNames(catalog, value, t, language) {
  const ids = Array.isArray(value) ? value : value ? [value] : [];
  const names = ids
    .map((id) => catalogName(catalog, id, t, language) || humanizeOptionId(id))
    .filter(Boolean);
  return names.length ? names.join(", ") : null;
}

export function resolveChoiceLabel(t, field, raw, { catalog, selections, language } = {}) {
  if (raw == null || String(raw).trim() === "") return null;
  const id = String(raw).trim();

  if (field === "customColorNote" || field === "specialRequests") return id;

  if (field === "scaleId") {
    if (id === "25-25.5-multi") {
      const hint = named(t, "customBuild.step1.multiscaleHint");
      if (hint) {
        return `${hint.replace("{bass}", "25″").replace("{treble}", "25.5″")} (${SCALE_DISPLAY[id]})`;
      }
    }
    return SCALE_DISPLAY[id] || catalogName(catalog, id, t, language) || humanizeOptionId(id);
  }

  if (field === "stringCount") {
    const count = Number(id);
    if (!Number.isFinite(count)) return humanizeOptionId(id);
    return named(t, "customBuild.strings.count")?.replace("{count}", String(count)) || `${count}`;
  }

  if (field === "radiusId") {
    return RADIUS_DISPLAY[id] || catalogName(catalog, id, t, language) || humanizeOptionId(id);
  }

  const i18nKey = CHOICE_I18N[field]?.(id);
  const option = findCatalogOption(catalog, id);
  if (option) {
    const fromOption = optionLabel(option, language, t, i18nKey);
    if (fromOption) return fromOption;
  }

  if ((field === "bodyWoodId" || field === "topWoodId") && id === "none") {
    return named(t, "customBuild.woods.none.name") || named(t, "customBuild.step2.topNotApplicable") || humanizeOptionId(id);
  }

  return named(t, i18nKey) || listCatalogNames(catalog, selections?.[field], t, language) || humanizeOptionId(id);
}

function row(t, labelKey, value) {
  return { labelKey, value };
}

function orHumanize(primary, fallbackId) {
  if (primary) return primary;
  if (fallbackId == null || fallbackId === "") return null;
  if (Array.isArray(fallbackId)) {
    const names = fallbackId.map((id) => humanizeOptionId(id)).filter(Boolean);
    return names.length ? names.join(", ") : null;
  }
  return humanizeOptionId(fallbackId);
}

export function buildInquiryDisplay(inquiry, t, { catalog, language } = {}) {
  const selections = inquiry?.configuration?.selections ?? {};
  const parsed = parseInquiryNotes(inquiry?.configuration?.notes);
  const wizard = {
    ...wizardFromCatalog(selections),
    ...parsed.wizard,
  };
  const choiceOpts = { catalog, language };

  const pickupList = listCatalogNames(catalog, selections.pickups, t, language);
  const customerSuppliedParts = Boolean(wizard.customerSuppliedParts);

  const groups = [
    {
      id: "instrument",
      titleKey: "admin.detail.groups.instrument",
      rows: [
        row(t, "customBuild.summary.instrument", resolveChoiceLabel(t, "instrumentTypeId", wizard.instrumentTypeId, choiceOpts)),
        row(t, "customBuild.summary.series", resolveChoiceLabel(t, "seriesId", wizard.seriesId, choiceOpts)),
        row(t, "customBuild.summary.shape", resolveChoiceLabel(t, "shapeId", wizard.shapeId, choiceOpts)),
        row(t, "customBuild.summary.scale", resolveChoiceLabel(t, "scaleId", wizard.scaleId, choiceOpts)),
        row(t, "customBuild.summary.strings", resolveChoiceLabel(t, "stringCount", wizard.stringCount, choiceOpts)),
        row(t, "customBuild.summary.radius", resolveChoiceLabel(t, "radiusId", wizard.radiusId, choiceOpts)),
      ],
    },
    {
      id: "body",
      titleKey: "admin.detail.groups.body",
      rows: [
        row(t, "customBuild.summary.bodyWood", resolveChoiceLabel(t, "bodyWoodId", wizard.bodyWoodId, choiceOpts)),
        row(t, "customBuild.summary.topWood", resolveChoiceLabel(t, "topWoodId", wizard.topWoodId, choiceOpts)),
      ],
    },
    {
      id: "neck",
      titleKey: "admin.detail.groups.neck",
      rows: [
        row(t, "customBuild.summary.neckWood", resolveChoiceLabel(t, "neckWoodId", wizard.neckWoodId, choiceOpts)),
        row(t, "customBuild.summary.neckConstruction", resolveChoiceLabel(t, "neckConstructionId", wizard.neckConstructionId, choiceOpts)),
        row(t, "customBuild.summary.fingerboard", resolveChoiceLabel(t, "fingerboardWoodId", wizard.fingerboardWoodId, choiceOpts)),
        row(t, "customBuild.summary.neckProfile", resolveChoiceLabel(t, "neckProfileId", wizard.neckProfileId, choiceOpts)),
        row(t, "customBuild.summary.frets", resolveChoiceLabel(t, "fretSpecId", wizard.fretSpecId, choiceOpts)),
      ],
    },
    {
      id: "electronics",
      titleKey: "admin.detail.groups.electronics",
      rows: customerSuppliedParts
        ? [
            row(
              t,
              "customBuild.summary.customerSuppliedParts",
              named(t, "customBuild.step4.customerSuppliedSummary"),
            ),
          ]
        : [
            row(t, "customBuild.summary.pickupConfig", resolveChoiceLabel(t, "pickupConfigId", wizard.pickupConfigId, choiceOpts)),
            row(
              t,
              "customBuild.summary.pickupType",
              resolveChoiceLabel(t, "pickupTypeId", wizard.pickupTypeId, choiceOpts) || pickupList,
            ),
            row(
              t,
              "customBuild.summary.bridge",
              resolveChoiceLabel(t, "bridgeId", wizard.bridgeId, choiceOpts) ||
                orHumanize(null, selections.bridge),
            ),
            row(t, "customBuild.summary.hardwareFinish", resolveChoiceLabel(t, "hardwareFinishId", wizard.hardwareFinishId, choiceOpts)),
            row(
              t,
              "customBuild.summary.controls",
              resolveChoiceLabel(t, "controlLayoutId", wizard.controlLayoutId, choiceOpts) ||
                orHumanize(null, selections.electronics),
            ),
          ],
    },
    {
      id: "finish",
      titleKey: "admin.detail.groups.finish",
      rows: [
        row(
          t,
          "customBuild.summary.finishType",
          resolveChoiceLabel(t, "finishTypeId", wizard.finishTypeId, choiceOpts) ||
            orHumanize(null, selections["finish-type"]),
        ),
        row(
          t,
          "customBuild.summary.finishColor",
          resolveChoiceLabel(t, "finishColorId", wizard.finishColorId, choiceOpts) ||
            orHumanize(null, selections["finish-color"]),
        ),
        row(
          t,
          "customBuild.summary.inlay",
          resolveChoiceLabel(t, "inlayId", wizard.inlayId, choiceOpts) ||
            orHumanize(null, Array.isArray(selections["custom-details"])
              ? selections["custom-details"].filter((id) => String(id).includes("inlay"))
              : null),
        ),
        row(
          t,
          "customBuild.summary.engraving",
          resolveChoiceLabel(t, "engravingId", wizard.engravingId, choiceOpts) ||
            orHumanize(
              null,
              Array.isArray(selections["custom-details"])
                ? selections["custom-details"].filter((id) => String(id).includes("engrav"))
                : null,
            ),
        ),
      ],
    },
  ];

  if (wizard.tunerId && !customerSuppliedParts) {
    groups
      .find((group) => group.id === "electronics")
      ?.rows.splice(
        3,
        0,
        row(t, "customBuild.summary.tuners", resolveChoiceLabel(t, "tunerId", wizard.tunerId, choiceOpts)),
      );
  }
  if (wizard.customColorNote) {
    groups
      .find((group) => group.id === "finish")
      ?.rows.push(row(t, "customBuild.summary.customColor", wizard.customColorNote));
  }
  if (wizard.specialRequests) {
    groups
      .find((group) => group.id === "finish")
      ?.rows.push(row(t, "customBuild.summary.specialRequests", wizard.specialRequests));
  }

  const languageLabel =
    parsed.metadata.language === "vi"
      ? named(t, "admin.detail.languageVi") || "VI"
      : parsed.metadata.language === "en"
        ? named(t, "admin.detail.languageEn") || "EN"
        : parsed.metadata.language
          ? humanizeOptionId(parsed.metadata.language)
          : null;

  return {
    metadata: {
      draftId: parsed.metadata.draftId,
      language: parsed.metadata.language,
      languageLabel,
      country: parsed.metadata.country,
      inquiryType: parsed.metadata.inquiryType,
      inquiryTypeLabel: parsed.metadata.inquiryType
        ? named(t, `contact.types.${parsed.metadata.inquiryType}.title`)
        : null,
      productId: parsed.metadata.productId,
      productRef: parsed.metadata.productRef,
      subject: parsed.metadata.subject,
      extra: parsed.extra,
    },
    groups,
    hasConfiguration: groups.some((group) => group.rows.some((item) => item.value)),
    referenceImages: sanitizeReferenceImages(inquiry?.referenceImages),
  };
}

export function phoneHref(phone) {
  if (!phone) return null;
  const compact = String(phone).replace(/[^\d+]/g, "");
  return compact ? `tel:${compact}` : null;
}
