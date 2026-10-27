import assert from "node:assert/strict";
import test from "node:test";
import { tFor } from "../src/i18n/translations.js";
import { validateContact } from "../src/data/customBuildContact.js";
import { firstContactFieldId } from "../src/utils/customBuildSubmitFlow.js";
import { buildInquiryPayload } from "../src/services/customBuildPayload.js";

function completeContact(extra = {}) {
  return {
    contactName: "Lan Pham",
    contactEmail: "lan@example.com",
    contactCountry: "Vietnam",
    contactPhone: "+84 90 111 2222",
    contactMessage: "",
    acknowledgement: true,
    ...extra,
  };
}

test("missing phone number is required", () => {
  const errors = validateContact(completeContact({ contactPhone: undefined }));
  assert.equal(errors.contactPhone, "phoneRequired");
  assert.equal(tFor("en", "customBuild.step6.errors.phoneRequired"), "Phone number is required.");
  assert.equal(tFor("vi", "customBuild.step6.errors.phoneRequired"), "Vui lòng nhập số điện thoại.");
  assert.equal(firstContactFieldId(Object.keys(errors)), "contact-phone");
});

test("empty or whitespace-only phone numbers are required", () => {
  assert.equal(validateContact(completeContact({ contactPhone: "" })).contactPhone, "phoneRequired");
  assert.equal(validateContact(completeContact({ contactPhone: "   " })).contactPhone, "phoneRequired");
  assert.equal(validateContact(completeContact({ contactPhone: "\t\n" })).contactPhone, "phoneRequired");
});

test("a valid international phone number passes contact validation", () => {
  assert.equal(validateContact(completeContact()).contactPhone, undefined);
  assert.equal(validateContact(completeContact({ contactPhone: "+1 (415) 555-2671" })).contactPhone, undefined);
  assert.deepEqual(validateContact(completeContact()), {});
});

test("existing phone format validation is preserved", () => {
  assert.equal(validateContact(completeContact({ contactPhone: "abc" })).contactPhone, "phoneInvalid");
});

test("phone number is preserved across a draft-like round trip", () => {
  const selections = completeContact({ contactPhone: "+44 20 7946 0958" });
  const restored = JSON.parse(JSON.stringify(selections));
  assert.equal(restored.contactPhone, "+44 20 7946 0958");
  assert.equal(validateContact(restored).contactPhone, undefined);
});

test("inquiry payload trims and always sends the phone field", () => {
  const payload = buildInquiryPayload({
    selections: {
      ...completeContact({ contactPhone: "  +84 90 111 2222  " }),
      contactMessage: "",
    },
    language: "vi",
    catalog: { categories: [] },
  });
  assert.equal(payload.customer.phone, "+84 90 111 2222");

  const empty = buildInquiryPayload({
    selections: {
      ...completeContact({ contactPhone: "   " }),
      contactMessage: "",
    },
    language: "vi",
    catalog: { categories: [] },
  });
  assert.equal(empty.customer.phone, "");
});
