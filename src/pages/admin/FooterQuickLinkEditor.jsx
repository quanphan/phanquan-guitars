import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { errorText } from "../../auth/errorText.js";
import { fieldErrorsFromPayload } from "../../auth/registerPayload.js";
import Field, { fieldClass } from "../../components/auth/Field.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { isHttpUrl } from "../../services/brandSettings.js";
import { isInternalFooterPath } from "../../data/footerQuickLinks.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  createAdminFooterQuickLink,
  getAdminFooterQuickLink,
  updateAdminFooterQuickLink,
} from "../../services/footerQuickLinkService.js";

const emptyForm = {
  enTitle: "",
  viTitle: "",
  url: "",
  linkType: "internal",
  openInNewTab: false,
  isActive: true,
};

function isCopyQuery(value) {
  return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value.trim()) ? value.trim() : "";
}

function formFromItem(item) {
  return {
    enTitle: item.translations?.en?.title || item.title || "",
    viTitle: item.translations?.vi?.title || "",
    url: item.url || "",
    linkType: item.linkType === "external" ? "external" : "internal",
    openInNewTab: item.linkType === "external" && item.openInNewTab === true,
    isActive: item.isActive !== false,
  };
}

export default function FooterQuickLinkEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const isNew = !id || id === "new";
  const copyFrom = isNew ? isCopyQuery(params.get("copyFrom")) : "";
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { authorizedRequest, isAdmin } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew || Boolean(copyFrom));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const setField = useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  useEffect(() => {
    const sourceId = isNew ? copyFrom : id;
    if (!sourceId) return undefined;
    let cancelled = false;
    getAdminFooterQuickLink(authorizedRequest, sourceId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.code);
        setLoading(false);
        return;
      }
      setForm(formFromItem(result.item));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [authorizedRequest, copyFrom, id, isNew]);

  function validate() {
    const errors = {};
    if (!form.enTitle.trim() && !form.viTitle.trim()) errors.enTitle = "REQUIRED";
    if (form.linkType === "external") {
      if (!isHttpUrl(form.url)) errors.url = "INVALID";
    } else if (!isInternalFooterPath(form.url)) {
      errors.url = "INVALID";
    }
    return errors;
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!isAdmin || saving) return;
    const localErrors = validate();
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors);
      setError("VALIDATION");
      return;
    }
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const body = {
      url: form.url.trim(),
      linkType: form.linkType,
      openInNewTab: form.linkType === "external" ? form.openInNewTab : false,
      isActive: form.isActive,
      translations: {
        en: { title: form.enTitle },
        vi: { title: form.viTitle },
      },
    };
    const result = isNew
      ? await createAdminFooterQuickLink(authorizedRequest, body)
      : await updateAdminFooterQuickLink(authorizedRequest, id, body);
    setSaving(false);
    if (!result.ok) {
      setError(result.code);
      setFieldErrors(fieldErrorsFromPayload({ error: { details: result.details } }) || {});
      return;
    }
    navigate("/admin/settings/footer-links");
  }

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={copyFrom ? t("admin.footerLinks.copyItem") : isNew ? t("admin.footerLinks.add") : t("admin.footerLinks.edit")}
      >
        <Link to="/admin/settings/footer-links" className="mt-6 inline-block text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("admin.footerLinks.back")}
        </Link>
      </PageHeader>
      <form className="mx-auto mt-10 max-w-3xl space-y-8 px-6 lg:px-10" onSubmit={onSubmit}>
        {loading ? <p className="text-sm text-muted">{t("admin.footerLinks.loading")}</p> : null}
        {copyFrom && !loading ? <p className="text-sm text-ivory/80">{t("admin.footerLinks.copyHint")}</p> : null}
        {error ? <p className="text-sm text-gold" role="alert">{errorText(t, "admin.brandSettings", error)}</p> : null}
        <Field id="enTitle" label={t("admin.footerLinks.fields.enTitle")} value={form.enTitle} onChange={(value) => setField("enTitle", value)} error={fieldErrors.enTitle} disabled={!isAdmin} />
        <Field id="viTitle" label={t("admin.footerLinks.fields.viTitle")} value={form.viTitle} onChange={(value) => setField("viTitle", value)} error={fieldErrors.viTitle} disabled={!isAdmin} />
        <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
          {t("admin.footerLinks.fields.linkType")}
          <select
            className={`${fieldClass} mt-2`}
            value={form.linkType}
            disabled={!isAdmin}
            onChange={(event) => {
              const linkType = event.target.value;
              setForm((current) => ({
                ...current,
                linkType,
                openInNewTab: linkType === "external",
              }));
            }}
          >
            <option value="internal">{t("admin.footerLinks.linkTypes.internal")}</option>
            <option value="external">{t("admin.footerLinks.linkTypes.external")}</option>
          </select>
        </label>
        <Field id="url" label={t("admin.footerLinks.fields.url")} value={form.url} onChange={(value) => setField("url", value)} error={fieldErrors.url} disabled={!isAdmin} />
        {form.linkType === "external" ? (
          <label className="flex items-center gap-3 text-sm text-ivory">
            <input
              type="checkbox"
              checked={form.openInNewTab}
              onChange={(event) => setField("openInNewTab", event.target.checked)}
              disabled={!isAdmin}
            />
            {t("admin.footerLinks.fields.openInNewTab")}
          </label>
        ) : null}
        <label className="flex items-center gap-3 text-sm text-ivory">
          <input type="checkbox" checked={form.isActive} onChange={(event) => setField("isActive", event.target.checked)} disabled={!isAdmin} />
          {t("admin.footerLinks.visible")}
        </label>
        {isAdmin ? (
          <Button type="submit" disabled={saving || loading}>
            {saving ? t("admin.pageContent.saving") : t("admin.footerLinks.save")}
          </Button>
        ) : null}
      </form>
    </section>
  );
}
