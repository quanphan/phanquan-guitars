const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

export function buildLoginPayload(identifier, password) {
  const errors = {};
  const id = typeof identifier === "string" ? identifier.trim() : "";
  const pass = typeof password === "string" ? password : "";

  if (!id) errors.identifier = "required";
  if (!pass) errors.password = "required";

  if (id.includes("@")) {
    if (!EMAIL_PATTERN.test(id.toLowerCase())) errors.identifier = "invalidEmail";
  } else if (id && !USERNAME_PATTERN.test(id.toLowerCase())) {
    errors.identifier = "invalidUsername";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, body: null };
  }

  if (id.includes("@")) {
    return { ok: true, errors: {}, body: { email: id.toLowerCase(), password: pass } };
  }
  return { ok: true, errors: {}, body: { username: id.toLowerCase(), password: pass } };
}
