export const CONTACT_NAME_MAX = 100;
export const CONTACT_MESSAGE_MAX = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INQUIRY_TYPE_VALUES = [
  "custom-guitar",
  "ready-stock",
  "technical",
  "collaboration",
];

export const SUBJECT_MAX = 200;
export const PRODUCT_REF_MAX = 160;
export const DRAFT_ID_MAX = 80;
const PRODUCT_ID_MAX = 80;

const TYPE_ALIASES = {
  "custom-guitar": "custom-guitar",
  custom: "custom-guitar",
  "custom-order": "custom-guitar",
  "ready-stock": "ready-stock",
  ready: "ready-stock",
  stock: "ready-stock",
  product: "ready-stock",
  technical: "technical",
  tech: "technical",
  collaboration: "collaboration",
  other: "collaboration",
};

export function parseInquiryType(value) {
  if (typeof value !== "string") return "";
  return TYPE_ALIASES[value.trim().toLowerCase()] || "";
}

export function clampField(value, max) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

export function contactPagePath({ type, product, productRef, draftId } = {}) {
  const params = new URLSearchParams();
  const inquiryType = parseInquiryType(type);
  if (inquiryType) params.set("type", inquiryType);
  const productId = clampField(product, PRODUCT_ID_MAX);
  if (productId) params.set("product", productId);
  const reference = clampField(productRef, PRODUCT_REF_MAX);
  if (reference) params.set("productRef", reference);
  const draft = clampField(draftId, DRAFT_ID_MAX);
  if (draft) params.set("draftId", draft);
  const query = params.toString();
  return query ? `/contact?${query}` : "/contact";
}

export function emptyContactValues() {
  return {
    inquiryType: "",
    name: "",
    email: "",
    subject: "",
    message: "",
    productId: "",
    productRef: "",
    draftId: "",
  };
}

export function validateContactInquiry(values) {
  const errors = {};
  const name = String(values.name ?? "").trim();
  const email = String(values.email ?? "").trim();
  const message = String(values.message ?? "").trim();
  const inquiryType = parseInquiryType(values.inquiryType);

  if (!inquiryType) errors.inquiryType = "typeRequired";

  if (!name) errors.name = "required";
  else if (name.length < 2) errors.name = "nameShort";
  else if (name.length > CONTACT_NAME_MAX) errors.name = "invalid";

  if (!email) errors.email = "required";
  else if (!EMAIL_PATTERN.test(email) || email.length > 254) errors.email = "emailInvalid";

  if (!message) errors.message = "required";
  else if (message.length > CONTACT_MESSAGE_MAX) errors.message = "messageLong";

  return errors;
}

export function buildContactInquiryPayload(values) {
  const inquiryType = parseInquiryType(values.inquiryType);
  const payload = {
    name: clampField(values.name, CONTACT_NAME_MAX),
    email: clampField(values.email, 254).toLowerCase(),
    message: clampField(values.message, CONTACT_MESSAGE_MAX),
    inquiryType,
  };
  const subject = clampField(values.subject, SUBJECT_MAX);
  const productId = clampField(values.productId, PRODUCT_ID_MAX);
  const productRef = clampField(values.productRef, PRODUCT_REF_MAX);
  const draftId =
    inquiryType === "custom-guitar" ? clampField(values.draftId, DRAFT_ID_MAX) : "";
  if (subject) payload.subject = subject;
  if (productId) payload.productId = productId;
  if (productRef) payload.productRef = productRef;
  if (draftId) payload.draftId = draftId;
  return payload;
}
