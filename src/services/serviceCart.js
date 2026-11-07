import { formatStoredPrice } from "./formatPrice.js";

export const CART_ALLOWED_SLUGS = ["guitar-repair", "tools-equipment"];
export const CART_STORAGE_KEY = "pqg-service-cart";
export const CART_SNAPSHOT_KEY = "pqg-service-cart-items";
export const CART_CONFIRM_KEY = "pqg-service-quote";

export function isCartCategory(slug) {
  return CART_ALLOWED_SLUGS.includes(String(slug || ""));
}

export function isRepairCategory(slug) {
  return String(slug || "") === "guitar-repair";
}

export function emptyCart() {
  return {
    ownerType: "guest",
    sessionId: "",
    status: "open",
    itemCount: 0,
    quotationRequired: false,
    subtotal: null,
    items: [],
  };
}

export function shouldClearLocalCart(result) {
  if (!result || result.ok || result.network) return false;
  return result.code === "GUEST_EXPIRED";
}

export function isGuestSessionError(result) {
  return result?.code === "GUEST_EXPIRED" || result?.code === "GUEST_INVALID";
}

export function validateQuoteRequest(values) {
  const errors = {};
  const name = String(values.name ?? "").trim();
  const email = String(values.email ?? "").trim();
  const phone = String(values.phone ?? "").trim();
  const notes = String(values.notes ?? "");
  if (!name || name.length < 2) errors.name = "required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.email = "emailInvalid";
  if (!phone || phone.length < 7 || phone.length > 30 || !/^[0-9+().\-\s]+$/.test(phone)) {
    errors.phone = "phoneInvalid";
  }
  if (notes.length > 2000) errors.notes = "messageLong";
  return errors;
}

export function localizedTitle(item, language) {
  if (!item) return "";
  return language === "vi" ? item.titleVi || item.titleEn : item.titleEn || item.titleVi;
}

export function localizedCategory(item, language) {
  if (!item) return "";
  return language === "vi" ? item.categoryNameVi || item.categoryNameEn : item.categoryNameEn || item.categoryNameVi;
}

export function optionSummary(item, language) {
  return (item?.options || [])
    .map((option) => {
      const group = language === "vi" ? option.groupNameVi || option.groupNameEn : option.groupNameEn;
      const label = language === "vi" ? option.labelVi || option.labelEn : option.labelEn;
      return group && label ? `${group}: ${label}` : label;
    })
    .filter(Boolean);
}

export function buildCartSummary({ cart, language, t, customer = {} }) {
  const items = cart?.items || [];
  const lines = [`${t("cart.share.website")}: PhanQuan Guitars`];
  const name = String(customer.name || "").trim();
  if (name) lines.push(`${t("cart.fields.name")}: ${name}`);
  items.forEach((item, index) => {
    if (index === 0) lines.push("");
    const title = localizedTitle(item, language);
    const category = localizedCategory(item, language);
    lines.push(`${index + 1}. ${title}${category ? ` (${category})` : ""}`);
    optionSummary(item, language).forEach((option) => {
      lines.push(`   ${option}`);
    });
    if (item.quantity != null && item.quantity !== "") {
      lines.push(`   ${t("cart.quantity")}: ${item.quantity}`);
    }
    if (!item.priceOnRequest) {
      const price = formatStoredPrice(item.lineTotal ?? item.unitPrice, item.currency);
      if (price) lines.push(`   ${t("cart.share.price")}: ${price}`);
    }
  });
  if (!cart?.quotationRequired) {
    const total = formatStoredPrice(cart?.subtotal, items[0]?.currency);
    if (total) {
      lines.push("");
      lines.push(`${t("cart.summary")}: ${total}`);
    }
  }
  const notes = String(customer.notes || "").trim();
  if (notes) {
    lines.push("");
    lines.push(`${t("cart.fields.notes")}:`);
    lines.push(notes);
  }
  return lines.join("\n").trim();
}
