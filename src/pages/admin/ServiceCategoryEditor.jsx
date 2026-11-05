import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { slugifyName } from "../../auth/catalog.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { errorText } from "../../auth/errorText.js";
import { fieldErrorsFromPayload } from "../../auth/registerPayload.js";
import ImageUploadField from "../../components/admin/ImageUploadField.jsx";
import Field, { fieldClass } from "../../components/auth/Field.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { uploadAdminImage } from "../../services/adminCatalogService.js";
import {
  createAdminServiceCategory,
  getAdminServiceCategory,
  updateAdminServiceCategory,
} from "../../services/serviceCatalog.js";

const emptyForm = {
  slug: "",
  viName: "",
  enName: "",
  viDescription: "",
  enDescription: "",
  imagePath: "",
  linkMode: "details",
  isActive: true,
  sortOrder: 0,
};

export default function ServiceCategoryEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { authorizedRequest, authorizedFormRequest, hasPermission } = useAuth();
  const canWrite = hasPermission("catalog.write");
  const canUpload = hasPermission("uploads.write");
  const [form, setForm] = useState(emptyForm);
  const [slugLocked, setSlugLocked] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const setField = useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  useEffect(() => {
    if (slugLocked || !isNew) return;
    setForm((current) => ({ ...current, slug: slugifyName(current.enName || current.viName) }));
  }, [form.enName, form.viName, isNew, slugLocked]);

  useEffect(() => {
    if (isNew) return undefined;
    let cancelled = false;
    getAdminServiceCategory(authorizedRequest, id).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.code);
        setLoading(false);
        return;
      }
      const item = result.item;
      setForm({
        slug: item.slug || "",
        viName: item.translations?.vi?.name || "",
        enName: item.translations?.en?.name || item.name || "",
        viDescription: item.translations?.vi?.description || "",
        enDescription: item.translations?.en?.description || "",
        imagePath: item.imagePath || "",
        linkMode: item.linkMode === "contact" ? "contact" : "details",
        isActive: item.isActive !== false,
        sortOrder: item.sortOrder || 0,
      });
      setSlugLocked(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [authorizedRequest, id, isNew]);

  async function onSubmit(event) {
    event.preventDefault();
    if (!canWrite || saving) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const body = {
      slug: form.slug,
      linkMode: form.linkMode,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
      imagePath: form.imagePath || null,
      translations: {
        vi: { name: form.viName, description: form.viDescription },
        en: { name: form.enName, description: form.enDescription },
      },
    };
    const result = isNew
      ? await createAdminServiceCategory(authorizedRequest, body)
      : await updateAdminServiceCategory(authorizedRequest, id, body);
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
        title={isNew ? t("admin.services.addCategory") : t("admin.services.editCategory")}
      >
        <Link to="/admin/services" className="mt-6 inline-block text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("admin.services.back")}
        </Link>
      </PageHeader>
      <form className="mx-auto mt-10 max-w-3xl space-y-8 px-6 lg:px-10" onSubmit={onSubmit}>
        {loading ? <p className="text-sm text-muted">{t("admin.services.loading")}</p> : null}
        {error ? <p className="text-sm text-gold" role="alert">{errorText(t, "admin.catalog", error)}</p> : null}
        <Field id="enName" label={t("admin.services.fields.enName")} value={form.enName} onChange={(value) => setField("enName", value)} error={fieldErrors.enName} disabled={!canWrite} />
        <Field id="viName" label={t("admin.services.fields.viName")} value={form.viName} onChange={(value) => setField("viName", value)} error={fieldErrors.viName} disabled={!canWrite} />
        <Field id="slug" label={t("admin.services.fields.slug")} value={form.slug} onChange={(value) => { setSlugLocked(true); setField("slug", value); }} error={fieldErrors.slug} disabled={!canWrite} />
        <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
          {t("admin.services.fields.enDescription")}
          <textarea className={`${fieldClass} mt-2 min-h-28`} value={form.enDescription} onChange={(event) => setField("enDescription", event.target.value)} disabled={!canWrite} />
        </label>
        <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
          {t("admin.services.fields.viDescription")}
          <textarea className={`${fieldClass} mt-2 min-h-28`} value={form.viDescription} onChange={(event) => setField("viDescription", event.target.value)} disabled={!canWrite} />
        </label>
        <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
          {t("admin.services.fields.linkMode")}
          <select className={`${fieldClass} mt-2`} value={form.linkMode} onChange={(event) => setField("linkMode", event.target.value)} disabled={!canWrite}>
            <option value="details">{t("admin.services.linkModes.details")}</option>
            <option value="contact">{t("admin.services.linkModes.contact")}</option>
          </select>
        </label>
        <Field
          id="sortOrder"
          label={t("admin.services.fields.sortOrder")}
          value={String(form.sortOrder)}
          onChange={(value) => setField("sortOrder", value)}
          error={fieldErrors.sortOrder}
          disabled={!canWrite}
        />
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
          canUpload={canUpload}
        />
        {canWrite ? (
          <Button type="submit" disabled={saving}>
            {saving ? t("admin.pageContent.saving") : t("admin.services.save")}
          </Button>
        ) : null}
      </form>
    </section>
  );
}
