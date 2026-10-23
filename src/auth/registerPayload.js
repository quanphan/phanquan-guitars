const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function buildRegisterPayload({
  name,
  email,
  password,
  confirmPassword,
  marketingConsent = false,
}) {
  const errors = {};
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const pass = typeof password === "string" ? password : "";
  const confirm = typeof confirmPassword === "string" ? confirmPassword : "";
  const consent = marketingConsent === true;

  if (!trimmedName) errors.name = "required";
  else if (trimmedName.length > 100) errors.name = "tooLong";

  if (!trimmedEmail) errors.email = "required";
  else if (!EMAIL_PATTERN.test(trimmedEmail) || trimmedEmail.length > 254) {
    errors.email = "invalidEmail";
  }

  if (!pass) errors.password = "required";
  else if (pass.length < 8 || pass.length > 72) errors.password = "invalidPassword";

  if (pass !== confirm) errors.confirmPassword = "mismatch";

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, body: null };
  }

  return {
    ok: true,
    errors: {},
    body: {
      name: trimmedName,
      email: trimmedEmail,
      password: pass,
      marketingConsent: consent,
    },
  };
}

export function fieldErrorsFromPayload(payload) {
  const details = payload?.error?.details;
  const errors = {};
  if (!Array.isArray(details)) return errors;
  for (const item of details) {
    if (item?.field && !errors[item.field]) {
      errors[item.field] = item.code || "INVALID";
    }
  }
  return errors;
}
