import assert from "node:assert/strict";
import test from "node:test";
import { tFor } from "../src/i18n/translations.js";
import { emptySpecForm, RETIRED_SPEC_KEYS } from "../src/auth/productSpecs.js";
import {
  imageFileName,
  isHeicLike,
  PRODUCT_IMAGE_MAX,
  productImageFileKey,
  takeProductImageFiles,
  uniqueImagePaths,
  validateProductImageFile,
} from "../src/utils/productImageFiles.js";

function fakeFile(name, type, size = 10) {
  return { name, type, size, lastModified: 1 };
}

test("product image picker caps at five unique files", () => {
  assert.equal(PRODUCT_IMAGE_MAX, 5);
  const files = [
    fakeFile("a.jpg", "image/jpeg"),
    fakeFile("a.jpg", "image/jpeg"),
    fakeFile("b.png", "image/png"),
    fakeFile("c.webp", "image/webp"),
    fakeFile("d.jpg", "image/jpeg"),
    fakeFile("e.jpg", "image/jpeg"),
    fakeFile("f.jpg", "image/jpeg"),
  ];
  const first = takeProductImageFiles(files, 0);
  assert.equal(first.files.map((file) => file.name).join(), "a.jpg,b.png,c.webp,d.jpg,e.jpg");
  const extra = takeProductImageFiles([fakeFile("f.jpg", "image/jpeg")], 5);
  assert.deepEqual(extra.files, []);
  assert.equal(extra.overflow, true);
  const invalid = takeProductImageFiles([fakeFile("note.gif", "image/gif"), fakeFile("ok.jpg", "image/jpeg")], 0);
  assert.equal(invalid.files.map((file) => file.name).join(), "ok.jpg");
  assert.equal(invalid.invalidCode, "UNSUPPORTED_MEDIA_TYPE");
  assert.equal(uniqueImagePaths(["/a", "/a", "/b", "/c", "/d", "/e", "/f"]).join(), "/a,/b,/c,/d,/e");
  assert.equal(imageFileName("/uploads/guitars/front.jpg"), "front.jpg");
});

test("heic files are recognized beyond the extension", () => {
  assert.equal(isHeicLike(fakeFile("photo.HEIC", "")), true);
  assert.equal(isHeicLike(fakeFile("photo.jpg", "image/heif")), true);
  assert.equal(isHeicLike(fakeFile("photo.jpg", "image/jpeg")), false);
  assert.equal(validateProductImageFile(fakeFile("photo.gif", "image/gif")), "UNSUPPORTED_MEDIA_TYPE");
  assert.equal(validateProductImageFile(fakeFile("photo.jpg", "image/jpeg", 6 * 1024 * 1024)), "PAYLOAD_TOO_LARGE");
  assert.equal(productImageFileKey(fakeFile("a.jpg", "image/jpeg")), "a.jpg:10:1");
});

test("retired catalog spec labels stay translated but off the admin form", () => {
  assert.equal(emptySpecForm().bodyContour, undefined);
  assert.equal(emptySpecForm().neckConstruction, undefined);
  assert.equal(emptySpecForm().nut, undefined);
  assert.deepEqual(RETIRED_SPEC_KEYS, ["bodyContour", "neckConstruction", "nut"]);
  assert.equal(tFor("en", "admin.catalog.chooseImages"), "Choose images");
  assert.equal(tFor("vi", "admin.catalog.imagesFull"), "Sản phẩm đã đủ 5 ảnh.");
  assert.equal(tFor("en", "guitars.specLabels.bodyContour"), "Body contours");
});
