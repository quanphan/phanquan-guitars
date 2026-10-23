import assert from "node:assert/strict";
import test from "node:test";
import {
  filterGalleryPosts,
  orderedGalleryImages,
  selectIncomingGalleryFiles,
  validateGalleryMedia,
} from "../src/data/gallery.js";
import { tFor } from "../src/i18n/translations.js";

test("gallery filters hide other categories and keep published-looking lists intact", () => {
  const posts = [
    { id: "1", category: "process", title: "A" },
    { id: "2", category: "video", title: "B" },
  ];
  assert.equal(filterGalleryPosts(posts, "all").length, 2);
  assert.deepEqual(filterGalleryPosts(posts, "video").map((item) => item.id), ["2"]);
});

test("gallery copy exists in English and Vietnamese", () => {
  assert.equal(tFor("en", "gallery.filters.process"), "Build process");
  assert.equal(tFor("vi", "gallery.filters.process"), "Quá trình chế tác");
  assert.equal(tFor("vi", "gallery.filters.materials"), "Vật liệu & gỗ");
  assert.equal(tFor("en", "gallery.add"), "Add New");
  assert.equal(tFor("en", "gallery.errors.TOO_MANY_IMAGES"), "A gallery post can include at most 5 images.");
  assert.equal(tFor("vi", "gallery.errors.TOO_MANY_IMAGES"), "Mỗi bài gallery tối đa 5 ảnh.");
  assert.equal(tFor("en", "gallery.errors.TOO_MANY_VIDEOS"), "A gallery post can include only one video.");
  assert.equal(tFor("vi", "gallery.errors.TOO_MANY_VIDEOS"), "Mỗi bài gallery chỉ được một video.");
});

test("gallery media limits keep five images or one video", () => {
  const images = Array.from({ length: 5 }, (_, index) => ({ id: `i${index}`, kind: "image" }));
  assert.equal(validateGalleryMedia(images), null);
  assert.equal(validateGalleryMedia([...images, { id: "i5", kind: "image" }]), "TOO_MANY_IMAGES");
  assert.equal(validateGalleryMedia([{ id: "v", kind: "video" }]), null);
  assert.equal(
    validateGalleryMedia([
      { id: "v1", kind: "video" },
      { id: "v2", kind: "video" },
    ]),
    "TOO_MANY_VIDEOS",
  );
  assert.equal(validateGalleryMedia([{ id: "i", kind: "image" }, { id: "v", kind: "video" }]), "MIXED_MEDIA");

  const extra = selectIncomingGalleryFiles(images, [{ type: "image/png" }]);
  assert.equal(extra.files.length, 0);
  assert.equal(extra.code, "TOO_MANY_IMAGES");

  const secondVideo = selectIncomingGalleryFiles([{ id: "v", kind: "video" }], [{ type: "video/mp4" }]);
  assert.equal(secondVideo.files.length, 0);
  assert.equal(secondVideo.code, "TOO_MANY_VIDEOS");

  const ordered = orderedGalleryImages({
    coverMediaId: "b",
    media: [
      { id: "a", kind: "image" },
      { id: "b", kind: "image" },
      { id: "c", kind: "video" },
    ],
  });
  assert.deepEqual(
    ordered.map((item) => item.id),
    ["b", "a"],
  );
});
