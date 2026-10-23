import { useCallback, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { fieldErrorsFromPayload, buildRegisterPayload } from "../auth/registerPayload.js";
import { postLoginPath } from "../auth/redirects.js";
import Field from "../components/auth/Field.jsx";
import GoogleSignIn from "../components/auth/GoogleSignIn.jsx";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { errorText } from "../auth/errorText.js";

export default function Register() {
  const { t } = useLanguage();
  const { ready, isAuthenticated, isAdmin, register, loginWithGoogle, updateProfile } = useAuth();
  const [params] = useSearchParams();
  const next = postLoginPath(params.get("from"), isAdmin);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const finishGoogle = useCallback(
    async (credential) => {
      setSubmitting(true);
      setFormError(null);
      const result = await loginWithGoogle(credential);
      if (result.ok && marketingConsent) {
        await updateProfile({ marketingConsent: true });
      }
      setSubmitting(false);
      if (!result.ok) setFormError(result.code);
    },
    [loginWithGoogle, marketingConsent, updateProfile],
  );

  if (!ready) {
    return (
      <section className="pb-24">
        <PageHeader eyebrow={t("auth.eyebrow")} title={t("auth.loadingTitle")} />
      </section>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={next} replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const nextPayload = buildRegisterPayload({
      name,
      email,
      password,
      confirmPassword,
      marketingConsent,
    });
    if (!nextPayload.ok) {
      setFieldErrors(
        Object.fromEntries(
          Object.entries(nextPayload.errors).map(([key, code]) => [key, t(`auth.errors.${code}`)]),
        ),
      );
      setFormError("invalid");
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    const result = await register(nextPayload.body);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.code);
      const mapped = fieldErrorsFromPayload({ error: { details: result.details } });
      if (Object.keys(mapped).length) {
        setFieldErrors(
          Object.fromEntries(Object.entries(mapped).map(([key, code]) => [key, t(`auth.errors.${code}`)])),
        );
      }
    }
  }

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("auth.eyebrow")}
        title={t("auth.register.title")}
        description={t("auth.register.description")}
      />
      <div className="mx-auto mt-12 max-w-md px-6 lg:px-10">
        <form className="space-y-6 border border-white/10 bg-panel/40 p-6" onSubmit={onSubmit} noValidate>
          {formError ? (
            <div className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory" role="alert">
              <p>{formError === "invalid" ? t("auth.formIncomplete") : errorText(t, "auth", formError)}</p>
              {formError === "NETWORK" ? (
                <button type="submit" className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold">
                  {t("auth.retry")}
                </button>
              ) : null}
            </div>
          ) : null}
          <Field
            id="register-name"
            label={t("auth.fields.name")}
            autoComplete="name"
            value={name}
            onChange={setName}
            disabled={submitting}
            required
            error={fieldErrors.name}
          />
          <Field
            id="register-email"
            label={t("auth.fields.email")}
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            disabled={submitting}
            required
            error={fieldErrors.email}
          />
          <Field
            id="register-password"
            label={t("auth.fields.password")}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            disabled={submitting}
            required
            error={fieldErrors.password}
          />
          <Field
            id="register-confirm"
            label={t("auth.fields.confirmPassword")}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            disabled={submitting}
            required
            error={fieldErrors.confirmPassword}
          />
          <label className="flex items-start gap-3 text-sm leading-relaxed text-ivory">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(event) => setMarketingConsent(event.target.checked)}
              disabled={submitting}
              className="mt-1 size-4 shrink-0 accent-gold"
            />
            <span>{t("auth.fields.marketingConsent")}</span>
          </label>
          <Button type="submit" disabled={submitting} aria-busy={submitting} className="w-full">
            {submitting ? t("auth.register.submitting") : t("auth.register.submit")}
          </Button>
        </form>
        <GoogleSignIn onCredential={finishGoogle} disabled={submitting} />
        <p className="mt-8 text-center text-sm text-muted">
          {t("auth.register.hasAccount")}{" "}
          <Link to="/login" className="text-gold hover:text-gold-light">
            {t("auth.login.submit")}
          </Link>
        </p>
      </div>
    </section>
  );
}
