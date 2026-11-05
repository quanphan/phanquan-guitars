import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { errorText } from "../../auth/errorText.js";
import { fieldErrorsFromPayload } from "../../auth/registerPayload.js";
import HtmlEditor from "../../components/admin/HtmlEditor.jsx";
import ImageUploadField from "../../components/admin/ImageUploadField.jsx";
import ServiceOptionGroupsEditor from "../../components/admin/ServiceOptionGroupsEditor.jsx";
import Field, { fieldClass } from "../../components/auth/Field.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { optionGroupsFromItem, optionGroupsToPayload, serviceLocale } from "../../data/services.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { uploadAdminImage } from "../../services/adminCatalogService.js";
import {
  createAdminServiceItem,
  getAdminServiceItem,
  listAdminServiceCategories,
  updateAdminServiceItem,
} from "../../services/serviceCatalog.js";

const emptyForm = {
  categoryId: "",
  enTitle: "",
  viTitle: "",
  enHtml: "",
  viHtml: "",
  imagePath: "",
  price: "",
  currency: "USD",
  isActive: true,
  optionGroups: [],
  variantPrices: [],
};

function isCopyQuery(value) {
  return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value.trim()) ? value.trim() : "";
}

function formFromItem(item, { remapIds = false } = {}) {
  const options = optionGroupsFromItem(item, { remapIds });
  return {
    categoryId: item.categoryId || "",
    enTitle: item.translations?.en?.title || item.title || "",
    viTitle: item.translations?.vi?.title || "",
    enHtml: item.translations?.en?.html || "",
    viHtml: item.translations?.vi?.html || "",
    imagePath: item.imagePath || "",
    price: item.price == null ? "" : String(item.price),
    currency: item.currency || "USD",
    isActive: item.isActive !== false,
    optionGroups: options.optionGroups,
    variantPrices: options.variantPrices,
  };
}

export default function ServiceItemEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const isNew = !id || id === "new";
  const copyFrom = isNew ? isCopyQuery(params.get("copyFrom")) : "";
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { authorizedRequest, authorizedFormRequest, hasPermission } = useAuth();
  const canWrite = hasPermission("catalog.write");
  const [form, setForm] = useState({ ...emptyForm, categoryId: params.get("categoryId") || "" });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!isNew || Boolean(copyFrom));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const setField = useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    listAdminServiceCategories(authorizedRequest).then((result) => {
      if (cancelled || !result.ok) return;
      setCategories(result.items.filter((item) => item.linkMode !== "contact"));
    });
    return () => {
      cancelled = true;
    };
  }, [authorizedRequest]);

  useEffect(() => {
    const sourceId = isNew ? copyFrom : id;
    if (!sourceId) return undefined;
    let cancelled = false;
    getAdminServiceItem(authorizedRequest, sourceId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.code);
        setLoading(false);
        return;
      }
      setForm(formFromItem(result.item, { remapIds: Boolean(copyFrom) }));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [authorizedRequest, copyFrom, id, isNew]);

  async function onSubmit(event) {
    event.preventDefault();
    if (!canWrite || saving) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const options = optionGroupsToPayload(form.optionGroups, form.variantPrices);
    const body = {
      categoryId: form.categoryId,
      imagePath: form.imagePath || null,
      price: form.price === "" ? null : Number(form.price),
      currency: form.currency || null,
      isActive: form.isActive,
      translations: {
        en: { title: form.enTitle, html: form.enHtml },
        vi: { title: form.viTitle, html: form.viHtml },
      },
      ...options,
    };
    const result = isNew
      ? await createAdminServiceItem(authorizedRequest, body)
      : await updateAdminServiceItem(authorizedRequest, id, body);
    setSaving(false);
    if (!result.ok) {
      setError(result.code);
      setFieldErrors(fieldErrorsFromPayload({ error: { details: result.details } }) || {});
      return;
    }
    navigate("/admin/services");
  }

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={copyFrom ? t("admin.services.copyItem") : isNew ? t("admin.services.addItem") : t("admin.services.editItem")}
      >
        <Link to="/admin/services" className="mt-6 inline-block text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("admin.services.back")}
        </Link>
      </PageHeader>
      <form className="mx-auto mt-10 max-w-3xl space-y-8 px-6 lg:px-10" onSubmit={onSubmit}>
        {loading ? <p className="text-sm text-muted">{t("admin.services.loading")}</p> : null}
        {copyFrom && !loading ? <p className="text-sm text-ivory/80">{t("admin.services.copyHint")}</p> : null}
        {error ? <p className="text-sm text-gold" role="alert">{errorText(t, "admin.catalog", error)}</p> : null}
        <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
          {t("admin.services.fields.category")}
          <select className={`${fieldClass} mt-2`} value={form.categoryId} onChange={(event) => setField("categoryId", event.target.value)} disabled={!canWrite} required>
            <option value="">{t("admin.services.chooseCategory")}</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {serviceLocale(item, language).name || item.name}
              </option>
            ))}
          </select>
        </label>
        <Field id="enTitle" label={t("admin.services.fields.enTitle")} value={form.enTitle} onChange={(value) => setField("enTitle", value)} error={fieldErrors.enTitle} disabled={!canWrite} />
        <Field id="viTitle" label={t("admin.services.fields.viTitle")} value={form.viTitle} onChange={(value) => setField("viTitle", value)} error={fieldErrors.viTitle} disabled={!canWrite} />
        <HtmlEditor id="enHtml" label={t("admin.services.fields.enHtml")} value={form.enHtml} onChange={(value) => setField("enHtml", value)} disabled={!canWrite} hint={t("admin.services.htmlHint")} />
        <HtmlEditor id="viHtml" label={t("admin.services.fields.viHtml")} value={form.viHtml} onChange={(value) => setField("viHtml", value)} disabled={!canWrite} />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="price" label={t("admin.services.fields.price")} value={form.price} onChange={(value) => setField("price", value)} error={fieldErrors.price} disabled={!canWrite} />
          <Field id="currency" label={t("admin.services.fields.currency")} value={form.currency} onChange={(value) => setField("currency", value)} error={fieldErrors.currency} disabled={!canWrite} />
        </div>
        <label className="flex items-center gap-3 text-sm text-ivory">
          <input type="checkbox" checked={form.isActive} onChange={(event) => setField("isActive", event.target.checked)} disabled={!canWrite} />
          {t("admin.services.visible")}
        </label>
        <ImageUploadField
          label={t("admin.services.fields.image")}
          storedPath={form.imagePath}
          onUploaded={(path) => setField("imagePath", path)}
          onClear={() => setField("imagePath", "")}
          upload={(file) => uploadAdminImage(authorizedFormRequest, { file, scope: "services" })}
          disabled={!canWrite}
          canUpload={hasPermission("uploads.write")}
        />
        <ServiceOptionGroupsEditor
          optionGroups={form.optionGroups}
          variantPrices={form.variantPrices}
          disabled={!canWrite}
          onChange={(optionGroups, variantPrices) => setForm((current) => ({ ...current, optionGroups, variantPrices }))}
        />
        {canWrite ? (
          <Button type="submit" disabled={saving || loading}>
            {saving ? t("admin.pageContent.saving") : t("admin.services.save")}
          </Button>
        ) : null}
      </form>
    </section>
  );
}
