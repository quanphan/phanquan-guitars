import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { INFO_NAV_LINKS, PRIMARY_NAV_LINKS } from "../src/data/nav.js";
import { tFor } from "../src/i18n/translations.js";

const root = dirname(fileURLToPath(import.meta.url));
const navbar = readFileSync(join(root, "../src/components/Navbar.jsx"), "utf8");

test("mobile navbar uses a three-zone layout below md", () => {
  assert.match(navbar, /relative z-\[52\] md:hidden/);
  assert.match(navbar, /t\("nav\.navigation"\)/);
  assert.match(navbar, /flex w-full items-center justify-between bg-white\/10/);
  assert.match(navbar, /aria-controls="mobile-primary-menu"/);
  assert.match(navbar, /grid-flow-col auto-cols-fr divide-x/);
  assert.match(navbar, /hideWhenEmpty/);
  assert.match(navbar, /ContinueBuildLink utility/);
  assert.equal(navbar.includes("Search"), false);
  assert.equal(navbar.includes("from \"lucide-react\""), true);
  assert.equal(/MagnifyingGlass|Search/.test(navbar), false);
});

test("tablet and desktop chrome stay on their existing breakpoints", () => {
  assert.match(navbar, /hidden w-full min-w-0 max-w-7xl[\s\S]*md:flex/);
  assert.match(navbar, /hidden items-center gap-8 lg:flex/);
  assert.match(navbar, /flex shrink-0 items-center[\s\S]*lg:hidden/);
});

test("mobile menu still uses the current primary and info links", () => {
  assert.match(navbar, /PRIMARY_NAV_LINKS\.map/);
  assert.match(navbar, /INFO_NAV_LINKS\.map/);
  assert.deepEqual(
    PRIMARY_NAV_LINKS.map((link) => link.to),
    ["/guitars", "/in-stock", "/services", "/gallery"],
  );
  assert.deepEqual(
    INFO_NAV_LINKS.map((link) => link.to),
    ["/build-process", "/about", "/contact"],
  );
});

test("navigation label is MENU in English and Vietnamese", () => {
  assert.equal(tFor("en", "nav.navigation"), "MENU");
  assert.equal(tFor("vi", "nav.navigation"), "MENU");
});
