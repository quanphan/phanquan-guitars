import assert from "node:assert/strict";
import test from "node:test";
import {
  REFERENCE_IMAGE_MAX,
  remainingReferenceImageSlots,
  sanitizeReferenceImages,
  validateReferenceImageFile,
} from "../src/data/referenceImages.js";
import { tFor } from "../src/i18n/translations.js";
import { buildInquiryDisplay } from "../src/services/inquiryDisplay.js";
import { buildInquiryPayload } from "../src/services/customBuildPayload.js";

const storedPath = "/uploads/custom-build/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg";
const storedPng = "/uploads/custom-build/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png";

test("reference image copy exists in English and Vietnamese", () => {
  assert.equal(tFor("en", "customBuild.step6.fields.referenceImages"), "Reference guitar images");
  assert.equal(tFor("vi", "customBuild.step6.fields.referenceImages"), "Hình ảnh đàn tham khảo");
  assert.equal(
    tFor("vi", "customBuild.step6.fields.referenceImagesHint"),
    "Tải lên hình ảnh cây đàn hoặc thiết kế bạn mong muốn.",
  );
});

test("sanitizeReferenceImages keeps stored upload paths and drops blobs", () => {
  assert.deepEqual(
    sanitizeReferenceImages([
      storedPath,
      "blob:http://localhost/1",
      "https://example.com/photo.jpg",
      "/uploads/guitars/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg",
      storedPath,
      storedPng,
    ]),
    [storedPath, storedPng],
  );
  assert.deepEqual(sanitizeReferenceImages(null), []);
  assert.equal(sanitizeReferenceImages(Array.from({ length: 8 }, (_, index) => (
    `/uploads/custom-build/${index.toString().padStart(32, "c")}.jpg`
  ))).length, REFERENCE_IMAGE_MAX);
});

test("validateReferenceImageFile rejects type, size, and overflow", () => {
  assert.equal(validateReferenceImageFile({ type: "image/jpeg", size: 100 }).ok, true);
  assert.equal(validateReferenceImageFile({ type: "image/gif", size: 100 }).code, "INVALID_TYPE");
  assert.equal(validateReferenceImageFile({ type: "image/png", size: 6 * 1024 * 1024 }).code, "PAYLOAD_TOO_LARGE");
  assert.equal(remainingReferenceImageSlots(5), 0);
  assert.equal(remainingReferenceImageSlots(2), 3);
});

test("inquiry payload keeps stored paths and omits empty images", () => {
  const withImages = buildInquiryPayload({
    selections: {
      contactName: "Lan Pham",
      contactEmail: "lan@example.com",
      contactPhone: "",
      contactMessage: "",
      referenceImages: [storedPath, "blob:http://localhost/x"],
    },
    language: "vi",
    catalog: { categories: [] },
  });
  assert.deepEqual(withImages.referenceImages, [storedPath]);

  const withoutImages = buildInquiryPayload({
    selections: {
      contactName: "Lan Pham",
      contactEmail: "lan@example.com",
      contactPhone: "",
      contactMessage: "",
      referenceImages: [],
    },
    language: "vi",
    catalog: { categories: [] },
  });
  assert.equal(withoutImages.referenceImages, undefined);
});

test("admin display exposes stored reference images", () => {
  const display = buildInquiryDisplay(
    {
      configuration: { selections: {}, notes: "" },
      referenceImages: [storedPath, "blob:n"],
    },
    (key) => tFor("en", key),
  );
  assert.deepEqual(display.referenceImages, [storedPath]);
});
