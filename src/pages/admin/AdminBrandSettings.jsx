import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { errorText } from "../../auth/errorText.js";
import { usePublicBrandSettings } from "../../brand/BrandSettingsContext.jsx";
import Field from "../../components/auth/Field.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  buildAdminBrandPayload,
  emptyAdminBrandSettings,
  emptyWorkshop,
  getAdminBrandSettings,
  saveAdminBrandSettings,
  validateAdminBrandSettings,
} from "../../services/brandSettings.js";

function Toggle({ id, label, checked, onChange, disabled, description }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-ivory">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-0.5 size-4 accent-gold"
      />
      <span>
        <span className="block">{label}</span>
        {description ? <span className="mt-1 block text-xs text-muted">{description}</span> : null}
      </span>
    </label>
  );
}

function setNested(source, path, value) {
  const next = structuredClone(source);
  const parts = path.split(".");
  let cursor = next;
  parts.slice(0, -1).forEach((part) => {
    cursor[part] = { ...cursor[part] };
    cursor = cursor[part];
  });
  cursor[parts[parts.length - 1]] = value;
  return next;
}

export default function AdminBrandSettings() {
  const { t } = useLanguage();
  const { authorizedRequest } = useAuth();
  const navigate = useNavigate();
  const { refresh } = usePublicBrandSettings();
  const [form, setForm] = useState(emptyAdminBrandSettings);
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(buildAdminBrandPayload(emptyAdminBrandSettings())));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const dirty = useMemo(() => JSON.stringify(buildAdminBrandPayload(form)) !== snapshot, [form, snapshot]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    const result = await getAdminBrandSettings(authorizedRequest);
    if (!result.ok) {
      setError(result.code);
      setLoading(false);
      if (result.code === "UNAUTHORIZED") {
        navigate("/admin/login?from=/admin/settings/brand", { replace: true });
      }
      return;
    }
    setForm(result.settings);
    setSnapshot(JSON.stringify(buildAdminBrandPayload(result.settings)));
    setFieldErrors({});
    setLoading(false);
  }, [authorizedRequest, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function update(path, value) {
    setForm((current) => setNested(current, path, value));
    setSuccess(false);
  }

  function fieldError(path) {
    const code = fieldErrors[path];
    if (!code) return null;
    return t(`admin.brandSettings.fieldErrors.${code}`) === `admin.brandSettings.fieldErrors.${code}`
      ? t("admin.brandSettings.fieldErrors.invalid")
      : t(`admin.brandSettings.fieldErrors.${code}`);
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (saving) return;
    const localErrors = validateAdminBrandSettings(form);
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors);
      setError("invalid");
      setSuccess(false);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    setFieldErrors({});
    const result = await saveAdminBrandSettings(authorizedRequest, buildAdminBrandPayload(form));
    setSaving(false);
    if (!result.ok) {
      setError(result.code === "VALIDATION_ERROR" ? "VALIDATION" : result.code);
      const nextErrors = {};
      (result.details || []).forEach((item) => {
        if (item?.field) nextErrors[item.field] = (item.code || "invalid").toLowerCase();
      });
      setFieldErrors(nextErrors);
      if (result.code === "UNAUTHORIZED") {
        navigate("/admin/login?from=/admin/settings/brand", { replace: true });
      }
      return;
    }
    setForm(result.settings);
    setSnapshot(JSON.stringify(buildAdminBrandPayload(result.settings)));
    setSuccess(true);
    void refresh();
  }

  const workshops = form.workshops || { workshop1: emptyWorkshop(), workshop2: emptyWorkshop() };

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.brandSettings.title")}
        description={t("admin.brandSettings.description")}
      />
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {loading ? (
          <p className="text-sm text-muted">{t("admin.brandSettings.loading")}</p>
        ) : (
          <form onSubmit={onSubmit} className="max-w-3xl space-y-12">
            {error ? (
              <p className="text-sm text-gold">{errorText(t, "admin.brandSettings", error)}</p>
            ) : null}
            {success ? <p className="text-sm text-ivory">{t("admin.brandSettings.saved")}</p> : null}
            {dirty ? <p className="text-sm text-gold/80">{t("admin.brandSettings.unsaved")}</p> : null}

            <fieldset className="space-y-6">
              <legend className="font-display text-xl tracking-wide text-ivory">
                {t("admin.brandSettings.sections.contact")}
              </legend>
              <p className="text-sm text-muted">{t("admin.brandSettings.sections.contactHelp")}</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="brand-email"
                  type="email"
                  label={t("admin.brandSettings.fields.email")}
                  value={form.contact.email}
                  onChange={(value) => update("contact.email", value)}
                  disabled={saving}
                  placeholder={t("admin.brandSettings.placeholders.email")}
                  error={fieldError("contact.email")}
                />
                <Field
                  id="brand-phone"
                  label={t("admin.brandSettings.fields.phone")}
                  value={form.contact.phone}
                  onChange={(value) => update("contact.phone", value)}
                  disabled={saving}
                  placeholder={t("admin.brandSettings.placeholders.phone")}
                  error={fieldError("contact.phone")}
                />
                <Field
                  id="brand-whatsapp"
                  label={t("admin.brandSettings.fields.whatsapp")}
                  value={form.contact.whatsapp}
                  onChange={(value) => update("contact.whatsapp", value)}
                  disabled={saving}
                  placeholder={t("admin.brandSettings.placeholders.whatsapp")}
                  error={fieldError("contact.whatsapp")}
                />
                <Field
                  id="brand-facebook"
                  label={t("admin.brandSettings.fields.facebook")}
                  value={form.contact.facebook}
                  onChange={(value) => update("contact.facebook", value)}
                  disabled={saving}
                  placeholder={t("admin.brandSettings.placeholders.url")}
                  error={fieldError("contact.facebook")}
                />
                <Field
                  id="brand-instagram"
                  label={t("admin.brandSettings.fields.instagram")}
                  value={form.contact.instagram}
                  onChange={(value) => update("contact.instagram", value)}
                  disabled={saving}
                  placeholder={t("admin.brandSettings.placeholders.url")}
                  error={fieldError("contact.instagram")}
                />
                <Field
                  id="brand-youtube"
                  label={t("admin.brandSettings.fields.youtube")}
                  value={form.contact.youtube}
                  onChange={(value) => update("contact.youtube", value)}
                  disabled={saving}
                  placeholder={t("admin.brandSettings.placeholders.url")}
                  error={fieldError("contact.youtube")}
                />
                <Field
                  id="brand-other"
                  label={t("admin.brandSettings.fields.other")}
                  value={form.contact.other}
                  onChange={(value) => update("contact.other", value)}
                  disabled={saving}
                  placeholder={t("admin.brandSettings.placeholders.url")}
                  error={fieldError("contact.other")}
                />
              </div>
            </fieldset>

            {["workshop1", "workshop2"].map((slot, index) => (
              <fieldset key={slot} className="space-y-6">
                <legend className="font-display text-xl tracking-wide text-ivory">
                  {t("admin.brandSettings.sections.workshop").replace("{n}", String(index + 1))}
                </legend>
                <p className="text-sm text-muted">{t("admin.brandSettings.sections.workshopHelp")}</p>
                <Toggle
                  id={`${slot}-enabled`}
                  label={t("admin.brandSettings.fields.showWorkshop")}
                  description={t("admin.brandSettings.fields.showWorkshopHelp")}
                  checked={workshops[slot].enabled}
                  onChange={(value) => update(`workshops.${slot}.enabled`, value)}
                  disabled={saving}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id={`${slot}-name`}
                    label={t("admin.brandSettings.fields.locationName")}
                    value={workshops[slot].name}
                    onChange={(value) => update(`workshops.${slot}.name`, value)}
                    disabled={saving}
                    placeholder={t("admin.brandSettings.placeholders.locationName")}
                    error={fieldError(`workshops.${slot}.name`)}
                  />
                  <Field
                    id={`${slot}-maps`}
                    label={t("admin.brandSettings.fields.mapsUrl")}
                    value={workshops[slot].mapsUrl}
                    onChange={(value) => update(`workshops.${slot}.mapsUrl`, value)}
                    disabled={saving}
                    placeholder={t("admin.brandSettings.placeholders.url")}
                    error={fieldError(`workshops.${slot}.mapsUrl`)}
                  />
                </div>
                <Field
                  id={`${slot}-address`}
                  label={t("admin.brandSettings.fields.address")}
                  value={workshops[slot].address}
                  onChange={(value) => update(`workshops.${slot}.address`, value)}
                  disabled={saving}
                  multiline
                  placeholder={t("admin.brandSettings.placeholders.address")}
                  error={fieldError(`workshops.${slot}.address`)}
                />
                <Field
                  id={`${slot}-note`}
                  label={t("admin.brandSettings.fields.note")}
                  value={workshops[slot].note}
                  onChange={(value) => update(`workshops.${slot}.note`, value)}
                  disabled={saving}
                  multiline
                  rows={2}
                  placeholder={t("admin.brandSettings.placeholders.note")}
                  error={fieldError(`workshops.${slot}.note`)}
                />
              </fieldset>
            ))}

            <fieldset className="space-y-6">
              <legend className="font-display text-xl tracking-wide text-ivory">
                {t("admin.brandSettings.sections.display")}
              </legend>
              <p className="text-sm text-muted">{t("admin.brandSettings.sections.displayHelp")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {["email", "phone", "whatsapp", "facebook", "instagram", "youtube", "other", "hours"].map((key) => (
                  <Toggle
                    key={key}
                    id={`display-${key}`}
                    label={t(`admin.brandSettings.display.${key}`)}
                    checked={form.display[key]}
                    onChange={(value) => update(`display.${key}`, value)}
                    disabled={saving}
                  />
                ))}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="hours-en"
                  label={t("admin.brandSettings.fields.hoursEn")}
                  value={form.hours.en}
                  onChange={(value) => update("hours.en", value)}
                  disabled={saving}
                  multiline
                  rows={2}
                  placeholder={t("admin.brandSettings.placeholders.hoursEn")}
                  error={fieldError("hours.en")}
                />
                <Field
                  id="hours-vi"
                  label={t("admin.brandSettings.fields.hoursVi")}
                  value={form.hours.vi}
                  onChange={(value) => update("hours.vi", value)}
                  disabled={saving}
                  multiline
                  rows={2}
                  placeholder={t("admin.brandSettings.placeholders.hoursVi")}
                  error={fieldError("hours.vi")}
                />
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? t("admin.brandSettings.saving") : t("admin.brandSettings.save")}
              </Button>
              <Button type="button" variant="outline" disabled={saving || loading} onClick={() => void load()}>
                {t("admin.brandSettings.reload")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
