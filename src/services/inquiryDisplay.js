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
    if (inWizard || key.endsWith("Id") || key === "stringCount" || key === "customColorNote" || key === "specialRequests") {
      wizard[key] = value;
      continue;
    }
    extra.push(line);
  }

  return { metadata, wizard, extra };
}

export function humanizeOptionId(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const leaf = text.includes(".") ? text.slice(text.lastIndexOf(".") + 1) : text;
  return leaf
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function named(t, key) {
  if (!t) return null;
  const value = t(key);
  if (!value || value === key) return null;
  return value;
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

function catalogName(catalog, optionId) {
  if (!catalog || !optionId) return null;
  for (const category of catalog.categories || []) {
    const option = (category.options || []).find((item) => item.id === optionId);
    if (option?.name) return option.name;
  }
  return null;
}

function listCatalogNames(catalog, value) {
  const ids = Array.isArray(value) ? value : value ? [value] : [];
  const names = ids
    .map((id) => catalogName(catalog, id) || humanizeOptionId(id))
    .filter(Boolean);
  return names.length ? names.join(", ") : null;
}

export function resolveChoiceLabel(t, field, raw, { catalog, selections } = {}) {
  if (raw == null || String(raw).trim() === "") return null;
  const id = String(raw).trim();

  switch (field) {
    case "instrumentTypeId":
      return named(t, `customBuild.types.${id}`) || humanizeOptionId(id);
    case "seriesId":
      return named(t, `customBuild.series.${id}.name`) || humanizeOptionId(id);
    case "shapeId":
      return named(t, `customBuild.shapes.${id}.name`) || humanizeOptionId(id);
    case "scaleId": {
      if (id === "25-25.5-multi") {
        const hint = named(t, "customBuild.step1.multiscaleHint");
        if (hint) {
          return `${hint.replace("{bass}", "25″").replace("{treble}", "25.5″")} (${SCALE_DISPLAY[id]})`;
        }
      }
      return SCALE_DISPLAY[id] || humanizeOptionId(id);
    }
    case "stringCount": {
      const count = Number(id);
      if (!Number.isFinite(count)) return humanizeOptionId(id);
      return (
        named(t, "customBuild.strings.count")?.replace("{count}", String(count)) ||
        `${count}`
      );
    }
    case "radiusId":
      return RADIUS_DISPLAY[id] || humanizeOptionId(id);
    case "bodyWoodId":
    case "topWoodId":
      if (id === "none") return named(t, "customBuild.woods.none.name") || named(t, "customBuild.step2.topNotApplicable") || humanizeOptionId(id);
      return named(t, `customBuild.woods.${id}.name`) || humanizeOptionId(id);
    case "neckWoodId":
      return named(t, `customBuild.neckWoods.${id}.name`) || humanizeOptionId(id);
    case "neckConstructionId":
      return named(t, `customBuild.constructions.${id}.name`) || humanizeOptionId(id);
    case "fingerboardWoodId":
      return named(t, `customBuild.fingerboards.${id}.name`) || humanizeOptionId(id);
    case "neckProfileId":
      return named(t, `customBuild.profiles.${id}.name`) || humanizeOptionId(id);
    case "fretSpecId":
      return named(t, `customBuild.frets.${id}.name`) || humanizeOptionId(id);
    case "pickupConfigId":
      return named(t, `customBuild.pickupConfigs.${id}.name`) || humanizeOptionId(id);
    case "pickupTypeId":
      return named(t, `customBuild.pickupTypes.${id}.name`) || humanizeOptionId(id);
    case "bridgeId":
      return named(t, `customBuild.bridges.${id}.name`) || humanizeOptionId(id);
    case "tunerId":
      return named(t, `customBuild.tuners.${id}.name`) || humanizeOptionId(id);
    case "hardwareFinishId":
      return named(t, `customBuild.hardwareFinishes.${id}.name`) || humanizeOptionId(id);
    case "controlLayoutId":
      return named(t, `customBuild.controls.${id}.name`) || humanizeOptionId(id);
    case "finishTypeId":
      return named(t, `customBuild.finishTypes.${id}.name`) || humanizeOptionId(id);
    case "finishColorId":
      return named(t, `customBuild.finishColors.${id}.name`) || humanizeOptionId(id);
    case "inlayId":
      return named(t, `customBuild.inlays.${id}.name`) || humanizeOptionId(id);
    case "engravingId":
      return named(t, `customBuild.engravings.${id}.name`) || humanizeOptionId(id);
    case "customColorNote":
    case "specialRequests":
      return id;
    default:
      return catalogName(catalog, id) || listCatalogNames(catalog, selections?.[field]) || humanizeOptionId(id);
  }
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

export function buildInquiryDisplay(inquiry, t, { catalog } = {}) {
  const selections = inquiry?.configuration?.selections ?? {};
  const parsed = parseInquiryNotes(inquiry?.configuration?.notes);
  const wizard = {
    ...wizardFromCatalog(selections),
    ...parsed.wizard,
  };

  const pickupList = listCatalogNames(catalog, selections.pickups);

  const groups = [
    {
      id: "instrument",
      titleKey: "admin.detail.groups.instrument",
      rows: [
        row(t, "customBuild.summary.instrument", resolveChoiceLabel(t, "instrumentTypeId", wizard.instrumentTypeId, { catalog })),
        row(t, "customBuild.summary.series", resolveChoiceLabel(t, "seriesId", wizard.seriesId, { catalog })),
        row(t, "customBuild.summary.shape", resolveChoiceLabel(t, "shapeId", wizard.shapeId, { catalog })),
        row(t, "customBuild.summary.scale", resolveChoiceLabel(t, "scaleId", wizard.scaleId, { catalog })),
        row(t, "customBuild.summary.strings", resolveChoiceLabel(t, "stringCount", wizard.stringCount, { catalog })),
        row(t, "customBuild.summary.radius", resolveChoiceLabel(t, "radiusId", wizard.radiusId, { catalog })),
      ],
    },
    {
      id: "body",
      titleKey: "admin.detail.groups.body",
      rows: [
        row(t, "customBuild.summary.bodyWood", resolveChoiceLabel(t, "bodyWoodId", wizard.bodyWoodId, { catalog })),
        row(t, "customBuild.summary.topWood", resolveChoiceLabel(t, "topWoodId", wizard.topWoodId, { catalog })),
      ],
    },
    {
      id: "neck",
      titleKey: "admin.detail.groups.neck",
      rows: [
        row(t, "customBuild.summary.neckWood", resolveChoiceLabel(t, "neckWoodId", wizard.neckWoodId, { catalog })),
        row(t, "customBuild.summary.neckConstruction", resolveChoiceLabel(t, "neckConstructionId", wizard.neckConstructionId, { catalog })),
        row(t, "customBuild.summary.fingerboard", resolveChoiceLabel(t, "fingerboardWoodId", wizard.fingerboardWoodId, { catalog })),
        row(t, "customBuild.summary.neckProfile", resolveChoiceLabel(t, "neckProfileId", wizard.neckProfileId, { catalog })),
        row(t, "customBuild.summary.frets", resolveChoiceLabel(t, "fretSpecId", wizard.fretSpecId, { catalog })),
      ],
    },
    {
      id: "electronics",
      titleKey: "admin.detail.groups.electronics",
      rows: [
        row(t, "customBuild.summary.pickupConfig", resolveChoiceLabel(t, "pickupConfigId", wizard.pickupConfigId, { catalog })),
        row(
          t,
          "customBuild.summary.pickupType",
          resolveChoiceLabel(t, "pickupTypeId", wizard.pickupTypeId, { catalog }) || pickupList,
        ),
        row(
          t,
          "customBuild.summary.bridge",
          resolveChoiceLabel(t, "bridgeId", wizard.bridgeId, { catalog }) ||
            orHumanize(null, selections.bridge),
        ),
        row(t, "customBuild.summary.hardwareFinish", resolveChoiceLabel(t, "hardwareFinishId", wizard.hardwareFinishId, { catalog })),
        row(
          t,
          "customBuild.summary.controls",
          resolveChoiceLabel(t, "controlLayoutId", wizard.controlLayoutId, { catalog }) ||
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
          resolveChoiceLabel(t, "finishTypeId", wizard.finishTypeId, { catalog }) ||
            orHumanize(null, selections["finish-type"]),
        ),
        row(
          t,
          "customBuild.summary.finishColor",
          resolveChoiceLabel(t, "finishColorId", wizard.finishColorId, { catalog }) ||
            orHumanize(null, selections["finish-color"]),
        ),
        row(
          t,
          "customBuild.summary.inlay",
          resolveChoiceLabel(t, "inlayId", wizard.inlayId, { catalog }) ||
            orHumanize(null, Array.isArray(selections["custom-details"])
              ? selections["custom-details"].filter((id) => String(id).includes("inlay"))
              : null),
        ),
        row(
          t,
          "customBuild.summary.engraving",
          resolveChoiceLabel(t, "engravingId", wizard.engravingId, { catalog }) ||
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

  if (wizard.tunerId) {
    groups
      .find((group) => group.id === "electronics")
      ?.rows.splice(
        3,
        0,
        row(t, "customBuild.summary.tuners", resolveChoiceLabel(t, "tunerId", wizard.tunerId, { catalog })),
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
  };
}

export function phoneHref(phone) {
  if (!phone) return null;
  const compact = String(phone).replace(/[^\d+]/g, "");
  return compact ? `tel:${compact}` : null;
}
