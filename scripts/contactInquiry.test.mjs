import assert from "node:assert/strict";
import test from "node:test";
import { tFor } from "../src/i18n/translations.js";
import {
  buildContactInquiryPayload,
  contactPagePath,
  parseInquiryType,
  validateContactInquiry,
} from "../src/services/contactInquiry.js";

test("inquiry type values stay language-independent", () => {
  assert.equal(parseInquiryType("Custom Guitar"), "");
  assert.equal(parseInquiryType("custom-guitar"), "custom-guitar");
  assert.equal(parseInquiryType("ready-stock"), "ready-stock");
  assert.equal(parseInquiryType("product"), "ready-stock");
  assert.equal(parseInquiryType("other"), "collaboration");
});

test("contact page path preserves product and draft query params", () => {
  assert.equal(contactPagePath(), "/contact");
  assert.equal(
    contactPagePath({ type: "ready-stock", product: "prod_1", productRef: "PQ Offset" }),
    "/contact?type=ready-stock&product=prod_1&productRef=PQ+Offset",
  );
  assert.equal(
    contactPagePath({ type: "custom-guitar", draftId: "draft-abc" }),
    "/contact?type=custom-guitar&draftId=draft-abc",
  );
});

test("validation requires name, email, type, and message", () => {
  const errors = validateContactInquiry({
    inquiryType: "",
    name: " ",
    email: "not-an-email",
    message: "",
  });
  assert.equal(errors.inquiryType, "typeRequired");
  assert.equal(errors.name, "required");
  assert.equal(errors.email, "emailInvalid");
  assert.equal(errors.message, "required");
  assert.equal(errors.country, undefined);
});

test("payload matches POST /api/contact and omits empty optional fields", () => {
  const payload = buildContactInquiryPayload({
    inquiryType: "ready-stock",
    name: "  Lan Pham  ",
    email: "Lan@Example.com",
    subject: "In-stock bass",
    message: "Is this still available?",
    productId: "prod_88",
    productRef: "PQ Headless Bass",
    draftId: "should-not-store",
  });
  assert.deepEqual(payload, {
    name: "Lan Pham",
    email: "lan@example.com",
    message: "Is this still available?",
    inquiryType: "ready-stock",
    subject: "In-stock bass",
    productId: "prod_88",
    productRef: "PQ Headless Bass",
  });
});

test("custom-guitar payload keeps an existing draft reference without inventing one", () => {
  const withDraft = buildContactInquiryPayload({
    inquiryType: "custom-guitar",
    name: "Alex",
    email: "alex@example.com",
    message: "Let's discuss a T-style.",
    draftId: "draft-existing",
  });
  assert.equal(withDraft.draftId, "draft-existing");

  const withoutDraft = buildContactInquiryPayload({
    inquiryType: "custom-guitar",
    name: "Alex",
    email: "alex@example.com",
    message: "Let's discuss a T-style.",
    draftId: "",
  });
  assert.equal(withoutDraft.draftId, undefined);
});

test("contact copy exists in English and Vietnamese", () => {
  assert.equal(tFor("en", "contact.title"), "Let's Talk About Your Guitar.");
  assert.equal(tFor("vi", "contact.title"), "Hãy nói về cây đàn của bạn.");
  assert.equal(tFor("en", "contact.types.custom-guitar.title"), "Custom Guitar Inquiry");
  assert.equal(tFor("vi", "contact.types.collaboration.title"), "Hợp tác & khác");
  assert.equal(tFor("en", "contact.closing"), "Every great instrument begins with a conversation.");
  assert.equal(tFor("vi", "contact.submit"), "Gửi enquiry");
  assert.equal(tFor("en", "admin.tabs.messages"), "Messages");
  assert.equal(tFor("vi", "admin.tabs.messages"), "Tin nhắn");
});
