import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { fieldErrorsFromPayload } from "../auth/registerPayload.js";
import { errorText } from "../auth/errorText.js";
import Field from "../components/auth/Field.jsx";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Account() {
  const { t } = useLanguage();
  const { session, logout, updateProfile, updatePassword, isAdmin } = useAuth();
  const user = session?.user ?? {};
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [country, setCountry] = useState(user.country || "");
  const [address, setAddress] = useState({
    line1: user.shippingAddress?.line1 || "",
    line2: user.shippingAddress?.line2 || "",
    city: user.shippingAddress?.city || "",
    region: user.shippingAddress?.region || "",
    postalCode: user.shippingAddress?.postalCode || "",
    country: user.shippingAddress?.country || "",
  });
  const [marketingConsent, setMarketingConsent] = useState(user.marketingConsent === true);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileOk, setProfileOk] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [passwordOk, setPasswordOk] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setProfileError(null);
    setProfileOk(false);
    setFieldErrors({});
    const result = await updateProfile({
      name: name.trim(),
      phone: phone.trim() || null,
      country: country.trim() || null,
      shippingAddress: {
        line1: address.line1.trim() || null,
        line2: address.line2.trim() || null,
        city: address.city.trim() || null,
        region: address.region.trim() || null,
        postalCode: address.postalCode.trim() || null,
        country: address.country.trim() || null,
      },
      marketingConsent,
    });
    setSaving(false);
    if (!result.ok) {
      setProfileError(result.code);
      setFieldErrors(fieldErrorsFromPayload({ error: { details: result.details } }));
      return;
    }
    setProfileOk(true);
  }

  async function savePassword(event) {
    event.preventDefault();
    if (passwordSaving) return;
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordOk(false);
    const result = await updatePassword({ currentPassword, newPassword });
    setPasswordSaving(false);
    if (!result.ok) {
      setPasswordError(result.code);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setPasswordOk(true);
  }

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("auth.eyebrow")}
        title={t("account.title")}
        description={t("account.description")}
      />
      <div className="mx-auto mt-12 max-w-2xl space-y-10 px-6 lg:px-10">
        <p className="text-sm text-muted">
          {user.email} · {t(`account.roles.${user.role || "customer"}`)}
          {isAdmin ? ` · ${t("nav.admin")}` : ""}
        </p>

        <form className="space-y-5 border border-white/10 bg-panel/40 p-6" onSubmit={saveProfile} noValidate>
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("account.profile")}</h2>
          {profileError ? (
            <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm" role="alert">
              {errorText(t, "auth", profileError)}
            </p>
          ) : null}
          {profileOk ? (
            <p className="border border-gold/40 px-4 py-3 text-sm text-ivory" role="status">
              {t("account.saved")}
            </p>
          ) : null}
          <Field id="account-name" label={t("auth.fields.name")} value={name} onChange={setName} disabled={saving} required error={fieldErrors.name ? t("auth.errors.INVALID") : null} />
          <Field id="account-phone" label={t("auth.fields.phone")} value={phone} onChange={setPhone} disabled={saving} autoComplete="tel" error={fieldErrors.phone ? t("auth.errors.INVALID") : null} />
          <Field id="account-country" label={t("auth.fields.country")} value={country} onChange={setCountry} disabled={saving} autoComplete="country-name" />
          <h3 className="pt-2 text-[11px] uppercase tracking-[0.18em] text-gold">{t("account.shipping")}</h3>
          <p className="text-xs leading-relaxed text-muted">{t("account.shippingHint")}</p>
          {["line1", "line2", "city", "region", "postalCode", "country"].map((key) => (
            <Field
              key={key}
              id={`account-${key}`}
              label={t(`account.address.${key}`)}
              value={address[key]}
              onChange={(value) => setAddress((current) => ({ ...current, [key]: value }))}
              disabled={saving}
            />
          ))}
          <label className="flex items-start gap-3 text-sm leading-relaxed text-ivory">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(event) => setMarketingConsent(event.target.checked)}
              disabled={saving}
              className="mt-1 size-4 shrink-0 accent-gold"
            />
            <span>{t("auth.fields.marketingConsent")}</span>
          </label>
          <Button type="submit" disabled={saving}>
            {saving ? t("account.saving") : t("account.saveProfile")}
          </Button>
        </form>

        <form className="space-y-5 border border-white/10 bg-panel/40 p-6" onSubmit={savePassword} noValidate>
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("account.password")}</h2>
          {passwordError ? (
            <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm" role="alert">
              {errorText(t, "auth", passwordError)}
            </p>
          ) : null}
          {passwordOk ? (
            <p className="border border-gold/40 px-4 py-3 text-sm text-ivory" role="status">
              {t("account.passwordSaved")}
            </p>
          ) : null}
          <Field
            id="current-password"
            label={t("account.currentPassword")}
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            disabled={passwordSaving}
            autoComplete="current-password"
            required
          />
          <Field
            id="new-password"
            label={t("account.newPassword")}
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            disabled={passwordSaving}
            autoComplete="new-password"
            required
          />
          <Button type="submit" disabled={passwordSaving}>
            {passwordSaving ? t("account.saving") : t("account.savePassword")}
          </Button>
        </form>

        <Button type="button" variant="outline" onClick={() => void logout()}>
          {t("nav.logout")}
        </Button>
      </div>
    </section>
  );
}
