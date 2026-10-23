const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

export function buildCreateAdminPayload({
  name,
  email,
  password,
  confirmPassword,
  username,
  phone,
  permissions,
}) {
  const errors = {};
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const pass = typeof password === "string" ? password : "";
  const confirm = typeof confirmPassword === "string" ? confirmPassword : "";
  const user = typeof username === "string" ? username.trim().toLowerCase() : "";
  const tel = typeof phone === "string" ? phone.trim() : "";

  if (!trimmedName) errors.name = "required";
  else if (trimmedName.length > 100) errors.name = "tooLong";

  if (!trimmedEmail) errors.email = "required";
  else if (!EMAIL_PATTERN.test(trimmedEmail) || trimmedEmail.length > 254) {
    errors.email = "invalidEmail";
  }

  if (!pass) errors.password = "required";
  else if (pass.length < 8 || pass.length > 72) errors.password = "invalidPassword";

  if (pass !== confirm) errors.confirmPassword = "mismatch";

  if (user) {
    if (!USERNAME_PATTERN.test(user) || user === "phanquan") errors.username = "invalidUsername";
  }
  if (tel && tel.length > 30) errors.phone = "tooLong";

  if (Object.keys(errors).length) {
    return { ok: false, errors, body: null };
  }

  const body = {
    name: trimmedName,
    email: trimmedEmail,
    password: pass,
  };
  if (user) body.username = user;
  if (tel) body.phone = tel;
  if (Array.isArray(permissions)) body.permissions = permissions;

  return { ok: true, errors: {}, body };
}
