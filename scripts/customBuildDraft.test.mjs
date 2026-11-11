import assert from "node:assert/strict";
import test from "node:test";
import {
  draftHasProgress,
  isCustomBuildPath,
  isResumableCustomBuildDraft,
  storedDraftShouldStartFresh,
} from "../src/data/customBuildDraftResume.js";
import { tFor } from "../src/i18n/translations.js";

test("empty and submitted drafts are not resumable from the header", () => {
  assert.equal(isResumableCustomBuildDraft(null), false);
  assert.equal(
    isResumableCustomBuildDraft({
      currentStep: 1,
      selections: { fretCount: 24, acknowledgement: false, referenceImages: [] },
      submitStatus: "idle",
    }),
    false,
  );
  assert.equal(
    isResumableCustomBuildDraft({
      currentStep: 6,
      selections: { instrumentTypeId: "type-1" },
      submitStatus: "success",
    }),
    false,
  );
});

test("a started or mid-wizard draft can be continued", () => {
  assert.equal(
    draftHasProgress({
      currentStep: 1,
      selections: { instrumentTypeId: "electric" },
    }),
    true,
  );
  assert.equal(
    isResumableCustomBuildDraft({
      currentStep: 2,
      selections: { instrumentTypeId: "electric" },
      submitStatus: "idle",
    }),
    true,
  );
});

test("a submitted draft starts fresh unless this tab still shows the thank-you screen", () => {
  const submitted = {
    currentStep: 6,
    selections: { instrumentTypeId: "electric" },
    submitStatus: "success",
  };
  assert.equal(storedDraftShouldStartFresh(submitted, null), true);
  assert.equal(storedDraftShouldStartFresh(submitted, submitted), false);
  assert.equal(
    storedDraftShouldStartFresh(
      { currentStep: 2, selections: { instrumentTypeId: "electric" }, submitStatus: "idle" },
      null,
    ),
    false,
  );
});

test("start-custom-build links point at the wizard path", () => {
  assert.equal(isCustomBuildPath("/custom-build"), true);
  assert.equal(isCustomBuildPath("/guitars"), false);
});

test("continue-build copy is bilingual", () => {
  assert.equal(tFor("en", "nav.continueBuild"), "Continue Build");
  assert.equal(tFor("vi", "nav.continueBuild"), "Tiếp tục Build");
});
