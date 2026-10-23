export const CONTACT_FIELD_IDS = {
  contactName: "contact-name",
  contactEmail: "contact-email",
  contactCountry: "contact-country",
  contactPhone: "contact-phone",
  contactMessage: "contact-message",
  acknowledgement: "contact-acknowledgement",
};

export const CONTACT_FOCUS_ORDER = [
  "contactName",
  "contactEmail",
  "contactCountry",
  "contactPhone",
  "contactMessage",
  "acknowledgement",
];

export function nextSubmitAction({
  locked,
  status,
  incompleteStep,
  contactErrorKeys,
  configured,
}) {
  if (status === "submitting") {
    return { action: "ignore-duplicate" };
  }
  if (locked) {
    if (status === "success") return { action: "ignore-success" };
    return { action: "stale-lock" };
  }
  if (status === "success") {
    return { action: "ignore-success" };
  }
  if (incompleteStep) {
    return { action: "invalid-config", incompleteStep };
  }
  if (Array.isArray(contactErrorKeys) && contactErrorKeys.length > 0) {
    return { action: "invalid", contactErrorKeys };
  }
  if (!configured) {
    return { action: "unavailable" };
  }
  return { action: "submit" };
}

export function firstContactFieldId(contactErrorKeys) {
  const keys = Array.isArray(contactErrorKeys) ? contactErrorKeys : [];
  const field = CONTACT_FOCUS_ORDER.find((key) => keys.includes(key));
  return field ? CONTACT_FIELD_IDS[field] : null;
}
