import assert from "node:assert/strict";
import test from "node:test";
import { tFor } from "../src/i18n/translations.js";
import {
  buildContactChatSummary,
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

test("contact chat summary includes name, email, phone, inquiry type, and message", () => {
  const text = buildContactChatSummary({
    t: (key) => tFor("en", key),
    values: {
      name: "Lan Pham",
      email: "lan@example.com",
      phone: "0903083489",
      inquiryType: "custom-guitar",
      message: "I want an offset six-string.",
    },
  });
  assert.match(text, /Lan Pham/);
  assert.match(text, /lan@example.com/);
  assert.match(text, /0903083489/);
  assert.match(text, /Custom Guitar Inquiry/);
  assert.match(text, /I want an offset six-string/);
});

test("contact payload still omits phone so email submit is unchanged", () => {
  const payload = buildContactInquiryPayload({
    inquiryType: "technical",
    name: "Lan Pham",
    email: "lan@example.com",
    phone: "0903083489",
    message: "What scale is this?",
  });
  assert.equal(payload.phone, undefined);
  assert.equal(payload.inquiryType, "technical");
});

test("contact copy exists in English and Vietnamese", () => {
  assert.equal(tFor("en", "contact.title"), "Let's Talk About Your Guitar.");
  assert.equal(tFor("vi", "contact.title"), "Hãy nói về cây đàn của bạn.");
  assert.equal(tFor("en", "contact.types.custom-guitar.title"), "Custom Guitar Inquiry");
  assert.equal(tFor("vi", "contact.types.collaboration.title"), "Hợp tác & khác");
  assert.equal(tFor("en", "contact.closing"), "Every great instrument begins with a conversation.");
  assert.equal(tFor("vi", "contact.submit"), "Gửi enquiry");
  assert.equal(tFor("en", "contact.fields.phone"), "Phone number");
  assert.equal(tFor("en", "socialChat.facebook"), "Chat via Facebook");
  assert.equal(tFor("en", "socialChat.copied"), "Summary copied. Please paste it into the chat.");
  assert.equal(tFor("vi", "socialChat.contact"), "Chat với xưởng");
  assert.equal(tFor("en", "admin.tabs.messages"), "Messages");
  assert.equal(tFor("vi", "admin.tabs.messages"), "Tin nhắn");
});
