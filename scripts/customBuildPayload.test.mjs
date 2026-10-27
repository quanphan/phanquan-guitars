import assert from "node:assert/strict";
import test from "node:test";
import { tFor } from "../src/i18n/translations.js";
import {
  buildInquiryPayload,
  encodeCatalogSelection,
  evaluateMappedSelections,
  firstIssueStep,
  formatSelectionIssueLabel,
  isMissingRequiredConfig,
  selectionIssueMeta,
} from "../src/services/customBuildPayload.js";

const wizardCatalog = {
  categories: [
    {
      id: "instrument-type",
      required: true,
      selectionMode: "single",
      step: 1,
      options: [{ id: "instrument-type.electric-guitar", code: "electric-guitar", active: true }],
    },
    {
      id: "series",
      required: false,
      selectionMode: "single",
      step: 1,
      options: [{ id: "series.solid-body", code: "solid-body", active: true }],
    },
    {
      id: "body-shape",
      required: true,
      selectionMode: "single",
      step: 1,
      options: [{ id: "body-shape.double-cut", code: "double-cut", active: true }],
    },
    {
      id: "body-wood",
      required: true,
      selectionMode: "single",
      step: 2,
      options: [{ id: "body-wood.mahogany", code: "mahogany", active: true }],
    },
    {
      id: "neck-wood",
      required: true,
      selectionMode: "single",
      step: 3,
      options: [
        { id: "neck-wood.roasted-maple", code: "roasted-maple", active: true },
        { id: "neck-wood.hidden", code: "hidden", active: false },
      ],
    },
    {
      id: "fingerboard",
      required: true,
      selectionMode: "single",
      step: 3,
      options: [{ id: "fingerboard.ebony", code: "ebony", active: true }],
    },
    {
      id: "pickup-config",
      required: false,
      selectionMode: "single",
      step: 4,
      options: [{ id: "pickup-config.hh", code: "hh", active: true }],
    },
    {
      id: "pickups",
      required: false,
      selectionMode: "single",
      step: 4,
      options: [
        { id: "pickups.humbucker", code: "humbucker", active: true },
        { id: "pickups.soapbar-humbucker", code: "soapbar-humbucker", active: true },
        { id: "pickups.hidden", code: "hidden", active: false },
      ],
    },
    {
      id: "finish-type",
      required: true,
      selectionMode: "single",
      step: 5,
      options: [
        {
          id: "finish-type.oil-thin-varnish",
          code: "oil-thin-varnish",
          active: true,
          compatibility: { instrumentTypeIds: ["electric-guitar"], seriesIds: ["solid-body"] },
        },
        {
          id: "finish-type.conversion-varnish",
          code: "conversion-varnish",
          active: true,
          compatibility: { instrumentTypeIds: ["bass"] },
        },
      ],
    },
  ],
};

function contact(extra = {}) {
  return {
    contactName: "Lan Pham",
    contactEmail: "lan@example.com",
    contactPhone: "",
    contactMessage: "",
    instrumentTypeId: "electric-guitar",
    seriesId: "solid-body",
    shapeId: "double-cut",
    bodyWoodId: "mahogany",
    fingerboardWoodId: "ebony",
    ...extra,
  };
}

function payloadSelections(extra = {}, finishSheen) {
  return buildInquiryPayload({
    selections: contact(extra),
    language: "vi",
    draftId: "draft-1",
    catalog: wizardCatalog,
    finishSheen,
  }).configuration.selections;
}

test("missing neck-wood is required after mapping", () => {
  const mapped = payloadSelections({ finishTypeId: "oil-thin-varnish" });
  assert.equal(mapped["neck-wood"], undefined);
  const issues = evaluateMappedSelections(mapped, wizardCatalog);
  assert.equal(issues.some((item) => item.field === "selections.neck-wood" && item.code === "REQUIRED"), true);
  assert.equal(firstIssueStep(issues), 3);
});

test("missing finish-type is required after mapping", () => {
  const mapped = payloadSelections({ neckWoodId: "roasted-maple" });
  assert.equal(mapped["finish-type"], undefined);
  const issues = evaluateMappedSelections(mapped, wizardCatalog);
  assert.equal(issues.some((item) => item.field === "selections.finish-type" && item.code === "REQUIRED"), true);
  assert.equal(firstIssueStep(issues), 5);
});

test("wizard codes for neck-wood and finish-type map to catalog ids and validate", () => {
  const mapped = payloadSelections({
    neckWoodId: "roasted-maple",
    finishTypeId: "oil-thin-varnish",
  });
  assert.equal(mapped["neck-wood"], "neck-wood.roasted-maple");
  assert.equal(mapped["finish-type"], "finish-type.oil-thin-varnish");
  assert.deepEqual(evaluateMappedSelections(mapped, wizardCatalog), []);
});

test("finish type is taken from the selected option, not sheen aliases", () => {
  const mapped = payloadSelections(
    { neckWoodId: "roasted-maple", finishTypeId: "oil-thin-varnish" },
    "gloss",
  );
  assert.equal(mapped["finish-type"], "finish-type.oil-thin-varnish");
});

test("inactive neck-wood is sent so validation reports INACTIVE_OPTION, not REQUIRED", () => {
  const mapped = payloadSelections({
    neckWoodId: "hidden",
    finishTypeId: "oil-thin-varnish",
  });
  assert.equal(mapped["neck-wood"], "neck-wood.hidden");
  const issues = evaluateMappedSelections(mapped, wizardCatalog);
  assert.equal(issues.some((item) => item.field === "selections.neck-wood" && item.code === "INACTIVE_OPTION"), true);
  assert.equal(issues.some((item) => item.field === "selections.neck-wood" && item.code === "REQUIRED"), false);
});

test("incompatible finish-type is rejected", () => {
  const mapped = payloadSelections({
    neckWoodId: "roasted-maple",
    finishTypeId: "conversion-varnish",
  });
  const issues = evaluateMappedSelections(mapped, wizardCatalog);
  assert.equal(
    issues.some((item) => item.field === "selections.finish-type" && item.code === "INCOMPATIBLE_OPTION"),
    true,
  );
});

test("deleted catalog option is sent as a catalog id and reported unknown", () => {
  const mapped = payloadSelections({
    neckWoodId: "ghost-maple",
    finishTypeId: "oil-thin-varnish",
  });
  assert.equal(mapped["neck-wood"], "neck-wood.ghost-maple");
  const issues = evaluateMappedSelections(mapped, wizardCatalog);
  assert.equal(issues.some((item) => item.field === "selections.neck-wood" && item.code === "UNKNOWN_OPTION"), true);
});

test("draft-like selections survive mapping the same way as a live wizard", () => {
  const restored = {
    neckWoodId: "roasted-maple",
    finishTypeId: "oil-thin-varnish",
    pickupConfigId: "hh",
    pickupTypeId: "humbucker",
  };
  const first = payloadSelections(restored);
  const again = payloadSelections(restored);
  assert.equal(first.pickups, "pickups.humbucker");
  assert.equal(again.pickups, first.pickups);
  assert.equal(typeof again.pickups, "string");
  assert.deepEqual(evaluateMappedSelections(again, wizardCatalog), []);
});

test("frontend and backend required/invalid codes match for the same mapped config", () => {
  const mapped = payloadSelections({ finishTypeId: "oil-thin-varnish" });
  const frontend = evaluateMappedSelections(mapped, wizardCatalog);
  const backendShaped = [
    { field: "selections.neck-wood", code: "REQUIRED" },
  ];
  assert.equal(frontend.some((item) => item.field === backendShaped[0].field && item.code === backendShaped[0].code), true);

  const valid = payloadSelections({
    neckWoodId: "roasted-maple",
    finishTypeId: "oil-thin-varnish",
  });
  assert.deepEqual(evaluateMappedSelections(valid, wizardCatalog), []);
});

test("step 6 labels use friendly field names and point to the wizard step", () => {
  const t = (key) => tFor("en", key);
  const issue = { field: "selections.neck-wood", code: "REQUIRED" };
  const label = formatSelectionIssueLabel(t, issue);
  assert.equal(label.includes("selections.neck-wood"), false);
  assert.match(label, /Neck wood/);
  assert.match(label, /required/i);
  assert.equal(selectionIssueMeta(issue.field).step, 3);
  assert.equal(selectionIssueMeta("selections.finish-type").step, 5);
  assert.equal(selectionIssueMeta("selections.finish-type").summaryKey, "customBuild.summary.finishType");
});

function completeMapped(extra = {}) {
  return payloadSelections({
    neckWoodId: "roasted-maple",
    finishTypeId: "oil-thin-varnish",
    pickupConfigId: "hh",
    pickupTypeId: "humbucker",
    ...extra,
  });
}

test("valid pickup type is a single catalog id string", () => {
  const mapped = completeMapped();
  assert.equal(mapped.pickups, "pickups.humbucker");
  assert.equal(Array.isArray(mapped.pickups), false);
  assert.deepEqual(evaluateMappedSelections(mapped, wizardCatalog), []);
});

test("HH pickup type is not expanded into a list of position pickups", () => {
  const mapped = completeMapped();
  assert.equal(mapped.pickups, "pickups.humbucker");
  assert.equal(mapped.pickups.includes?.("neck-humbucker"), false);
});

test("missing required pickup type is REQUIRED, not INVALID_TYPE", () => {
  const requiredPickups = {
    ...wizardCatalog,
    categories: wizardCatalog.categories.map((category) => (
      category.id === "pickups" ? { ...category, required: true } : category
    )),
  };
  const mapped = payloadSelections({
    neckWoodId: "roasted-maple",
    finishTypeId: "oil-thin-varnish",
  });
  assert.equal(mapped.pickups, undefined);
  const issues = evaluateMappedSelections(mapped, requiredPickups);
  assert.equal(issues.some((item) => item.field === "selections.pickups" && item.code === "REQUIRED"), true);
  assert.equal(issues.some((item) => item.field === "selections.pickups" && item.code === "INVALID_TYPE"), false);
  assert.equal(isMissingRequiredConfig(issues, 4), true);
});

test("inactive pickup type is INACTIVE_OPTION, not INVALID_TYPE", () => {
  const mapped = completeMapped({ pickupTypeId: "hidden" });
  assert.equal(mapped.pickups, "pickups.hidden");
  const issues = evaluateMappedSelections(mapped, wizardCatalog);
  assert.equal(issues.some((item) => item.field === "selections.pickups" && item.code === "INACTIVE_OPTION"), true);
  assert.equal(issues.some((item) => item.code === "INVALID_TYPE"), false);
});

test("frontend payload type matches backend schema for pickups", () => {
  const singleCategory = wizardCatalog.categories.find((item) => item.id === "pickups");
  assert.equal(singleCategory.selectionMode, "single");
  assert.equal(typeof encodeCatalogSelection(singleCategory, "pickups.humbucker"), "string");
  const multipleCategory = { ...singleCategory, selectionMode: "multiple" };
  assert.deepEqual(encodeCatalogSelection(multipleCategory, "pickups.humbucker"), ["pickups.humbucker"]);
  const mappedMultiple = buildInquiryPayload({
    selections: contact({
      neckWoodId: "roasted-maple",
      finishTypeId: "oil-thin-varnish",
      pickupTypeId: "humbucker",
    }),
    language: "en",
    catalog: {
      ...wizardCatalog,
      categories: wizardCatalog.categories.map((category) => (
        category.id === "pickups" ? multipleCategory : category
      )),
    },
  }).configuration.selections;
  assert.deepEqual(mappedMultiple.pickups, ["pickups.humbucker"]);
  const typeMismatch = evaluateMappedSelections(
    { ...mappedMultiple, pickups: "pickups.humbucker" },
    { ...wizardCatalog, categories: wizardCatalog.categories.map((category) => (
      category.id === "pickups" ? multipleCategory : category
    )) },
  );
  assert.equal(typeMismatch.some((item) => item.field === "selections.pickups" && item.code === "INVALID_TYPE"), true);
});

test("array pickup type against a single catalog is INVALID_TYPE", () => {
  const mapped = completeMapped();
  const issues = evaluateMappedSelections({ ...mapped, pickups: [mapped.pickups] }, wizardCatalog);
  assert.equal(issues.some((item) => item.field === "selections.pickups" && item.code === "INVALID_TYPE"), true);
  assert.equal(isMissingRequiredConfig(issues, 4), false);
});

