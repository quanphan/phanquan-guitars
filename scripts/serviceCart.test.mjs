import assert from "node:assert/strict";
import test from "node:test";
import { tFor } from "../src/i18n/translations.js";
import { isServiceCartInquiry, serviceCartLines } from "../src/services/inquiryDisplay.js";
import { summarizeConfiguration } from "../src/services/inquiryQuery.js";
import {
  buildCartSummary,
  isCartCategory,
  isGuestSessionError,
  isRepairCategory,
  optionSummary,
  shouldClearLocalCart,
  validateQuoteRequest,
  CART_CONFIRM_KEY,
} from "../src/services/serviceCart.js";
import {
  readConfirmationReceipt,
  readStoredSession,
  writeConfirmation,
  writeStoredSession,
} from "../src/services/serviceCartApi.js";

test("cart is limited to guitar repair and tools", () => {
  assert.equal(isCartCategory("guitar-repair"), true);
  assert.equal(isCartCategory("tools-equipment"), true);
  assert.equal(isCartCategory("3d-design-cnc"), false);
  assert.equal(isRepairCategory("guitar-repair"), true);
  assert.equal(isRepairCategory("tools-equipment"), false);
});

test("quote request requires name, email, and phone", () => {
  const errors = validateQuoteRequest({
    name: " ",
    email: "not-an-email",
    phone: "abc",
    notes: "ok",
  });
  assert.equal(errors.name, "required");
  assert.equal(errors.email, "emailInvalid");
  assert.equal(errors.phone, "phoneInvalid");
});

test("quote request accepts a valid guest payload", () => {
  const errors = validateQuoteRequest({
    name: "Lan Pham",
    email: "lan@example.com",
    phone: "+84 90 000 0000",
    country: "Vietnam",
    notes: "Setup for a 25.5 scale.",
  });
  assert.deepEqual(errors, {});
});

test("service-cart inquiries are distinct from custom-build inquiries", () => {
  const inquiry = {
    configuration: {
      selections: {
        inquiryKind: "service-cart",
        sessionId: "sess-1",
        sources: ["guitar-repair", "tools-equipment"],
        country: "Vietnam",
        items: [
          {
            titleEn: "Setup",
            titleVi: "Setup",
            categoryNameEn: "Guitar Repair",
            categoryNameVi: "Guitar Repair",
            quantity: 1,
            options: [{ groupNameEn: "Scope", labelEn: "Full" }],
          },
        ],
      },
    },
  };
  assert.equal(isServiceCartInquiry(inquiry), true);
  assert.equal(isServiceCartInquiry({ configuration: { selections: {} } }), false);
  assert.equal(serviceCartLines(inquiry).length, 1);
  assert.match(summarizeConfiguration(inquiry.configuration), /Service cart/);
  assert.match(summarizeConfiguration(inquiry.configuration), /Setup/);
  assert.deepEqual(optionSummary(inquiry.configuration.selections.items[0], "en"), ["Scope: Full"]);
});

test("cart copy is bilingual", () => {
  assert.equal(tFor("en", "cart.add"), "Add to cart");
  assert.equal(tFor("vi", "cart.add"), "Thêm vào giỏ");
  assert.equal(tFor("en", "nav.cart"), "Cart");
  assert.equal(tFor("vi", "nav.cart"), "Giỏ hàng");
  assert.equal(tFor("en", "cart.priceOnRequest"), "Price on Request");
  assert.equal(tFor("en", "cart.quotationRequired"), "Quotation Required");
  assert.equal(tFor("en", "admin.detail.serviceCart"), "Service cart quotation");
  assert.equal(
    tFor("en", "cart.description"),
    "Review your selected repair services and tools before submitting your request.",
  );
  assert.equal(
    tFor("vi", "cart.description"),
    "Kiểm tra lại các dịch vụ sửa chữa và dụng cụ bạn đã chọn trước khi gửi yêu cầu.",
  );
  assert.match(tFor("en", "cart.repairPricing"), /Repair service prices are for reference only/);
  assert.match(tFor("vi", "cart.repairPricing"), /Giá hiển thị chỉ mang tính tham khảo/);
  assert.equal(tFor("en", "cart.chatFacebook"), "Chat via Facebook");
  assert.equal(tFor("en", "cart.chatZalo"), "Chat via Zalo");
  assert.equal(tFor("en", "socialChat.facebook"), "Chat via Facebook");
  assert.equal(tFor("en", "socialChat.zalo"), "Chat via Zalo");
  assert.equal(tFor("en", "cart.copied"), "Cart summary copied. Please paste it into the chat.");
  assert.match(tFor("en", "cart.copiedMessenger"), /If Messenger does not show the message/);
  assert.equal(tFor("vi", "admin.brandSettings.sections.socialContact"), "Liên hệ mạng xã hội");
});

test("cart summary includes items, options, quantity, price, name, and notes", () => {
  const text = buildCartSummary({
    language: "en",
    t: (key) => tFor("en", key),
    customer: { name: "Lan Pham", notes: "Need it this month." },
    cart: {
      quotationRequired: false,
      subtotal: 69.9,
      items: [
        {
          titleEn: "Setup",
          titleVi: "Setup",
          categoryNameEn: "Guitar Repair",
          quantity: 1,
          unitPrice: 60,
          lineTotal: 60,
          currency: "USD",
          options: [{ groupNameEn: "Scope", labelEn: "Full" }],
        },
        {
          titleEn: '12" Radius Blocks Sanding',
          categoryNameEn: "Tools & Equipment",
          quantity: 1,
          unitPrice: 9.9,
          lineTotal: 9.9,
          currency: "USD",
          options: [{ groupNameEn: "Radius option", labelEn: "16" }],
        },
      ],
    },
  });
  assert.match(text, /^Website: PhanQuan Guitars/m);
  assert.match(text, /Lan Pham/);
  assert.match(text, /Setup \(Guitar Repair\)/);
  assert.match(text, /Radius option: 16/);
  assert.match(text, /Quantity: 1/);
  assert.match(text, /Reference price: \$60/);
  assert.match(text, /Reference total: \$69\.90/);
  assert.match(text, /Need it this month/);
  const vi = buildCartSummary({
    language: "vi",
    t: (key) => tFor("vi", key),
    cart: {
      quotationRequired: true,
      items: [{ titleVi: "Sơn lại", titleEn: "Refinish", quantity: 2, priceOnRequest: true }],
    },
  });
  assert.match(vi, /Website: PhanQuan Guitars/);
  assert.doesNotMatch(vi, /Lan Pham/);
  assert.doesNotMatch(vi, /Giá tham khảo/);
  assert.doesNotMatch(vi, /Tổng tham khảo/);
  assert.match(vi, /Sơn lại/);
  assert.match(vi, /Số lượng: 2/);
});

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

test("guest session survives reload even if stored expiresAt is in the past", () => {
  const previous = global.window;
  global.window = { localStorage: memoryStorage() };
  writeStoredSession({
    sessionId: "sess-keep",
    token: "token-keep",
    expiresAt: new Date(Date.now() - 60_000).toISOString(),
  });
  const stored = readStoredSession();
  assert.equal(stored.sessionId, "sess-keep");
  assert.equal(stored.token, "token-keep");
  global.window = previous;
});

test("network failures do not clear the local cart", () => {
  assert.equal(shouldClearLocalCart({ ok: false, network: true, status: 0 }), false);
  assert.equal(shouldClearLocalCart({ ok: false, code: "UNAUTHORIZED", status: 401 }), false);
  assert.equal(shouldClearLocalCart({ ok: false, code: "GUEST_EXPIRED", status: 401 }), true);
  assert.equal(shouldClearLocalCart({ ok: false, network: false, status: 500 }), false);
  assert.equal(isGuestSessionError({ code: "GUEST_INVALID", status: 401 }), true);
  assert.equal(isGuestSessionError({ code: "UNAUTHORIZED", status: 401 }), false);
});

test("confirmation receipt is stored separately from inquiry details", () => {
  const previous = global.window;
  global.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage() };
  writeConfirmation({
    id: "inq_1",
    customer: { email: "lan@example.com" },
    confirmationToken: "receipt-secret",
  });
  assert.equal(readConfirmationReceipt("inq_1"), "receipt-secret");
  assert.equal(JSON.parse(global.window.sessionStorage.getItem(CART_CONFIRM_KEY) || "{}").confirmationToken, undefined);
  global.window = previous;
});

test("unavailable cart copy is bilingual", () => {
  assert.match(tFor("en", "cart.unavailableItems"), /no longer available/i);
  assert.match(tFor("vi", "cart.unavailableItems"), /không còn khả dụng/i);
  assert.match(tFor("en", "cart.indicativePrice"), /Indicative workshop price/i);
  assert.match(tFor("en", "cart.errors.PRICE_CHANGED"), /prices have changed/i);
  assert.match(tFor("vi", "cart.errors.GUEST_EXPIRED"), /hết hạn/i);
});
