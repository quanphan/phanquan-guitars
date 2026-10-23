import { useCallback, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { buildLoginPayload } from "../../auth/loginPayload.js";
import { isAdminRole, safeAdminRedirect } from "../../auth/adminAccess.js";
import Button from "../../components/Button.jsx";
import GoogleSignIn from "../../components/auth/GoogleSignIn.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const fieldClass =
  "mt-2 w-full border border-white/10 bg-ink px-4 py-3 text-sm text-ivory placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const errorFieldClass =
  "mt-2 w-full border border-gold bg-gold/10 px-4 py-3 text-sm text-ivory placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export default function AdminLogin() {
  const { t } = useLanguage();
  const { ready, isAdmin, session, login, loginWithGoogle } = useAuth();
  const [params] = useSearchParams();
  const [identifier, setIdentifier] = useState("");
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
      else if (!isAdminRole(result.session?.user?.role)) {
        setFormError("FORBIDDEN");
      }
    },
    [loginWithGoogle],
  );

  if (!ready) {
    return (
      <section className="pb-24">
        <PageHeader eyebrow={t("admin.eyebrow")} title={t("admin.loadingTitle")} />
      </section>
    );
  }

  if (isAdmin) {
    return <Navigate to={safeAdminRedirect(params.get("from"))} replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const next = buildLoginPayload(identifier, password);
    if (!next.ok) {
      setFieldErrors(next.errors);
      setFormError("invalid");
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    const result = await login(next.body);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.code);
      return;
    }
    if (!isAdminRole(result.session?.user?.role)) {
      setFormError("FORBIDDEN");
    }
  }

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.login.title")}
        description={t("admin.login.description")}
      />
      <div className="mx-auto mt-12 max-w-md px-6 lg:px-10">
        {session && !isAdmin ? (
          <p className="mb-6 border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory" role="alert">
            {t("admin.errors.FORBIDDEN")}
          </p>
        ) : null}
        <form className="space-y-6 border border-white/10 bg-panel/40 p-6" onSubmit={onSubmit} noValidate>
          {formError && formError !== "invalid" ? (
            <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory" role="alert">
              {t(`admin.errors.${formError}`) === `admin.errors.${formError}`
                ? t("admin.errors.failure")
                : t(`admin.errors.${formError}`)}
            </p>
          ) : null}
          {formError === "invalid" ? (
            <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory" role="alert">
              {t("admin.login.formIncomplete")}
            </p>
          ) : null}
          <div>
            <label htmlFor="admin-identifier" className="text-[11px] uppercase tracking-[0.18em] text-gold">
              {t("admin.login.identifier")}
            </label>
            <input
              id="admin-identifier"
              name="username"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.identifier)}
              className={fieldErrors.identifier ? errorFieldClass : fieldClass}
            />
            {fieldErrors.identifier ? (
              <p className="mt-2 text-xs text-gold">{t(`admin.login.errors.${fieldErrors.identifier}`)}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="admin-password" className="text-[11px] uppercase tracking-[0.18em] text-gold">
              {t("admin.login.password")}
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.password)}
              className={fieldErrors.password ? errorFieldClass : fieldClass}
            />
            {fieldErrors.password ? (
              <p className="mt-2 text-xs text-gold">{t("admin.login.errors.required")}</p>
            ) : null}
          </div>
          <Button type="submit" disabled={submitting} aria-busy={submitting} className="w-full">
            {submitting ? t("admin.login.submitting") : t("admin.login.submit")}
          </Button>
        </form>
        <GoogleSignIn
          onCredential={finishGoogle}
          disabled={submitting}
          labelKey="admin.login.orGoogle"
          silentIfUnconfigured
        />
      </div>
    </section>
  );
}
