import assert from "node:assert/strict";
import test from "node:test";
import { INFO_NAV_LINKS, PRIMARY_NAV_LINKS, isInfoNavPath } from "../src/data/nav.js";
import { tFor } from "../src/i18n/translations.js";

test("Info dropdown keeps the original three routes", () => {
  assert.deepEqual(
    INFO_NAV_LINKS.map((link) => link.to),
    ["/build-process", "/about", "/contact"],
  );
  assert.equal(
    PRIMARY_NAV_LINKS.some((link) => ["/build-process", "/about", "/contact"].includes(link.to)),
    false,
  );
});

test("Info labels exist in English and Vietnamese", () => {
  assert.equal(tFor("en", "nav.gallery"), "Journal");
  assert.equal(tFor("vi", "nav.gallery"), "Journal");
  assert.equal(PRIMARY_NAV_LINKS.find((link) => link.key === "nav.gallery")?.to, "/gallery");
  assert.equal(tFor("en", "nav.info"), "Info");
  assert.equal(tFor("vi", "nav.info"), "Thông tin");
  assert.equal(tFor("en", "nav.buildProcess"), "Build Process");
  assert.equal(tFor("vi", "nav.about"), "Giới thiệu");
  assert.equal(tFor("en", "nav.contact"), "Contact");
});

test("Info parent is active on nested info routes", () => {
  assert.equal(isInfoNavPath("/about"), true);
  assert.equal(isInfoNavPath("/build-process"), true);
  assert.equal(isInfoNavPath("/contact"), true);
  assert.equal(isInfoNavPath("/guitars"), false);
});
