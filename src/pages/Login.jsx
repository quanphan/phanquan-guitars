import { useCallback, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { errorText } from "../auth/errorText.js";
import { postLoginPath } from "../auth/redirects.js";
import Field from "../components/auth/Field.jsx";
import GoogleSignIn from "../components/auth/GoogleSignIn.jsx";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Login() {
  const { t } = useLanguage();
  const { ready, isAuthenticated, isAdmin, login, loginWithGoogle } = useAuth();
  const [params] = useSearchParams();
  const next = postLoginPath(params.get("from"), isAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const finishGoogle = useCallback(
    async (credential) => {
      setSubmitting(true);
      setFormError(null);
      const result = await loginWithGoogle(credential);
      setSubmitting(false);
      if (!result.ok) setFormError(result.code);
    },
    [loginWithGoogle],
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
    const errors = {};
    if (!email.trim()) errors.email = t("auth.errors.required");
    if (!password) errors.password = t("auth.errors.required");
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setFormError("invalid");
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    const result = await login({ email: email.trim().toLowerCase(), password });
    setSubmitting(false);
    if (!result.ok) setFormError(result.code);
  }

  return (
    <section className="pb-24">
      <PageHeader eyebrow={t("auth.eyebrow")} title={t("auth.login.title")} description={t("auth.login.description")} />
      <div className="mx-auto mt-12 max-w-md px-6 lg:px-10">
        <form className="space-y-6 border border-white/10 bg-panel/40 p-6" onSubmit={onSubmit} noValidate>
          {formError ? (
            <div className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory" role="alert">
              <p>{formError === "invalid" ? t("auth.formIncomplete") : errorText(t, "auth", formError)}</p>
              {formError === "NETWORK" ? (
                <button
                  type="button"
                  onClick={() => void onSubmit({ preventDefault() {} })}
                  className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold"
                >
                  {t("auth.retry")}
                </button>
              ) : null}
            </div>
          ) : null}
          <Field
            id="login-email"
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
            id="login-password"
            label={t("auth.fields.password")}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            disabled={submitting}
            required
            error={fieldErrors.password}
          />
          <Button type="submit" disabled={submitting} aria-busy={submitting} className="w-full">
            {submitting ? t("auth.login.submitting") : t("auth.login.submit")}
          </Button>
        </form>
        <GoogleSignIn onCredential={finishGoogle} disabled={submitting} />
        <p className="mt-8 text-center text-sm text-muted">
          {t("auth.login.noAccount")}{" "}
          <Link to="/register" className="text-gold hover:text-gold-light">
            {t("auth.register.submit")}
          </Link>
        </p>
      </div>
    </section>
  );
}
