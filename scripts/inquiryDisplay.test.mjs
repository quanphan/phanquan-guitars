import assert from "node:assert/strict";
import test from "node:test";
import { tFor } from "../src/i18n/translations.js";
import {
  buildInquiryDisplay,
  humanizeOptionId,
  parseInquiryNotes,
  phoneHref,
} from "../src/services/inquiryDisplay.js";
import { buildInquiryPayload } from "../src/services/customBuildPayload.js";

const sampleInquiry = {
  id: "inq_demo-1",
  status: "new",
  createdAt: "2026-03-15T10:00:00.000Z",
  customer: { name: "Lan Pham", email: "lan@example.com", phone: null },
  message: "Please review this build.",
  configuration: {
    selections: {
      "instrument-type": "instrument-type.solid-body-electric",
      "body-shape": "body-shape.slab",
      "body-wood": "body-wood.mahogany",
      "top-wood": "top-wood.no-separate-top",
      "neck-wood": "neck-wood.mahogany",
      fingerboard: "fingerboard.ebony",
      bridge: "bridge.hardtail",
      hardware: "hardware.black",
      electronics: "electronics.passive",
      "finish-type": "finish-type.satin",
      "finish-color": "finish-color.natural",
      pickups: ["pickups.neck-humbucker", "pickups.bridge-humbucker"],
      "custom-details": ["custom-details.dot-inlays"],
    },
    notes: [
      "draftId=draft-123",
      "language=vi",
      "country=Vietnam",
      "wizard:",
      "instrumentTypeId=electric-guitar",
      "seriesId=solid-body",
      "shapeId=t-style",
      "scaleId=25.5",
      "stringCount=6",
      "radiusId=compound-12-16",
      "bodyWoodId=mahogany",
      "topWoodId=none",
      "neckWoodId=mahogany",
      "neckConstructionId=set-neck",
      "fingerboardWoodId=ebony",
      "neckProfileId=thin-c",
      "fretSpecId=stainless-jumbo",
      "pickupConfigId=hh",
      "pickupTypeId=humbucker",
      "bridgeId=hardtail",
      "hardwareFinishId=black",
      "controlLayoutId=vol-tone-3way",
      "finishTypeId=oil-thin-varnish",
      "finishColorId=natural-wood",
      "inlayId=side-dots",
    ].join("\n"),
  },
};

function t(language) {
  return (key) => tFor(language, key);
}

function rowValue(display, groupId, labelKey) {
  return display.groups.find((group) => group.id === groupId)?.rows.find((row) => row.labelKey === labelKey)?.value;
}

test("parses notes into metadata and wizard fields without exposing the raw blob", () => {
  const parsed = parseInquiryNotes(sampleInquiry.configuration.notes);
  assert.equal(parsed.metadata.country, "Vietnam");
  assert.equal(parsed.metadata.draftId, "draft-123");
  assert.equal(parsed.wizard.instrumentTypeId, "electric-guitar");
  assert.equal(parsed.wizard.finishColorId, "natural-wood");
});

test("parses contact inquiry metadata from notes", () => {
  const parsed = parseInquiryNotes(
    "inquiryType=custom-guitar\nlanguage=en\ncountry=USA\nproductId=prod_1\nproductRef=PQ Offset\nsubject=Build question\ndraftId=draft-9",
  );
  assert.equal(parsed.metadata.inquiryType, "custom-guitar");
  assert.equal(parsed.metadata.productId, "prod_1");
  assert.equal(parsed.metadata.productRef, "PQ Offset");
  assert.equal(parsed.metadata.subject, "Build question");
  assert.equal(parsed.metadata.draftId, "draft-9");
});

test("humanizes unknown catalog ids instead of showing raw keys", () => {
  assert.equal(humanizeOptionId("finish-color.natural"), "Natural");
  assert.equal(humanizeOptionId("custom-details.dot-inlays"), "Dot Inlays");
  assert.equal(humanizeOptionId("compound-12-16"), "Compound 12 16");
});

test("inquiry details do not invent a pickup positions section", () => {
  const display = buildInquiryDisplay(sampleInquiry, t("vi"));
  const blob = JSON.stringify(display);
  assert.equal(blob.includes("Vị trí pickup"), false);
  assert.equal(blob.includes("positionsLabel"), false);
  assert.equal(blob.includes("Cần: Bridge"), false);
  assert.equal(rowValue(display, "electronics", "customBuild.summary.pickupConfig"), "HH");
});

test("English labels prefer wizard catalog translations over API ids", () => {
  const display = buildInquiryDisplay(sampleInquiry, t("en"));
  assert.equal(rowValue(display, "instrument", "customBuild.summary.instrument"), "Electric Guitar");
  assert.equal(rowValue(display, "instrument", "customBuild.summary.series"), "Custom Solid Body");
  assert.equal(rowValue(display, "instrument", "customBuild.summary.shape"), "T-style");
  assert.equal(rowValue(display, "instrument", "customBuild.summary.scale"), "25.5″");
  assert.equal(rowValue(display, "instrument", "customBuild.summary.radius"), "12″–16″ compound");
  assert.equal(rowValue(display, "neck", "customBuild.summary.neckConstruction"), "Set-neck");
  assert.equal(rowValue(display, "finish", "customBuild.summary.finishType"), "Oil / thin varnish");
  assert.equal(rowValue(display, "finish", "customBuild.summary.finishColor"), "Natural wood");
  assert.equal(rowValue(display, "finish", "customBuild.summary.inlay"), "Minimal side dots");
  assert.equal(display.metadata.country, "Vietnam");
  const blob = JSON.stringify(display.groups);
  assert.equal(blob.includes("finish-color.natural"), false);
  assert.equal(blob.includes("instrumentTypeId"), false);
  assert.equal(blob.includes("custom-details.dot-inlays"), false);
});

test("Vietnamese labels resolve known options", () => {
  const display = buildInquiryDisplay(sampleInquiry, t("vi"));
  assert.equal(rowValue(display, "instrument", "customBuild.summary.instrument"), "Guitar điện");
  assert.equal(rowValue(display, "neck", "customBuild.summary.neckConstruction"), "Set-neck");
  assert.equal(display.metadata.languageLabel, "Tiếng Việt");
});

test("missing optional fields stay empty for Not provided UI", () => {
  const display = buildInquiryDisplay(
    {
      customer: { name: "A", email: "a@example.com" },
      configuration: { selections: {}, notes: "country=\nlanguage=en\nwizard:" },
    },
    t("en"),
  );
  assert.equal(rowValue(display, "body", "customBuild.summary.bodyWood"), null);
  assert.equal(display.metadata.country, null);
  assert.equal(phoneHref(null), null);
});

test("inquiry labels use catalog names when locale keys are missing", () => {
  const catalog = {
    categories: [
      {
        id: "hardware",
        options: [{ id: "hardware.none", code: "none", name: "None", translations: { vi: { name: "Không" } } }],
      },
      {
        id: "finish-type",
        options: [{ id: "finish-type.gloss", code: "gloss", name: "Gloss" }],
      },
      {
        id: "finish-color",
        options: [{ id: "finish-color.discuss-custom", code: "discuss-custom", name: "Discuss custom" }],
      },
    ],
  };
  const inquiry = {
    configuration: {
      selections: {},
      notes: [
        "wizard:",
        "hardwareFinishId=none",
        "finishTypeId=gloss",
        "finishColorId=discuss-custom",
      ].join("\n"),
    },
  };
  const english = buildInquiryDisplay(inquiry, t("en"), { catalog, language: "en" });
  assert.equal(rowValue(english, "electronics", "customBuild.summary.hardwareFinish"), "None");
  assert.equal(rowValue(english, "finish", "customBuild.summary.finishType"), "Gloss");
  assert.equal(rowValue(english, "finish", "customBuild.summary.finishColor"), "Discuss custom");
  const blob = JSON.stringify(english.groups);
  assert.equal(blob.includes("customBuild.hardwareFinishes.none.name"), false);
  assert.equal(blob.includes("customBuild.finishTypes.gloss.name"), false);
  assert.equal(blob.includes("customBuild.finishColors.discuss-custom.name"), false);
  const vietnamese = buildInquiryDisplay(inquiry, t("vi"), { catalog, language: "vi" });
  assert.equal(rowValue(vietnamese, "electronics", "customBuild.summary.hardwareFinish"), "Không");
});

test("customer-supplied parts is parsed and shown instead of step 4 options", () => {
  const parsed = parseInquiryNotes("wizard:\npickupConfigId=hh\ncustomerSuppliedParts=true");
  assert.equal(parsed.wizard.customerSuppliedParts, true);
  const display = buildInquiryDisplay(
    {
      configuration: {
        selections: { hardware: "hardware.black", pickups: ["pickups.neck-humbucker"] },
        notes: "wizard:\nhardwareFinishId=black\npickupConfigId=hh\ncustomerSuppliedParts=true",
      },
    },
    t("en"),
  );
  assert.equal(
    rowValue(display, "electronics", "customBuild.summary.customerSuppliedParts"),
    "Customer will supply electronics and hardware",
  );
  assert.equal(rowValue(display, "electronics", "customBuild.summary.hardwareFinish"), undefined);
  assert.equal(rowValue(display, "electronics", "customBuild.summary.pickupConfig"), undefined);
});

test("customer-supplied parts payload keeps the flag in notes and omits step 4 catalog ids", () => {
  const payload = buildInquiryPayload({
    selections: {
      contactName: "Lan Pham",
      contactEmail: "lan@example.com",
      contactPhone: "",
      contactMessage: "",
      customerSuppliedParts: true,
      pickupConfigId: "hh",
      pickupTypeId: "humbucker",
      bridgeId: "hardtail",
      hardwareFinishId: "black",
      controlLayoutId: "vol-tone-3way",
      instrumentTypeId: "electric-guitar",
    },
    language: "vi",
    draftId: "draft-own-parts",
    catalog: {
      categories: [
        { id: "hardware", options: [{ id: "hardware.black", code: "black", active: true }] },
        { id: "bridge", options: [{ id: "bridge.hardtail", code: "hardtail", active: true }] },
        { id: "electronics", options: [{ id: "electronics.passive", code: "passive", active: true }] },
        { id: "pickups", options: [{ id: "pickups.neck-humbucker", active: true }, { id: "pickups.bridge-humbucker", active: true }] },
      ],
    },
  });
  assert.equal(payload.configuration.selections.hardware, undefined);
  assert.equal(payload.configuration.selections.bridge, undefined);
  assert.equal(payload.configuration.selections.electronics, undefined);
  assert.equal(payload.configuration.selections.pickups, undefined);
  assert.match(payload.configuration.notes, /customerSuppliedParts=true/);
  assert.equal(payload.configuration.notes.includes("pickupConfigId="), false);
  assert.equal(payload.configuration.notes.includes("hardwareFinishId="), false);
});

test("unknown API-only values are humanized", () => {
  const display = buildInquiryDisplay(
    {
      configuration: {
        selections: {
          "finish-color": "finish-color.natural",
          "custom-details": ["custom-details.dot-inlays"],
        },
        notes: "",
      },
    },
    t("en"),
  );
  assert.equal(rowValue(display, "finish", "customBuild.summary.finishColor"), "Natural");
  assert.equal(rowValue(display, "finish", "customBuild.summary.inlay"), "Dot Inlays");
});
