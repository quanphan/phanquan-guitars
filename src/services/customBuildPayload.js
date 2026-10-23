const NOTES_MAX = 2000;

const INSTRUMENT_TYPE_MAP = {
  "electric-guitar": "instrument-type.solid-body-electric",
  bass: "instrument-type.electric-bass",
  "acoustic-guitar": "instrument-type.acoustic",
};

const SHAPE_MAP = {
  "double-cut": "body-shape.double-cut",
  offset: "body-shape.offset",
  "t-style": "body-shape.slab",
};

const BODY_WOOD_MAP = {
  alder: "body-wood.alder",
  mahogany: "body-wood.mahogany",
  "swamp-ash": "body-wood.swamp-ash",
};

const TOP_WOOD_MAP = {
  none: "top-wood.no-separate-top",
};

const NECK_WOOD_MAP = {
  "roasted-maple": "neck-wood.roasted-maple",
  mahogany: "neck-wood.mahogany",
  "mahogany-maple-laminate": "neck-wood.mahogany",
};

const FINGERBOARD_MAP = {
  ebony: "fingerboard.ebony",
  "roasted-maple-board": "fingerboard.maple",
};

const BRIDGE_MAP = {
  hardtail: "bridge.hardtail",
  "individual-saddle-hardtail": "bridge.hardtail",
};

const HARDWARE_MAP = {
  black: "hardware.black",
};

const FINISH_TYPE_BY_SHEEN = {
  gloss: "finish-type.gloss",
  satin: "finish-type.satin",
};

const FINISH_COLOR_MAP = {
  "natural-wood": "finish-color.natural",
  "natural-dark-figure": "finish-color.natural",
  "natural-amber-burst": "finish-color.sunburst",
};

const CONTROL_TO_ELECTRONICS = {
  "vol-blend-tone-passive": "electronics.passive",
  "vol-tone-3way": "electronics.passive",
};

function findCategory(catalog, categoryId) {
  return catalog?.categories?.find((category) => category.id === categoryId) ?? null;
}

function activeOptionId(catalog, categoryId, optionId) {
  if (!optionId) return undefined;
  const category = findCategory(catalog, categoryId);
  const option = category?.options?.find((item) => item.id === optionId);
  if (!option?.active) return undefined;
  return option.id;
}

function activeOptionIds(catalog, categoryId, optionIds) {
  const selected = [];
  const seen = new Set();
  for (const optionId of optionIds) {
    const resolved = activeOptionId(catalog, categoryId, optionId);
    if (!resolved || seen.has(resolved)) continue;
    seen.add(resolved);
    selected.push(resolved);
  }
  return selected;
}

function setIfPresent(selections, categoryId, optionId) {
  if (optionId) selections[categoryId] = optionId;
}

function wizardLines(selections) {
  const keys = [
    "instrumentTypeId",
    "seriesId",
    "shapeId",
    "scaleId",
    "stringCount",
    "radiusId",
    "bodyWoodId",
    "topWoodId",
    "neckWoodId",
    "neckConstructionId",
    "fingerboardWoodId",
    "neckProfileId",
    "fretSpecId",
    "pickupConfigId",
    "pickupTypeId",
    "bridgeId",
    "tunerId",
    "hardwareFinishId",
    "controlLayoutId",
    "finishTypeId",
    "finishColorId",
    "customColorNote",
    "inlayId",
    "engravingId",
    "specialRequests",
  ];
  return keys
    .map((key) => {
      const value = selections[key];
      if (value == null || value === false) return null;
      const text = String(value).trim();
      if (!text) return null;
      return `${key}=${text}`;
    })
    .filter(Boolean);
}

function buildNotes({ selections, language, draftId }) {
  const lines = [
    draftId ? `draftId=${draftId}` : null,
    language ? `language=${language}` : null,
    selections.contactCountry?.trim()
      ? `country=${selections.contactCountry.trim()}`
      : null,
    "wizard:",
    ...wizardLines(selections),
  ].filter(Boolean);

  const notes = lines.join("\n").trim();
  if (!notes) return null;
  if (notes.length <= NOTES_MAX) return notes;
  return notes.slice(0, NOTES_MAX);
}

function pickupSelections(catalog, selections) {
  if (selections.pickupConfigId !== "hh") return [];
  if (selections.pickupTypeId === "humbucker") {
    return activeOptionIds(catalog, "pickups", [
      "pickups.neck-humbucker",
      "pickups.bridge-humbucker",
    ]);
  }
  return [];
}

function customDetailSelections(catalog, selections) {
  const ids = [];
  if (selections.inlayId === "offset-dots" || selections.inlayId === "side-dots") {
    ids.push("custom-details.dot-inlays");
  }
  if (selections.engravingId === "optional-top") {
    ids.push("custom-details.engraved-ornament");
  }
  return activeOptionIds(catalog, "custom-details", ids);
}

/**
 * Map wizard state onto the backend inquiry contract.
 * Only catalog-active option IDs are sent. Unmapped wizard fields go in notes.
 * Extra top-level fields (language, country, draftId, prices) are not sent:
 * the API rejects unknown and calculated-value keys.
 */
export function buildInquiryPayload({
  selections,
  language,
  draftId,
  catalog,
  finishSheen,
}) {
  const mapped = {};

  setIfPresent(
    mapped,
    "instrument-type",
    activeOptionId(
      catalog,
      "instrument-type",
      INSTRUMENT_TYPE_MAP[selections.instrumentTypeId],
    ),
  );
  setIfPresent(
    mapped,
    "body-shape",
    activeOptionId(catalog, "body-shape", SHAPE_MAP[selections.shapeId]),
  );
  setIfPresent(
    mapped,
    "body-wood",
    activeOptionId(catalog, "body-wood", BODY_WOOD_MAP[selections.bodyWoodId]),
  );
  setIfPresent(
    mapped,
    "top-wood",
    activeOptionId(catalog, "top-wood", TOP_WOOD_MAP[selections.topWoodId]),
  );
  setIfPresent(
    mapped,
    "neck-wood",
    activeOptionId(catalog, "neck-wood", NECK_WOOD_MAP[selections.neckWoodId]),
  );
  setIfPresent(
    mapped,
    "fingerboard",
    activeOptionId(
      catalog,
      "fingerboard",
      FINGERBOARD_MAP[selections.fingerboardWoodId],
    ),
  );
  setIfPresent(
    mapped,
    "bridge",
    activeOptionId(catalog, "bridge", BRIDGE_MAP[selections.bridgeId]),
  );
  setIfPresent(
    mapped,
    "hardware",
    activeOptionId(
      catalog,
      "hardware",
      HARDWARE_MAP[selections.hardwareFinishId],
    ),
  );
  setIfPresent(
    mapped,
    "electronics",
    activeOptionId(
      catalog,
      "electronics",
      CONTROL_TO_ELECTRONICS[selections.controlLayoutId],
    ),
  );
  setIfPresent(
    mapped,
    "finish-type",
    activeOptionId(
      catalog,
      "finish-type",
      FINISH_TYPE_BY_SHEEN[finishSheen],
    ),
  );
  setIfPresent(
    mapped,
    "finish-color",
    activeOptionId(
      catalog,
      "finish-color",
      FINISH_COLOR_MAP[selections.finishColorId],
    ),
  );

  const pickups = pickupSelections(catalog, selections);
  if (pickups.length > 0) mapped.pickups = pickups;

  const details = customDetailSelections(catalog, selections);
  if (details.length > 0) mapped["custom-details"] = details;

  const customer = {
    name: selections.contactName.trim(),
    email: selections.contactEmail.trim(),
  };
  const phone = selections.contactPhone.trim();
  if (phone) customer.phone = phone;

  const configuration = {
    selections: mapped,
  };
  const notes = buildNotes({ selections, language, draftId });
  if (notes) configuration.notes = notes;

  const payload = { customer, configuration };
  const message = selections.contactMessage.trim();
  if (message) payload.message = message;
  return payload;
}

export function mapServerFieldToContact(field) {
  if (field === "customer.name") return "contactName";
  if (field === "customer.email") return "contactEmail";
  if (field === "customer.phone") return "contactPhone";
  if (field === "message") return "contactMessage";
  return null;
}
