import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { interpretPublicCatalog, listsFromPublicCatalog, optionLabel, optionMatchesAlias, wizardOptionLabel } from "../src/data/wizardCatalog.js";
import { hasConfiguredOptions, visibleSummaryRows } from "../src/data/wizardDisplay.js";
import {
  addTargetCategoryId,
  allowedCompatibilityFields,
  categoryStepId,
  applyCompatibilitySelectAll,
  compatibilityEditorOptions,
  compatibilitySelectAllState,
  filterWizardSetupRows,
  groupsWithOptions,
  keepAllowedCompatibility,
  precedingGroupIds,
  resolveGroupAfterStepChange,
  wizardSetupSteps,
} from "../src/data/wizardSetupLayout.js";
import { applySeriesDefault, pickDefaultOption } from "../src/data/wizardDefaults.js";
import { filterOptions, listedTuners, optionMatches, pruneSelections } from "../src/data/wizardSelection.js";
import { tFor } from "../src/i18n/translations.js";
import { blockedDeleteBody, canStartExclusiveAction, deleteWizardOption, isBlockedDelete } from "../src/services/wizardSetupService.js";

test("wizard setup copy exists in English and Vietnamese", () => {
  assert.equal(tFor("en", "admin.tabs.wizardSetup"), "Custom Build Setup");
  assert.equal(tFor("vi", "admin.tabs.wizardSetup"), "Thiết lập Custom Build");
  assert.equal(tFor("en", "admin.wizardSetup.errors.IN_USE"), "This option is used by existing inquiries, so it cannot be deleted.");
  assert.equal(tFor("en", "customBuild.catalogError").includes("Retry"), true);
  assert.equal(tFor("vi", "customBuild.catalogRetry"), "Thử lại");
  assert.equal(tFor("en", "admin.wizardSetup.deleting"), "Deleting…");
  assert.equal(tFor("vi", "admin.wizardSetup.allGroups"), "Tất cả Group");
  assert.equal(tFor("en", "admin.wizardSetup.fields.wizardStep"), "Wizard step");
  assert.equal(tFor("vi", "admin.wizardSetup.selectAll"), "Tất cả");
  assert.equal(tFor("en", "admin.wizardSetup.selectAll"), "All");
  assert.equal(tFor("vi", "admin.wizardSetup.compatNone"), "Không có nhóm đứng trước.");
  assert.equal(tFor("en", "admin.wizardSetup.errors.FORWARD_COMPAT").includes("before"), true);
  assert.equal(tFor("en", "admin.wizardSetup.errors.INACTIVE_COMPAT").includes("active"), true);
  assert.equal(tFor("en", "customBuild.step4.customerSuppliedLabel"), "I will supply my own parts");
  assert.equal(tFor("vi", "customBuild.step4.customerSuppliedLabel"), "Tôi tự chuẩn bị / đã có sẵn linh kiện");
  assert.equal(tFor("en", "customBuild.summary.customerSuppliedParts"), "Customer-supplied parts");
});

test("failed public catalog loads do not invent local option lists", () => {
  assert.deepEqual(interpretPublicCatalog({ ok: false, catalog: null }), {
    ok: false,
    lists: null,
    reason: "unavailable",
  });
  assert.equal(interpretPublicCatalog({ ok: true, catalog: { categories: [] } }).ok, false);
  const incomplete = interpretPublicCatalog({
    ok: true,
    catalog: { categories: [{ id: "series", options: [{ id: "series.solid-body", code: "solid-body", active: true }] }] },
  });
  assert.equal(incomplete.ok, false);
  assert.equal(incomplete.reason, "incomplete");
  const live = interpretPublicCatalog({
    ok: true,
    catalog: {
      categories: [
        { id: "instrument-type", options: [{ id: "instrument-type.electric-guitar", code: "electric-guitar", active: true }] },
        { id: "series", options: [{ id: "series.solid-body", code: "solid-body", active: true }] },
      ],
    },
  });
  assert.equal(live.ok, true);
  assert.deepEqual(live.lists.series.map((item) => item.id), ["solid-body"]);
  assert.equal(live.lists.instrumentTypes[0].id, "electric-guitar");
});

test("public catalog lists filter by compatibility and prune downstream selections", () => {
  const lists = listsFromPublicCatalog({
    categories: [
      {
        id: "series",
        options: [
          {
            id: "series.solid-body",
            code: "solid-body",
            name: "Solid",
            active: true,
            defaultForInstrumentTypeIds: ["electric-guitar"],
            compatibility: { instrumentTypeIds: ["electric-guitar"] },
          },
          {
            id: "series.headless",
            code: "headless",
            name: "Headless",
            active: true,
            defaultForInstrumentTypeIds: ["bass"],
            compatibility: { instrumentTypeIds: ["bass"] },
          },
          {
            id: "series.hidden",
            code: "hidden",
            name: "Hidden",
            active: false,
            compatibility: { instrumentTypeIds: ["electric-guitar"] },
          },
        ],
      },
    ],
  });
  const series = lists.series;
  const available = series.filter(
    (item) => !item.instrumentTypeIds?.length || item.instrumentTypeIds.includes("electric-guitar"),
  );
  assert.deepEqual(
    available.map((item) => item.id),
    ["solid-body"],
  );
  const selections = {
    instrumentTypeId: "electric-guitar",
    seriesId: "headless",
    shapeId: "offset",
  };
  if (!available.some((item) => item.id === selections.seriesId)) {
    selections.seriesId = null;
    selections.shapeId = null;
  }
  assert.equal(selections.seriesId, null);
  assert.equal(selections.shapeId, null);
  assert.equal(optionLabel(series[0], "en", tFor.bind(null, "en")), "Solid");
});

test("wizard option labels never show raw translation keys", () => {
  const tEn = tFor.bind(null, "en");
  const tVi = tFor.bind(null, "vi");
  const noneFinish = {
    id: "none",
    name: "None",
    translations: { en: { name: "None" }, vi: { name: "Không" } },
  };
  const gloss = { id: "gloss", name: "Gloss" };
  const discuss = {
    id: "discuss-custom",
    name: "customBuild.finishColors.discuss-custom.name",
    translations: {},
  };
  const missing = { id: "none" };

  assert.equal(wizardOptionLabel(noneFinish, "en", tEn, "hardwareFinishes"), "None");
  assert.equal(wizardOptionLabel(noneFinish, "vi", tVi, "hardwareFinishes"), "Không");
  assert.equal(wizardOptionLabel(gloss, "en", tEn, "finishTypes"), "Gloss");
  assert.equal(wizardOptionLabel(discuss, "vi", tVi, "finishColors"), "Discuss Custom");
  assert.equal(wizardOptionLabel(missing, "en", tEn, "hardwareFinishes"), "None");
  assert.equal(
    optionLabel(gloss, "en", tEn, "customBuild.finishTypes.gloss.name").includes("customBuild."),
    false,
  );
});

test("inactive wizard options stay out of lists, defaults, and compatibility filters", () => {
  const lists = listsFromPublicCatalog({
    categories: [
      {
        id: "instrument-type",
        options: [
          { id: "instrument-type.electric-guitar", code: "electric-guitar", name: "Electric", active: true },
          { id: "instrument-type.bass", code: "bass", name: "Bass", active: false },
        ],
      },
      {
        id: "series",
        options: [
          {
            id: "series.solid-body",
            code: "solid-body",
            name: "Solid",
            active: true,
            isDefault: true,
            compatibility: { instrumentTypeIds: ["electric-guitar"] },
          },
          {
            id: "series.hidden",
            code: "hidden",
            name: "Hidden",
            active: false,
            isDefault: true,
            defaultForInstrumentTypeIds: ["electric-guitar"],
            compatibility: { instrumentTypeIds: ["electric-guitar"] },
          },
        ],
      },
    ],
  });
  assert.deepEqual(lists.instrumentTypes.map((item) => item.id), ["electric-guitar"]);
  assert.deepEqual(lists.series.map((item) => item.id), ["solid-body"]);
  assert.equal(pickDefaultOption(lists.series, "electric-guitar").id, "solid-body");
  assert.equal(
    pickDefaultOption([
      { id: "hidden", active: false, isDefault: true, defaultForInstrumentTypeIds: ["electric-guitar"] },
      { id: "solid-body", active: true, isDefault: true },
    ], "electric-guitar").id,
    "solid-body",
  );
  const mixed = [
    { id: "hidden", optionId: "series.hidden", active: false, instrumentTypeIds: ["electric-guitar"] },
    { id: "solid-body", optionId: "series.solid-body", active: true, instrumentTypeIds: ["electric-guitar"] },
  ];
  assert.deepEqual(
    filterOptions(mixed, { instrumentTypeId: "electric-guitar" }, lists, "series").map((item) => item.id),
    ["solid-body"],
  );
});

test("compatibility editor hides inactive options and does not keep them on save", () => {
  const categories = [
    {
      id: "instrument-type",
      options: [
        { id: "instrument-type.electric-guitar", code: "electric-guitar", name: "Electric", active: true },
        { id: "instrument-type.bass", code: "bass", name: "Bass", active: false },
      ],
    },
    {
      id: "series",
      options: [
        { id: "series.solid-body", code: "solid-body", name: "Solid", active: true },
        { id: "series.hidden", code: "hidden", name: "Hidden", active: false },
      ],
    },
    { id: "body-shape", options: [{ id: "body-shape.offset", code: "offset", name: "Offset", active: true }] },
  ];
  assert.deepEqual(
    compatibilityEditorOptions(categories[1].options).map((item) => item.id),
    ["series.solid-body"],
  );
  const saved = keepAllowedCompatibility({
    instrumentTypeIds: ["electric-guitar", "bass"],
    seriesIds: ["solid-body", "hidden"],
    shapeIds: ["offset"],
  }, "body-shape", categories);
  assert.deepEqual(saved.instrumentTypeIds, ["electric-guitar"]);
  assert.deepEqual(saved.seriesIds, ["solid-body"]);
  assert.deepEqual(saved.shapeIds, []);

  const shape = {
    id: "offset",
    optionId: "body-shape.offset",
    active: true,
    seriesIds: ["hidden"],
  };
  const wizardLists = {
    series: [
      { id: "solid-body", optionId: "series.solid-body", code: "solid-body", active: true },
      { id: "hidden", optionId: "series.hidden", code: "hidden", active: false },
    ],
  };
  assert.equal(optionMatches(shape, { seriesId: "solid-body" }, wizardLists, "body-shape"), false);
  assert.equal(optionMatches(shape, { seriesId: "hidden" }, wizardLists, "body-shape"), false);
  const reactivated = {
    series: [
      { id: "solid-body", optionId: "series.solid-body", code: "solid-body", active: true },
      { id: "hidden", optionId: "series.hidden", code: "hidden", active: true },
    ],
  };
  assert.equal(optionMatches(shape, { seriesId: "hidden" }, reactivated, "body-shape"), true);
});

test("compatibility select-all only snapshots currently active options", () => {
  const field = { key: "seriesIds", categoryId: "series" };
  const series = [
    { id: "series.solid-body", code: "solid-body", name: "Solid", active: true },
    { id: "series.headless", code: "headless", name: "Headless", active: true },
    { id: "series.hidden", code: "hidden", name: "Hidden", active: false },
  ];
  const active = compatibilityEditorOptions(series);
  const empty = compatibilitySelectAllState([], [], "series");
  assert.equal(empty.disabled, true);
  assert.equal(empty.checked, false);

  const none = compatibilitySelectAllState([], active, "series");
  assert.equal(none.checked, false);
  assert.equal(none.indeterminate, false);

  const partial = compatibilitySelectAllState(["solid-body"], active, "series");
  assert.equal(partial.checked, false);
  assert.equal(partial.indeterminate, true);
  assert.equal(partial.selectedCount, 1);

  const allSelected = applyCompatibilitySelectAll(["hidden"], active, field, "series", true);
  assert.deepEqual(allSelected, ["solid-body", "headless"]);
  assert.equal(allSelected.includes("hidden"), false);
  const allState = compatibilitySelectAllState(allSelected, active, "series");
  assert.equal(allState.checked, true);
  assert.equal(allState.indeterminate, false);

  const cleared = applyCompatibilitySelectAll(allSelected, active, field, "series", false);
  assert.deepEqual(cleared, []);

  const categories = [
    { id: "instrument-type", options: [{ id: "instrument-type.electric-guitar", code: "electric-guitar", active: true }] },
    { id: "series", options: series },
    { id: "body-shape", options: [{ id: "body-shape.offset", code: "offset", active: true }] },
  ];
  const saved = keepAllowedCompatibility({ seriesIds: allSelected, shapeIds: ["offset"] }, "body-shape", categories);
  assert.deepEqual(saved.seriesIds, ["solid-body", "headless"]);
  assert.deepEqual(saved.shapeIds, []);
  const withExtra = compatibilityEditorOptions([
    ...series,
    { id: "series.extra", code: "extra", active: true },
  ]);
  const afterNew = compatibilitySelectAllState(["solid-body", "headless"], withExtra, "series");
  assert.equal(afterNew.checked, false);
  assert.equal(afterNew.indeterminate, true);
});

test("scoped series defaults apply only after type is chosen and stay compatible", () => {
  const series = [
    {
      id: "solid-body",
      isDefault: true,
      defaultForInstrumentTypeIds: ["electric-guitar"],
      instrumentTypeIds: ["electric-guitar"],
    },
    {
      id: "p-series",
      defaultForInstrumentTypeIds: ["bass"],
      instrumentTypeIds: ["bass"],
    },
  ];
  assert.equal(pickDefaultOption(series, "electric-guitar").id, "solid-body");
  assert.equal(pickDefaultOption(series, "bass").id, "p-series");
  const availableBass = series.filter((item) => item.instrumentTypeIds.includes("bass"));
  const next = applySeriesDefault({ instrumentTypeId: "bass", seriesId: null }, availableBass);
  assert.equal(next.seriesId, "p-series");
  const kept = applySeriesDefault({ instrumentTypeId: "bass", seriesId: "custom" }, availableBass);
  assert.equal(kept.seriesId, "custom");
});

test("wizard selections keep only active compatible options and prune stale later steps", () => {
  const lists = {
    instrumentTypes: [{ id: "electric-guitar", optionId: "instrument-type.electric-guitar", code: "electric-guitar" }],
    series: [
      {
        id: "solid-body",
        optionId: "series.solid-body",
        code: "solid-body",
        instrumentTypeIds: ["instrument-type.electric-guitar"],
      },
      {
        id: "headless",
        optionId: "series.headless",
        code: "headless",
        instrumentTypeIds: ["bass"],
      },
    ],
    shapes: [
      {
        id: "offset",
        optionId: "body-shape.offset",
        code: "offset",
        seriesIds: ["solid-body"],
      },
      {
        id: "dreadnought-style",
        optionId: "body-shape.dreadnought-style",
        code: "dreadnought-style",
      },
    ],
  };
  const available = filterOptions(lists.series, { instrumentTypeId: "electric-guitar" }, lists);
  assert.deepEqual(available.map((item) => item.id), ["solid-body"]);
  const pruned = pruneSelections({
    instrumentTypeId: "electric-guitar",
    seriesId: "headless",
    shapeId: "offset",
    scaleId: "25.5",
  }, lists);
  assert.equal(pruned.seriesId, null);
  assert.equal(pruned.shapeId, null);
  assert.equal(pruned.scaleId, null);
  const deactivatedType = pruneSelections({
    instrumentTypeId: "classical-guitar",
    seriesId: "solid-body",
    shapeId: "offset",
  }, lists);
  assert.equal(deactivatedType.instrumentTypeId, null);
  assert.equal(deactivatedType.seriesId, null);
  const keptDraft = pruneSelections({ instrumentTypeId: "electric-guitar", seriesId: "solid-body" }, null);
  assert.equal(keptDraft.seriesId, "solid-body");
  const unrestricted = filterOptions(lists.shapes, { instrumentTypeId: "electric-guitar", seriesId: "solid-body" }, lists);
  assert.deepEqual(unrestricted.map((item) => item.id), ["offset", "dreadnought-style"]);
});

test("compatibility aliases keep stored wizard ids", () => {
  const option = { id: "scale.25-5", code: "25-5", attributes: { wizardId: "25.5" } };
  assert.equal(optionMatchesAlias(option, "scale", "25.5"), true);
  assert.equal(optionMatchesAlias(option, "scale", "25-5"), true);
  assert.equal(optionMatchesAlias(option, "scale", "24.75"), false);
});

test("deleteWizardOption only succeeds after the server confirms deletion", async () => {
  const blocked = await deleteWizardOption(async () => ({
    ok: false,
    status: 409,
    payload: { success: false, error: { details: [{ code: "IN_USE", message: "Deactivate this option instead of deleting it." }] } },
  }), "series", "series.solid-body");
  assert.equal(blocked.ok, false);
  assert.equal(blocked.code, "IN_USE");
  assert.equal(isBlockedDelete(blocked), true);
  assert.equal(isBlockedDelete({ code: "LAST_OPTION" }), true);
  assert.equal(isBlockedDelete({ code: "REFERENCED" }), false);
  assert.equal(
    blockedDeleteBody((code) => tFor("vi", `admin.wizardSetup.errors.${code}`), blocked),
    tFor("vi", "admin.wizardSetup.errors.IN_USE"),
  );
  assert.match(
    blockedDeleteBody((code) => tFor("en", `admin.wizardSetup.errors.${code}`), {
      code: "REFERENCED",
      references: [{ name: "Offset" }, { name: "Compact modern" }],
    }),
    /Offset, Compact modern/,
  );

  const missing = await deleteWizardOption(async () => ({
    ok: false,
    status: 404,
    payload: { success: false, error: { code: "NOT_FOUND" } },
  }), "series", "series.missing");
  assert.equal(missing.code, "NOT_FOUND");

  const forbidden = await deleteWizardOption(async () => ({
    ok: false,
    status: 403,
    payload: { success: false, error: { code: "FORBIDDEN" } },
  }), "series", "series.solid-body");
  assert.equal(forbidden.code, "FORBIDDEN");

  const server = await deleteWizardOption(async () => ({
    ok: false,
    status: 500,
    payload: { success: false, error: { code: "SERVER_ERROR" } },
  }), "series", "series.solid-body");
  assert.equal(server.code, "SERVER_ERROR");

  const fakeSuccess = await deleteWizardOption(async () => ({
    ok: true,
    status: 200,
    payload: { success: true, data: {} },
  }), "series", "series.solid-body");
  assert.equal(fakeSuccess.ok, false);

  const ok = await deleteWizardOption(async () => ({
    ok: true,
    status: 200,
    payload: { success: true, data: { deleted: true, id: "series.solid-body" } },
  }), "series", "series.solid-body");
  assert.equal(ok.ok, true);
  assert.equal(canStartExclusiveAction(false), true);
  assert.equal(canStartExclusiveAction("series.solid-body"), false);
});

test("wizard setup tabs and group filters follow API category steps", () => {
  const categories = [
    {
      id: "series",
      step: 1,
      name: "Series",
      options: [
        { id: "series.solid-body", code: "solid-body", name: "Solid", active: true },
        { id: "series.headless", code: "headless", name: "Headless", active: false },
      ],
    },
    {
      id: "body-wood",
      step: 2,
      name: "Body wood",
      options: [{ id: "body-wood.alder", code: "alder", name: "Alder", active: true }],
    },
    { id: "top-wood", step: 2, name: "Top wood", options: [] },
    {
      id: "solo-group",
      name: "Solo",
      options: [{ id: "solo-group.only", code: "only", name: "Only", active: true }],
    },
  ];
  const steps = wizardSetupSteps(categories);
  assert.deepEqual(steps.map((item) => item.id), ["1", "2", "unassigned"]);
  assert.equal(steps.find((item) => item.id === "1").optionCount, 2);
  assert.equal(steps.find((item) => item.id === "2").optionCount, 1);
  assert.equal(categoryStepId({ id: "body-shape" }), "1");

  const stepTwoGroups = groupsWithOptions(steps.find((item) => item.id === "2").categories);
  assert.deepEqual(stepTwoGroups.map((item) => item.id), ["body-wood"]);
  assert.equal(resolveGroupAfterStepChange("series", stepTwoGroups), "");
  assert.equal(resolveGroupAfterStepChange("body-wood", stepTwoGroups), "body-wood");

  const stepOne = filterWizardSetupRows({ categories, stepId: "1", groupId: "", status: "", search: "" });
  assert.deepEqual(stepOne.map((row) => row.option.id), ["series.solid-body", "series.headless"]);
  assert.equal(stepOne.some((row) => row.category.id === "body-wood"), false);

  const grouped = filterWizardSetupRows({ categories, stepId: "1", groupId: "series", status: "active", search: "sol" });
  assert.deepEqual(grouped.map((row) => row.option.id), ["series.solid-body"]);

  const inactive = filterWizardSetupRows({ categories, stepId: "1", groupId: "", status: "inactive", search: "" });
  assert.deepEqual(inactive.map((row) => row.option.id), ["series.headless"]);

  assert.equal(
    addTargetCategoryId("series", steps.find((item) => item.id === "1").categories, groupsWithOptions(steps[0].categories)),
    "series",
  );
});

test("compatibility only includes earlier wizard groups", () => {
  assert.deepEqual(precedingGroupIds("series"), ["instrument-type"]);
  assert.deepEqual(precedingGroupIds("body-shape"), ["instrument-type", "series"]);
  const scaleKeys = allowedCompatibilityFields("scale").map((item) => item.key);
  assert.equal(scaleKeys.includes("instrumentTypeIds"), true);
  assert.equal(scaleKeys.includes("seriesIds"), true);
  assert.equal(scaleKeys.includes("shapeIds"), true);
  assert.equal(scaleKeys.includes("stringCounts"), false);
  assert.equal(scaleKeys.includes("bodyWoodIds"), false);
  assert.deepEqual(allowedCompatibilityFields("instrument-type"), []);
  const pickupKeys = allowedCompatibilityFields("pickup-config").map((item) => item.key);
  assert.equal(pickupKeys.includes("instrumentTypeIds"), true);
  assert.equal(pickupKeys.includes("seriesIds"), true);
  assert.equal(pickupKeys.includes("shapeIds"), true);
  assert.equal(pickupKeys.includes("bodyWoodIds"), false);
  const pickupTypeKeys = allowedCompatibilityFields("pickups").map((item) => item.key);
  assert.equal(pickupTypeKeys.includes("instrumentTypeIds"), true);
  assert.equal(pickupTypeKeys.includes("seriesIds"), true);
  assert.equal(pickupTypeKeys.includes("pickupConfigIds"), true);
  assert.equal(pickupTypeKeys.includes("bodyWoodIds"), false);
  const finishColorKeys = allowedCompatibilityFields("finish-color").map((item) => item.key);
  assert.equal(finishColorKeys.includes("instrumentTypeIds"), true);
  assert.equal(finishColorKeys.includes("seriesIds"), true);
  assert.equal(finishColorKeys.includes("finishTypeIds"), true);
  assert.equal(finishColorKeys.includes("fingerboardWoodIds"), false);

  const savedPickupCompat = keepAllowedCompatibility(
    {
      instrumentTypeIds: ["electric-guitar"],
      seriesIds: ["solid-body"],
      bodyWoodIds: ["mahogany"],
      fingerboardWoodIds: ["ebony"],
    },
    "pickup-config",
    [
      {
        id: "instrument-type",
        options: [{ id: "instrument-type.electric-guitar", code: "electric-guitar", active: true }],
      },
      {
        id: "series",
        options: [{ id: "series.solid-body", code: "solid-body", active: true }],
      },
      {
        id: "body-wood",
        options: [{ id: "body-wood.mahogany", code: "mahogany", active: true }],
      },
      {
        id: "fingerboard",
        options: [{ id: "fingerboard.ebony", code: "ebony", active: true }],
      },
    ],
  );
  assert.deepEqual(savedPickupCompat.instrumentTypeIds, ["electric-guitar"]);
  assert.deepEqual(savedPickupCompat.seriesIds, ["solid-body"]);
  assert.deepEqual(savedPickupCompat.bodyWoodIds, []);
  assert.deepEqual(savedPickupCompat.fingerboardWoodIds, []);
  const bodyWoodKeys = allowedCompatibilityFields("body-wood").map((item) => item.key);
  assert.equal(bodyWoodKeys.includes("seriesIds"), true);
  assert.equal(bodyWoodKeys.includes("shapeIds"), true);

  const lists = {
    instrumentTypes: [{ id: "electric-guitar", optionId: "instrument-type.electric-guitar", code: "electric-guitar" }],
    stringCounts: [{ id: "6", optionId: "string-count.6", code: "6" }],
  };
  const scale = {
    id: "25.5",
    optionId: "scale.25-5",
    instrumentTypeIds: ["electric-guitar"],
    stringCounts: ["6"],
  };
  assert.equal(
    optionMatches(scale, { instrumentTypeId: "electric-guitar", stringCount: "7" }, lists, "scale"),
    true,
  );
  assert.equal(
    optionMatches(scale, { instrumentTypeId: "bass", stringCount: "6" }, lists, "scale"),
    false,
  );
  const series = {
    id: "solid-body",
    optionId: "series.solid-body",
    instrumentTypeIds: ["electric-guitar"],
    shapeIds: ["offset"],
  };
  assert.equal(
    optionMatches(series, { instrumentTypeId: "electric-guitar", shapeId: "t-style" }, lists, "series"),
    true,
  );
});

test("unconfigured tuner groups stay out of wizard lists and summary", () => {
  const tEn = tFor.bind(null, "en");
  const headlessLists = {
    series: [{ id: "headless", code: "headless", name: "Headless", active: true, headless: true }],
    tuners: [],
    bridges: [{ id: "hardtail", name: "Hardtail", active: true }],
  };
  assert.deepEqual(listedTuners(headlessLists, { seriesId: "headless", bridgeId: "hardtail" }), []);
  assert.equal(hasConfiguredOptions([]), false);
  const headlessSummary = visibleSummaryRows([
    { key: "tuners", label: tFor("vi", "customBuild.summary.tuners"), value: wizardOptionLabel(null, "vi", tFor.bind(null, "vi"), "tuners") || null },
    { key: "bridge", label: "Bridge", value: "Hardtail" },
  ]);
  assert.equal(headlessSummary.some((row) => row.key === "tuners"), false);
  assert.equal(JSON.stringify(headlessSummary).includes(tFor("vi", "customBuild.step4.tunersNotApplicable")), false);

  const inactiveLists = {
    series: [{ id: "solid-body", code: "solid-body", name: "Solid", active: true }],
    tuners: [{ id: "hidden-tuner", name: "Hidden", active: false }],
    bridges: [{ id: "hardtail", traditionalTuners: true, active: true }],
  };
  assert.deepEqual(listedTuners(inactiveLists, { seriesId: "solid-body", bridgeId: "hardtail" }), []);

  const mixedLists = {
    series: [{ id: "solid-body", code: "solid-body", name: "Solid", active: true }],
    tuners: [
      { id: "hipshot", name: "Hipshot", active: true, seriesIds: ["solid-body"] },
      { id: "other", name: "Other", active: true, seriesIds: ["headless"] },
    ],
    bridges: [{ id: "hardtail", traditionalTuners: true, active: true }],
  };
  const compatible = listedTuners(mixedLists, { seriesId: "solid-body", bridgeId: "hardtail" });
  assert.deepEqual(compatible.map((item) => item.id), ["hipshot"]);
  assert.equal(wizardOptionLabel(compatible[0], "en", tEn, "tuners"), "Hipshot");
  const shown = visibleSummaryRows([
    { key: "tuners", label: "Tuners", value: wizardOptionLabel(compatible[0], "en", tEn, "tuners") },
  ]);
  assert.equal(shown[0].value, "Hipshot");

  assert.equal(
    listedTuners({ tuners: [] }, { seriesId: "solid-body" }).some((item) => item.id === "hipshot-style-ultralight"),
    false,
  );

  const failed = interpretPublicCatalog({ ok: false, catalog: null });
  assert.equal(failed.ok, false);
  assert.equal(failed.lists, null);
});

test("customer-supplied parts clears step 4 options and is not restored", () => {
  const lists = {
    pickupConfigs: [{ id: "hh", name: "HH", active: true }],
    pickupTypes: [{ id: "humbucker", name: "Humbucker", active: true }],
    bridges: [{ id: "hardtail", name: "Hardtail", active: true, traditionalTuners: true }],
    tuners: [{ id: "hipshot", name: "Hipshot", active: true }],
    hardwareFinishes: [{ id: "black", name: "Black", active: true }],
    controlLayouts: [{ id: "vol-tone-3way", name: "VT", active: true }],
    series: [{ id: "solid-body", name: "Solid", active: true }],
    finishTypes: [{ id: "gloss", name: "Gloss", active: true }],
  };
  const enabled = pruneSelections(
    {
      seriesId: "solid-body",
      pickupConfigId: "hh",
      pickupTypeId: "humbucker",
      bridgeId: "hardtail",
      tunerId: "hipshot",
      hardwareFinishId: "black",
      controlLayoutId: "vol-tone-3way",
      customerSuppliedParts: true,
      finishTypeId: "gloss",
    },
    lists,
  );
  assert.equal(enabled.customerSuppliedParts, true);
  assert.equal(enabled.pickupConfigId, null);
  assert.equal(enabled.pickupTypeId, null);
  assert.equal(enabled.bridgeId, null);
  assert.equal(enabled.tunerId, null);
  assert.equal(enabled.hardwareFinishId, null);
  assert.equal(enabled.controlLayoutId, null);
  assert.equal(enabled.finishTypeId, "gloss");

  const disabled = pruneSelections({ ...enabled, customerSuppliedParts: false }, lists);
  assert.equal(disabled.customerSuppliedParts, false);
  assert.equal(disabled.pickupConfigId, null);
  assert.equal(disabled.bridgeId, null);
});

test("pickup positions are not shown in the wizard, summary, or inquiry copy", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const files = [
    "src/components/custom-build/steps/StepElectronicsHardware.jsx",
    "src/pages/CustomBuild.jsx",
    "src/components/custom-build/steps/StepReviewSubmit.jsx",
    "src/services/inquiryDisplay.js",
    "src/services/customBuildPayload.js",
  ];
  for (const file of files) {
    const text = readFileSync(join(root, file), "utf8");
    assert.equal(text.includes("positionsLabel"), false, file);
    assert.equal(text.includes("step4.positions"), false, file);
    assert.equal(text.includes("pickupConfig?.positions"), false, file);
  }
  assert.equal(tFor("vi", "customBuild.step4.positionsLabel"), "customBuild.step4.positionsLabel");
  assert.equal(tFor("en", "customBuild.step4.positions.neck"), "customBuild.step4.positions.neck");
  assert.equal(tFor("vi", "customBuild.step4.configLabel"), "Cấu hình pickup");
});

test("steps 4 and 5 depend on step 1 type and series, not woods", () => {
  const lists = {
    instrumentTypes: [
      { id: "electric-guitar", optionId: "instrument-type.electric-guitar", code: "electric-guitar", active: true },
      { id: "bass", optionId: "instrument-type.bass", code: "bass", active: true },
    ],
    series: [
      { id: "solid-body", optionId: "series.solid-body", code: "solid-body", active: true, instrumentTypeIds: ["electric-guitar"] },
      { id: "headless", optionId: "series.headless", code: "headless", active: true, headless: true, instrumentTypeIds: ["electric-guitar"] },
    ],
    shapes: [{ id: "offset", optionId: "body-shape.offset", code: "offset", active: true, seriesIds: ["solid-body"] }],
    bodyWoods: [
      { id: "mahogany", optionId: "body-wood.mahogany", code: "mahogany", active: true, instrumentTypeIds: ["electric-guitar"] },
      { id: "alder", optionId: "body-wood.alder", code: "alder", active: true, instrumentTypeIds: ["electric-guitar"] },
    ],
    neckWoods: [{ id: "maple", optionId: "neck-wood.maple", code: "maple", active: true, bodyWoodIds: ["mahogany"] }],
    fingerboardWoods: [
      { id: "ebony", optionId: "fingerboard.ebony", code: "ebony", active: true, neckWoodIds: ["maple"] },
    ],
    pickupConfigs: [
      {
        id: "hh",
        optionId: "pickup-config.hh",
        code: "hh",
        name: "HH",
        active: true,
        instrumentTypeIds: ["electric-guitar"],
        seriesIds: ["solid-body"],
        bodyWoodIds: ["mahogany"],
      },
      {
        id: "bass-hh",
        optionId: "pickup-config.bass-hh",
        code: "bass-hh",
        name: "Bass HH",
        active: true,
        instrumentTypeIds: ["bass"],
      },
    ],
    pickupTypes: [
      {
        id: "humbucker",
        optionId: "pickups.humbucker",
        code: "humbucker",
        name: "Humbucker",
        active: true,
        instrumentTypeIds: ["electric-guitar"],
        pickupConfigIds: ["hh"],
        seriesIds: ["solid-body"],
      },
    ],
    bridges: [
      {
        id: "hardtail",
        optionId: "bridge.hardtail",
        code: "hardtail",
        name: "Hardtail",
        active: true,
        traditionalTuners: true,
        instrumentTypeIds: ["electric-guitar"],
        seriesIds: ["solid-body"],
      },
    ],
    tuners: [
      {
        id: "hipshot",
        optionId: "tuners.hipshot",
        code: "hipshot",
        name: "Hipshot",
        active: true,
        instrumentTypeIds: ["electric-guitar"],
        seriesIds: ["solid-body"],
      },
    ],
    hardwareFinishes: [
      { id: "black", optionId: "hardware.black", code: "black", name: "Black", active: true, instrumentTypeIds: ["electric-guitar", "bass"] },
    ],
    controlLayouts: [
      {
        id: "vol-tone-3way",
        optionId: "electronics.vol-tone-3way",
        code: "vol-tone-3way",
        name: "VT",
        active: true,
        instrumentTypeIds: ["electric-guitar"],
        pickupConfigIds: ["hh"],
      },
    ],
    finishTypes: [
      {
        id: "gloss",
        optionId: "finish-type.gloss",
        code: "gloss",
        name: "Gloss",
        active: true,
        instrumentTypeIds: ["electric-guitar"],
        bodyWoodIds: ["mahogany"],
        seriesIds: ["solid-body"],
      },
    ],
    finishColors: [
      {
        id: "natural",
        optionId: "finish-color.natural",
        code: "natural",
        name: "Natural",
        active: true,
        instrumentTypeIds: ["electric-guitar"],
        finishTypeIds: ["gloss"],
        bodyWoodIds: ["mahogany"],
      },
    ],
    inlays: [
      {
        id: "dots",
        optionId: "inlay.dots",
        code: "dots",
        name: "Dots",
        active: true,
        instrumentTypeIds: ["electric-guitar"],
        fingerboardWoodIds: ["ebony"],
      },
    ],
    engravings: [
      {
        id: "optional-top",
        optionId: "engraving.optional-top",
        code: "optional-top",
        name: "Optional",
        active: true,
        instrumentTypeIds: ["electric-guitar"],
        topWoodIds: ["exotic-figured"],
      },
    ],
  };

  const electricMahogany = {
    instrumentTypeId: "electric-guitar",
    seriesId: "solid-body",
    shapeId: "offset",
    bodyWoodId: "mahogany",
    neckWoodId: "maple",
    fingerboardWoodId: "ebony",
    pickupConfigId: "hh",
    pickupTypeId: "humbucker",
    bridgeId: "hardtail",
    tunerId: "hipshot",
    hardwareFinishId: "black",
    controlLayoutId: "vol-tone-3way",
    finishTypeId: "gloss",
    finishColorId: "natural",
    inlayId: "dots",
    engravingId: "optional-top",
  };

  const ids = (options) => options.map((item) => item.id);
  const stepFourFive = (selections) => ({
    pickupConfigs: ids(filterOptions(lists.pickupConfigs, selections, lists, "pickup-config")),
    pickupTypes: ids(filterOptions(lists.pickupTypes, selections, lists, "pickups")),
    bridges: ids(filterOptions(lists.bridges, selections, lists, "bridge")),
    tuners: ids(listedTuners(lists, selections)),
    hardware: ids(filterOptions(lists.hardwareFinishes, selections, lists, "hardware")),
    electronics: ids(filterOptions(lists.controlLayouts, selections, lists, "electronics")),
    finishTypes: ids(filterOptions(lists.finishTypes, selections, lists, "finish-type")),
    finishColors: ids(filterOptions(lists.finishColors, selections, lists, "finish-color")),
    inlays: ids(filterOptions(lists.inlays, selections, lists, "inlay")),
    engravings: ids(filterOptions(lists.engravings, selections, lists, "engraving")),
  });

  const baseline = stepFourFive(electricMahogany);
  assert.deepEqual(baseline.pickupConfigs, ["hh"]);
  assert.deepEqual(baseline.inlays, ["dots"]);
  assert.deepEqual(baseline.engravings, ["optional-top"]);

  const afterSeries = stepFourFive({ ...electricMahogany, seriesId: "headless" });
  assert.deepEqual(afterSeries.pickupConfigs, []);
  assert.deepEqual(afterSeries.finishTypes, []);
  assert.deepEqual(afterSeries.tuners, []);
  assert.deepEqual(afterSeries.hardware, ["black"]);
  assert.deepEqual(afterSeries.inlays, ["dots"]);

  const afterShape = stepFourFive({ ...electricMahogany, shapeId: "t-style" });
  assert.deepEqual(afterShape, baseline);

  const afterBody = stepFourFive({ ...electricMahogany, bodyWoodId: "alder" });
  assert.deepEqual(afterBody, baseline);

  const afterFingerboard = stepFourFive({ ...electricMahogany, fingerboardWoodId: null, neckWoodId: null });
  assert.deepEqual(afterFingerboard, baseline);

  const afterType = stepFourFive({ ...electricMahogany, instrumentTypeId: "bass" });
  assert.deepEqual(afterType.pickupConfigs, ["bass-hh"]);
  assert.deepEqual(afterType.pickupTypes, []);
  assert.deepEqual(afterType.finishTypes, []);
  assert.deepEqual(afterType.inlays, []);

  const prunedSeries = pruneSelections({ ...electricMahogany, seriesId: "headless" }, lists);
  assert.equal(prunedSeries.pickupConfigId, null);
  assert.equal(prunedSeries.finishTypeId, null);
  assert.equal(prunedSeries.tunerId, null);
  assert.equal(prunedSeries.inlayId, "dots");
  assert.equal(prunedSeries.hardwareFinishId, "black");
  assert.equal(prunedSeries.shapeId, null);
  assert.equal(prunedSeries.neckWoodId, null);

  const prunedBody = pruneSelections({ ...electricMahogany, bodyWoodId: "alder" }, lists);
  assert.equal(prunedBody.pickupConfigId, "hh");
  assert.equal(prunedBody.finishColorId, "natural");
  assert.equal(prunedBody.engravingId, "optional-top");
  assert.equal(prunedBody.neckWoodId, null);

  const prunedType = pruneSelections({ ...electricMahogany, instrumentTypeId: "bass" }, lists);
  assert.equal(prunedType.pickupConfigId, null);
  assert.equal(prunedType.pickupTypeId, null);
  assert.equal(prunedType.finishTypeId, null);
  assert.equal(prunedType.inlayId, null);
  assert.equal(prunedType.hardwareFinishId, "black");

  const review = visibleSummaryRows([
    { key: "pickupConfig", label: "Pickup", value: "HH" },
    { key: "finish", label: "Finish", value: "Gloss" },
    { key: "inlay", label: "Inlay", value: "Dots" },
  ]);
  assert.deepEqual(review.map((row) => row.key), ["pickupConfig", "finish", "inlay"]);
});
