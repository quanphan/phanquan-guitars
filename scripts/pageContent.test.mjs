import assert from "node:assert/strict";
import test from "node:test";
import {
  addGalleryImage,
  defaultLocaleContent,
  duplicateSection,
  emptySection,
  isPageKey,
  localeFromRecord,
  MAX_GALLERY_IMAGES,
  moveGalleryImage,
  moveSection,
  PAGE_KEYS,
  publicPagePath,
  removeGalleryImage,
  splitParagraphs,
  updateGalleryImage,
  visibleSections,
} from "../src/data/pageContent.js";
import { tFor } from "../src/i18n/translations.js";

test("default about and build-process copy exists in English and Vietnamese", () => {
  const aboutEn = defaultLocaleContent("about", "en");
  const aboutVi = defaultLocaleContent("about", "vi");
  const processEn = defaultLocaleContent("build-process", "en");
  const processVi = defaultLocaleContent("build-process", "vi");
  assert.equal(aboutEn.sections.some((section) => section.type === "hero"), true);
  assert.equal(aboutVi.sections[0].title, tFor("vi", "about.title"));
  assert.notEqual(aboutEn.sections[0].title, aboutVi.sections[0].title);
  assert.equal(processEn.sections.filter((section) => section.type === "process-step").length, 6);
  assert.equal(processVi.sections.filter((section) => section.type === "process-step").length, 6);
  assert.equal(aboutEn.sections.find((section) => section.id === "about-cta").ctaUrl, "/custom-build");
});

test("public visitors keep fallback copy when the API has no published document", () => {
  const fallback = localeFromRecord(null, "en", "about");
  assert.equal(fallback.sections.length > 0, true);
  assert.equal(visibleSections({ sections: [{ id: "a", visible: false }, { id: "b", visible: true }] }).map((item) => item.id).join(), "b");
});

test("inline editor and page manager share page keys and reorder helpers", () => {
  assert.deepEqual(PAGE_KEYS, ["about", "build-process"]);
  assert.equal(isPageKey("about"), true);
  assert.equal(isPageKey("home"), false);
  assert.equal(publicPagePath("build-process"), "/build-process");
  const moved = moveSection([{ id: "a" }, { id: "b" }, { id: "c" }], 1, -1);
  assert.equal(moved.map((item) => item.id).join(), "b,a,c");
  const copied = duplicateSection([{ id: "a" }], 0);
  assert.equal(copied.length, 2);
  assert.equal(copied[0].id === copied[1].id, false);
});

test("gallery helpers add, reorder, and remove images without dropping the path store", () => {
  let section = emptySection("gallery");
  section = addGalleryImage(section, { path: "/uploads/pages/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg", alt: "One" });
  section = addGalleryImage(section, { path: "/uploads/pages/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg", alt: "Two" });
  assert.equal(section.images.length, 2);
  section = moveGalleryImage(section, 1, -1);
  assert.equal(section.images[0].alt, "Two");
  section = updateGalleryImage(section, 0, { alt: "Moved" });
  assert.equal(section.images[0].alt, "Moved");
  const removed = removeGalleryImage(section, 0);
  assert.equal(removed.images.length, 1);
  assert.equal(removed.images[0].path.includes("bbbbbbbb"), false);
  assert.equal(section.images[0].path.includes("/uploads/pages/"), true);
  let full = emptySection("gallery");
  for (let index = 0; index < MAX_GALLERY_IMAGES + 2; index += 1) {
    full = addGalleryImage(full, { path: `/uploads/pages/${"c".repeat(32)}.jpg` });
  }
  assert.equal(full.images.length, MAX_GALLERY_IMAGES);
});

test("page content copy exists in English and Vietnamese", () => {
  assert.equal(tFor("en", "admin.tabs.pageContent"), "Page Content");
  assert.equal(tFor("vi", "admin.tabs.pageContent"), "Nội dung trang");
  assert.equal(tFor("en", "admin.pageContent.previewBanner").includes("unpublished"), true);
  assert.equal(tFor("en", "admin.pageContent.addGalleryImage"), "Add gallery image");
  assert.equal(tFor("vi", "admin.pageContent.addGalleryImage"), "Thêm ảnh gallery");
  assert.equal(splitParagraphs("one\n\ntwo").join("|"), "one|two");
});
