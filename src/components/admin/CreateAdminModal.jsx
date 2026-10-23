import { useState } from "react";
import { ADMIN_ASSIGNABLE } from "../../auth/permissions.js";
import { buildCreateAdminPayload } from "../../auth/createAdminPayload.js";
import { fieldErrorsFromPayload } from "../../auth/registerPayload.js";
import { errorText } from "../../auth/errorText.js";
import Field from "../auth/Field.jsx";
import Button from "../Button.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { createAdminUser } from "../../services/adminUserService.js";

export default function CreateAdminModal({ open, onClose, onCreated, request }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [permissions, setPermissions] = useState(() => [...ADMIN_ASSIGNABLE]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function togglePermission(permission) {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  }

  function resetAndClose() {
    if (submitting) return;
    onClose();
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const next = buildCreateAdminPayload({
      name,
      email,
      password,
      confirmPassword,
      username,
      phone,
      permissions,
    });
    if (!next.ok) {
      setFieldErrors(
        Object.fromEntries(
          Object.entries(next.errors).map(([key, code]) => [key, t(`auth.errors.${code}`)]),
        ),
      );
      setFormError("invalid");
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    const result = await createAdminUser(request, next.body);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.code);
      const mapped = fieldErrorsFromPayload({ error: { details: result.details } });
      if (Object.keys(mapped).length) {
        setFieldErrors(
          Object.fromEntries(Object.entries(mapped).map(([key, code]) => [key, t(`auth.errors.${code}`)])),
        );
      }
      return;
    }
    onCreated(result.user);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-charcoal/80 px-6 py-10"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) resetAndClose();
      }}
    >
      <form
        className="w-full max-w-lg space-y-5 border border-gold/40 bg-ink p-6"
        onSubmit={onSubmit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-admin-title"
      >
        <h2 id="create-admin-title" className="font-display text-2xl text-ivory">
          {t("admin.users.createTitle")}
        </h2>
        <p className="text-sm text-muted">{t("admin.users.createBody")}</p>
        {formError ? (
          <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm" role="alert">
            {formError === "invalid" ? t("auth.formIncomplete") : errorText(t, "admin", formError)}
          </p>
        ) : null}
        <Field id="admin-name" label={t("auth.fields.name")} value={name} onChange={setName} disabled={submitting} required error={fieldErrors.name} />
        <Field id="admin-email" label={t("auth.fields.email")} type="email" value={email} onChange={setEmail} disabled={submitting} required error={fieldErrors.email} />
        <Field id="admin-username" label={t("admin.users.usernameOptional")} value={username} onChange={setUsername} disabled={submitting} error={fieldErrors.username} />
        <Field id="admin-phone" label={t("auth.fields.phone")} value={phone} onChange={setPhone} disabled={submitting} error={fieldErrors.phone} />
        <Field id="admin-password" label={t("auth.fields.password")} type="password" value={password} onChange={setPassword} disabled={submitting} required error={fieldErrors.password} autoComplete="new-password" />
        <Field id="admin-confirm" label={t("auth.fields.confirmPassword")} type="password" value={confirmPassword} onChange={setConfirmPassword} disabled={submitting} required error={fieldErrors.confirmPassword} autoComplete="new-password" />
        <fieldset>
          <legend className="text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.users.assignablePermissions")}
          </legend>
          <p className="mt-2 text-xs text-muted">{t("admin.users.assignableHint")}</p>
          <div className="mt-3 space-y-2">
            {ADMIN_ASSIGNABLE.map((permission) => (
              <label key={permission} className="flex items-start gap-3 text-sm text-ivory">
                <input
                  type="checkbox"
                  checked={permissions.includes(permission)}
                  onChange={() => togglePermission(permission)}
                  disabled={submitting}
                  className="mt-1 size-4 accent-gold"
                />
                <span>
                  {t(`admin.permissions.${permission}`)}
                  <span className="mt-0.5 block text-xs text-muted">{permission}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button type="button" variant="outline" disabled={submitting} onClick={resetAndClose}>
            {t("admin.cancel")}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t("admin.users.creating") : t("admin.users.createSubmit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
