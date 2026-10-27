export const CONTACT_MESSAGE_MAX = 800;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^[+0-9()\s.-]{7,24}$/;

export function validateContact(selections) {
  const errors = {};
  const name = selections.contactName?.trim() ?? "";
  const email = selections.contactEmail?.trim() ?? "";
  const country = selections.contactCountry?.trim() ?? "";
  const phone = selections.contactPhone?.trim() ?? "";
  const message = selections.contactMessage ?? "";

  if (!name) errors.contactName = "required";
  else if (name.length < 2) errors.contactName = "nameShort";

  if (!email) errors.contactEmail = "required";
  else if (!EMAIL_PATTERN.test(email)) errors.contactEmail = "emailInvalid";

  if (!country) errors.contactCountry = "required";
  else if (country.length < 2) errors.contactCountry = "countryShort";

  if (!phone) errors.contactPhone = "phoneRequired";
  else if (!PHONE_PATTERN.test(phone)) errors.contactPhone = "phoneInvalid";

  if (message.length > CONTACT_MESSAGE_MAX) {
    errors.contactMessage = "messageLong";
  }

  if (!selections.acknowledgement) errors.acknowledgement = "required";

  return errors;
}
