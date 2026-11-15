import assert from "node:assert/strict";
import test from "node:test";
import {
  draftHasProgress,
  isCustomBuildPath,
  isResumableCustomBuildDraft,
  storedDraftShouldStartFresh,
} from "../src/data/customBuildDraftResume.js";
import {
  isSafeReturnPath,
  pathFromReferrer,
  rememberCustomBuildReturn,
  resolveCustomBuildReturn,
} from "../src/data/customBuildReturn.js";
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

test("custom build cancel copy is bilingual", () => {
  assert.equal(tFor("en", "customBuild.nav.cancel"), "Cancel");
  assert.equal(tFor("vi", "customBuild.nav.cancel"), "Hủy");
  assert.equal(tFor("en", "customBuild.cancel.title"), "Cancel Custom Build?");
  assert.equal(tFor("vi", "customBuild.cancel.title"), "Hủy Custom Build?");
  assert.equal(tFor("en", "customBuild.cancel.keep"), "Keep build");
  assert.equal(tFor("vi", "customBuild.cancel.keep"), "Tiếp tục thiết kế");
});

test("cancel return path prefers the previous site page and never loops to the wizard", () => {
  assert.equal(isSafeReturnPath("/guitars"), true);
  assert.equal(isSafeReturnPath("/guitars/abc"), true);
  assert.equal(isSafeReturnPath("/custom-build"), false);
  assert.equal(isSafeReturnPath("https://evil.example/"), false);
  assert.equal(isSafeReturnPath("//evil.example"), false);
  assert.equal(resolveCustomBuildReturn("/custom-build"), "/");
  assert.equal(
    pathFromReferrer("https://shop.example/guitars/star", "https://shop.example"),
    "/guitars/star",
  );
  assert.equal(
    pathFromReferrer("https://other.example/guitars", "https://shop.example"),
    "",
  );
  assert.equal(
    rememberCustomBuildReturn({
      fromState: "/custom-build",
      referrer: "https://shop.example/guitars",
      origin: "https://shop.example",
      existing: "/",
    }),
    "/guitars",
  );
  assert.equal(
    rememberCustomBuildReturn({
      referrer: "https://shop.example/custom-build",
      origin: "https://shop.example",
      existing: "/about",
    }),
    "/about",
  );
  assert.equal(
    rememberCustomBuildReturn({
      referrer: "",
      origin: "https://shop.example",
    }),
    "/",
  );
});
