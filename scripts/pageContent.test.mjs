import assert from "node:assert/strict";
import test from "node:test";
import {
  addGalleryImage,
  copySharedSectionImages,
  defaultLocaleContent,
  duplicateSection,
  editorLocaleFromDocument,
  emptySection,
  isPageKey,
  localeFromRecord,
  MAX_GALLERY_IMAGES,
  moveGalleryImage,
  moveSection,
  PAGE_KEYS,
  publicPagePath,
  removeGalleryImage,
  CONTACT_HERO_SECTION_ID,
  SERVICES_EXPERTISE_SECTION_ID,
  setSectionImage,
  storedSectionImage,
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

test("admin editor hydrates from published when draft is empty and does not invent a blank page", () => {
  const publishedVi = {
    title: "Từ viết code đến làm guitar",
    sections: [
      { id: "about-hero", type: "hero", title: "Từ viết code đến làm guitar", layout: "center" },
      { id: "about-opening", type: "text-image", body: "Opening", image: "/uploads/pages/260db85ee5e5fb06f41e9e53eb3f8664.jpg" },
    ],
  };
  const document = {
    exists: true,
    draft: { en: { title: "", sections: [] }, vi: { title: "", sections: [] } },
    published: { en: { title: "", sections: [] }, vi: publishedVi },
  };
  const vi = editorLocaleFromDocument(document, "vi", "about");
  assert.equal(vi.source, "published");
  assert.equal(vi.locale.title, publishedVi.title);
  assert.equal(vi.locale.sections.map((section) => section.id).join(), "about-hero,about-opening");
  assert.equal(vi.locale.sections[1].image, publishedVi.sections[1].image);

  const en = editorLocaleFromDocument(document, "en", "about");
  assert.equal(en.source, "fallback");
  assert.equal(en.locale.sections.some((section) => section.type === "hero"), true);
  assert.equal(en.locale.title, defaultLocaleContent("about", "en").title);

  const draftFirst = editorLocaleFromDocument({
    exists: true,
    draft: { en: { title: "Draft EN", sections: [{ id: "about-hero", type: "hero", title: "Draft" }] }, vi: { title: "", sections: [] } },
    published: document.published,
  }, "en", "about");
  assert.equal(draftFirst.source, "draft");
  assert.equal(draftFirst.locale.title, "Draft EN");
});

test("inline editor and page manager share page keys and reorder helpers", () => {
  assert.deepEqual(PAGE_KEYS, ["about", "build-process", "services", "contact"]);
  assert.equal(isPageKey("about"), true);
  assert.equal(isPageKey("services"), true);
  assert.equal(isPageKey("contact"), true);
  assert.equal(isPageKey("home"), false);
  assert.equal(publicPagePath("build-process"), "/build-process");
  assert.equal(publicPagePath("services"), "/services");
  assert.equal(publicPagePath("contact"), "/contact");
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
  assert.equal(tFor("en", "admin.pageContent.publishedHint").includes("published"), true);
  assert.equal(tFor("vi", "admin.pageContent.loadFailed").includes("không bị xóa"), true);
  assert.equal(tFor("en", "admin.pageContent.addGalleryImage"), "Add gallery image");
  assert.equal(tFor("vi", "admin.pageContent.addGalleryImage"), "Thêm ảnh gallery");
  assert.equal(tFor("en", "admin.pageContent.editImage"), "Edit Image");
  assert.equal(tFor("vi", "admin.pageContent.editImage"), "Sửa ảnh");
  assert.equal(tFor("en", "admin.pageContent.pages.services"), "Services");
  assert.equal(tFor("vi", "admin.pageContent.pages.services"), "Dịch vụ");
  assert.equal(tFor("en", "admin.pageContent.pages.contact"), "Contact");
  assert.equal(tFor("vi", "admin.pageContent.pages.contact"), "Liên hệ");
  assert.equal(splitParagraphs("one\n\ntwo").join("|"), "one|two");
});

test("services expertise image slots stay independent and shared across languages", () => {
  const left = "/uploads/pages/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg";
  const right = "/uploads/pages/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg";
  const nextLeft = "/uploads/pages/cccccccccccccccccccccccccccccccc.jpg";
  const en = defaultLocaleContent("services", "en");
  assert.equal(en.sections[0].id, SERVICES_EXPERTISE_SECTION_ID);
  const withLeft = setSectionImage(en, SERVICES_EXPERTISE_SECTION_ID, "image", left);
  const withBoth = setSectionImage(withLeft, SERVICES_EXPERTISE_SECTION_ID, "imageSecondary", right);
  assert.equal(storedSectionImage(withBoth, SERVICES_EXPERTISE_SECTION_ID, "image", { src: "fallback" }).src, left);
  assert.equal(storedSectionImage(withBoth, SERVICES_EXPERTISE_SECTION_ID, "imageSecondary", { src: "fallback" }).src, right);
  const replacedLeft = setSectionImage(withBoth, SERVICES_EXPERTISE_SECTION_ID, "image", nextLeft);
  assert.equal(replacedLeft.sections[0].image, nextLeft);
  assert.equal(replacedLeft.sections[0].imageSecondary, right);
  const vi = copySharedSectionImages(replacedLeft, defaultLocaleContent("services", "vi"));
  assert.equal(vi.sections[0].image, nextLeft);
  assert.equal(vi.sections[0].imageSecondary, right);
  assert.equal(vi.title, defaultLocaleContent("services", "vi").title);
});

test("contact hero image uses a dedicated page-content slot shared across languages", () => {
  const path = "/uploads/pages/dddddddddddddddddddddddddddddddd.jpg";
  const en = defaultLocaleContent("contact", "en");
  assert.equal(en.sections[0].id, CONTACT_HERO_SECTION_ID);
  const withImage = setSectionImage(en, CONTACT_HERO_SECTION_ID, "image", path);
  assert.equal(storedSectionImage(withImage, CONTACT_HERO_SECTION_ID, "image", { src: "fallback" }).src, path);
  const vi = copySharedSectionImages(withImage, defaultLocaleContent("contact", "vi"));
  assert.equal(vi.sections[0].image, path);
  assert.equal(vi.title, defaultLocaleContent("contact", "vi").title);
});
