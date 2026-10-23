import assert from "node:assert/strict";
import test from "node:test";
import { tFor } from "../src/i18n/translations.js";
import {
  buildAdminBrandPayload,
  emptyPublicBrandSettings,
  hasPublicBrandContact,
  hoursForLanguage,
  isHttpUrl,
  normalizePublicBrandSettings,
  telHref,
  validateAdminBrandSettings,
  whatsappHref,
} from "../src/services/brandSettings.js";

test("public brand settings hide empty channels and disabled workshops stay out of the public payload", () => {
  const settings = normalizePublicBrandSettings({
    email: "studio@example.com",
    phone: "",
    facebook: "https://facebook.com/phanquanguitars",
    workshops: [
      { name: "Hanoi", address: "12 Example Street", mapsUrl: "", note: "" },
      { name: "", address: "" },
    ],
  });
  assert.equal(settings.email, "studio@example.com");
  assert.equal(settings.phone, null);
  assert.equal(settings.workshops.length, 1);
  assert.equal(hasPublicBrandContact(settings), true);
  assert.equal(hasPublicBrandContact(emptyPublicBrandSettings()), false);
});

test("contact href helpers produce semantic links", () => {
  assert.equal(telHref("+84 90 000 0000"), "tel:+84900000000");
  assert.equal(whatsappHref("+84 900 000 000"), "https://wa.me/84900000000");
  assert.equal(whatsappHref("https://wa.me/84900000000"), "https://wa.me/84900000000");
  assert.equal(isHttpUrl("javascript:alert(1)"), false);
  assert.equal(isHttpUrl("https://instagram.com/phanquanguitars"), true);
  assert.equal(hoursForLanguage({ en: "Tue–Sat", vi: "Thứ 3–7" }, "vi"), "Thứ 3–7");
});

test("admin payload validation rejects invalid URLs and emails", () => {
  const errors = validateAdminBrandSettings({
    contact: {
      email: "not-an-email",
      facebook: "not-a-url",
    },
    workshops: {
      workshop1: { mapsUrl: "ftp://maps.example" },
      workshop2: { mapsUrl: "" },
    },
  });
  assert.equal(errors["contact.email"], "invalid");
  assert.equal(errors["contact.facebook"], "invalid");
  assert.equal(errors["workshops.workshop1.mapsUrl"], "invalid");
  const payload = buildAdminBrandPayload({
    contact: { email: "studio@example.com" },
    workshops: { workshop1: { name: "Hanoi", enabled: true } },
    display: { email: true },
    hours: { en: "Tue–Sat" },
  });
  assert.equal(payload.contact.email, "studio@example.com");
  assert.equal(payload.workshops.workshop1.name, "Hanoi");
  assert.equal(payload.updatedBy, undefined);
});

test("brand settings copy exists in English and Vietnamese", () => {
  assert.equal(tFor("en", "admin.tabs.brandSettings"), "Brand Settings");
  assert.equal(tFor("vi", "admin.tabs.brandSettings"), "Thông tin thương hiệu");
  assert.equal(tFor("en", "admin.brandSettings.title"), "Brand Settings");
  assert.equal(tFor("vi", "admin.brandSettings.title"), "Thông tin thương hiệu");
});
