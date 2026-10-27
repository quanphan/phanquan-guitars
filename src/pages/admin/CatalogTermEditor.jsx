import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import {
  buildTermPayload,
  catalogTermName,
  isCatalogKind,
  parentChoices,
  PARENT_KIND_SOURCES,
  slugifyName,
  usesParentField,
} from "../../auth/catalog.js";
import { errorText } from "../../auth/errorText.js";
import { fieldErrorsFromPayload } from "../../auth/registerPayload.js";
import ImageUploadField from "../../components/admin/ImageUploadField.jsx";
import Field, { fieldClass, errorFieldClass } from "../../components/auth/Field.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  createCatalogTerm,
  getCatalogTerm,
  listCatalogTerms,
  updateCatalogTerm,
  uploadAdminImage,
} from "../../services/adminCatalogService.js";

const emptyForm = {
  name: "",
  slug: "",
  parentId: "",
  imagePath: "",
  isActive: true,
  sortOrder: 0,
  viDescription: "",
  enDescription: "",
  viShortDescription: "",
  enShortDescription: "",
  minPrice: "",
  maxPrice: "",
  currency: "USD",
};

function FormSection({ title, children }) {
  return (
    <section className="space-y-4 border-b border-white/10 pb-8 last:border-b-0 last:pb-0">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">{title}</h2>
      {children}
    </section>
  );
}

export default function CatalogTermEditor() {
  const { kind, id } = useParams();
  const isNew = !id || id === "new";
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { authorizedRequest, authorizedFormRequest, hasPermission } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [slugLocked, setSlugLocked] = useState(false);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const canRead = hasPermission("catalog.read");
  const canWrite = hasPermission("catalog.write");
  const canUpload = hasPermission("uploads.write");
  const showParent = usesParentField(kind);
  const isSeries = kind === "series";

  const setField = useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  useEffect(() => {
    if (slugLocked) return;
    setForm((current) => ({ ...current, slug: slugifyName(current.name) }));
  }, [form.name, slugLocked]);

  const load = useCallback(async () => {
    if (!isCatalogKind(kind)) return;
    if (!canRead) {
      setError("FORBIDDEN");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const sources = PARENT_KIND_SOURCES[kind] || [kind];
    const listed = await Promise.all(sources.map((source) => listCatalogTerms(authorizedRequest, source)));
    const failed = listed.find((result) => !result.ok);
    if (failed) {
      setError(failed.code);
      setLoading(false);
      if (failed.code === "UNAUTHORIZED") {
        navigate(`/admin/login?from=${encodeURIComponent(`/admin/catalog/${kind}`)}`, { replace: true });
      }
      return;
    }
    const combined = listed.flatMap((result) => result.items);
    if (!isNew) {
      const detail = await getCatalogTerm(authorizedRequest, kind, id);
      if (!detail.ok) {
        setError(detail.code);
        setLoading(false);
        if (detail.code === "UNAUTHORIZED") {
          navigate(`/admin/login?from=${encodeURIComponent(`/admin/catalog/${kind}/${id}`)}`, {
            replace: true,
          });
        }
        return;
      }
      const item = detail.item;
      setForm({
        name: item.name || "",
        slug: item.slug || "",
        parentId: item.parentId || "",
        imagePath: item.imagePath || "",
        isActive: item.isActive !== false,
        sortOrder: item.sortOrder || 0,
        viDescription: item.translations?.vi?.description || "",
        enDescription: item.translations?.en?.description || "",
        viShortDescription: item.translations?.vi?.shortDescription || "",
        enShortDescription: item.translations?.en?.shortDescription || "",
        minPrice: item.minPrice == null ? "" : String(item.minPrice),
        maxPrice: item.maxPrice == null ? "" : String(item.maxPrice),
        currency: item.currency || "USD",
      });
      setSlugLocked(true);
      setParents(parentChoices(combined, item.id));
    } else {
      setParents(parentChoices(combined, null));
    }
    setLoading(false);
  }, [authorizedRequest, canRead, id, isNew, kind, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event) {
    event.preventDefault();
    if (!canWrite || saving) return;
    const next = buildTermPayload(form, { kind });
    if (!next.ok) {
      setFieldErrors(
        Object.fromEntries(Object.entries(next.errors).map(([key, code]) => [key, t(`admin.catalog.fieldErrors.${code}`)])),
      );
      setError("invalid");
      return;
    }
    setFieldErrors({});
    setError(null);
    setSaving(true);
    const result = isNew
      ? await createCatalogTerm(authorizedRequest, kind, next.body)
      : await updateCatalogTerm(authorizedRequest, kind, id, next.body);
    setSaving(false);
    if (!result.ok) {
      setError(result.code);
      const mapped = fieldErrorsFromPayload({ error: { details: result.details } });
      if (Object.keys(mapped).length) {
        setFieldErrors(
          Object.fromEntries(Object.entries(mapped).map(([key, code]) => [key, t(`admin.catalog.fieldErrors.${code}`)])),
        );
      }
      if (result.code === "UNAUTHORIZED") {
        navigate(`/admin/login?from=${encodeURIComponent(`/admin/catalog/${kind}`)}`, { replace: true });
      }
      return;
    }
    navigate(`/admin/catalog/${kind}`);
  }

  const parentOptions = useMemo(
    () => parents.filter((item, index, all) => all.findIndex((row) => row.id === item.id) === index),
    [parents],
  );

  if (!isCatalogKind(kind)) {
    return <Navigate to="/admin/catalog/categories" replace />;
  }

  return (
    <>
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={isNew ? t("admin.catalog.createTitle") : t("admin.catalog.editTitle")}
        description={t(`admin.catalog.groups.${kind}`)}
      >
        <Link to={`/admin/catalog/${kind}`} className="mt-8 inline-flex text-[11px] uppercase tracking-[0.22em] text-gold">
          {t("admin.catalog.back")}
        </Link>
      </PageHeader>
      <div className="mx-auto mt-8 max-w-3xl px-6 lg:px-10">
        {loading ? (
          <p className="text-sm text-muted">{t("admin.loadingBody")}</p>
        ) : (
          <form className="space-y-8 border border-white/10 bg-panel/40 p-5 sm:p-8" onSubmit={onSubmit} noValidate>
            {error ? (
              <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm" role="alert">
                {error === "invalid" ? t("auth.formIncomplete") : errorText(t, "admin.catalog", error)}
              </p>
            ) : null}

            <FormSection title={t("admin.catalog.sections.basic")}>
              <Field
                id="term-name"
                label={t("admin.catalog.fields.name")}
                value={form.name}
                onChange={(value) => setField("name", value)}
                disabled={saving || !canWrite}
                required
                maxLength={120}
                error={fieldErrors.name || fieldErrors.slug}
              />
              {isSeries ? (
                <>
                  <Field
                    id="term-vi-short-desc"
                    label={t("admin.catalog.fields.viShortDescription")}
                    value={form.viShortDescription}
                    onChange={(value) => setField("viShortDescription", value)}
                    disabled={saving || !canWrite}
                    multiline
                    rows={2}
                    maxLength={200}
                    error={fieldErrors.viShortDescription}
                  />
                  <Field
                    id="term-en-short-desc"
                    label={t("admin.catalog.fields.enShortDescription")}
                    value={form.enShortDescription}
                    onChange={(value) => setField("enShortDescription", value)}
                    disabled={saving || !canWrite}
                    multiline
                    rows={2}
                    maxLength={200}
                    error={fieldErrors.enShortDescription}
                  />
                </>
              ) : null}
              <Field
                id="term-vi-desc"
                label={isSeries ? t("admin.catalog.fields.viFullDescription") : t("admin.catalog.fields.viDescription")}
                value={form.viDescription}
                onChange={(value) => setField("viDescription", value)}
                disabled={saving || !canWrite}
                multiline
                rows={4}
                maxLength={500}
                error={fieldErrors.viDescription}
              />
              <Field
                id="term-en-desc"
                label={isSeries ? t("admin.catalog.fields.enFullDescription") : t("admin.catalog.fields.enDescription")}
                value={form.enDescription}
                onChange={(value) => setField("enDescription", value)}
                disabled={saving || !canWrite}
                multiline
                rows={4}
                maxLength={500}
                error={fieldErrors.enDescription}
              />
            </FormSection>

            {isSeries ? (
              <FormSection title={t("admin.catalog.sections.priceRange")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="term-min-price"
                    label={t("admin.catalog.fields.minPrice")}
                    type="number"
                    value={form.minPrice}
                    onChange={(value) => setField("minPrice", value)}
                    disabled={saving || !canWrite}
                    error={fieldErrors.minPrice}
                  />
                  <Field
                    id="term-max-price"
                    label={t("admin.catalog.fields.maxPrice")}
                    type="number"
                    value={form.maxPrice}
                    onChange={(value) => setField("maxPrice", value)}
                    disabled={saving || !canWrite}
                    error={fieldErrors.maxPrice}
                  />
                </div>
                <Field
                  id="term-currency"
                  label={t("admin.catalog.fields.unit")}
                  value={form.currency}
                  onChange={(value) => setField("currency", value.toUpperCase())}
                  disabled={saving || !canWrite}
                  maxLength={3}
                  error={fieldErrors.currency}
                />
              </FormSection>
            ) : null}

            <FormSection title={t("admin.catalog.sections.settings")}>
              {showParent ? (
                <div>
                  <label htmlFor="term-parent" className="text-[11px] uppercase tracking-[0.18em] text-gold">
                    {t("admin.catalog.fields.parent")}
                  </label>
                  <select
                    id="term-parent"
                    value={form.parentId}
                    onChange={(event) => setField("parentId", event.target.value)}
                    disabled={saving || !canWrite}
                    className={fieldErrors.parentId ? errorFieldClass : fieldClass}
                  >
                    <option value="">{t("admin.catalog.noParent")}</option>
                    {parentOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {catalogTermName(item)}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.parentId ? <p className="mt-2 text-xs text-gold">{fieldErrors.parentId}</p> : null}
                </div>
              ) : null}
              <Field
                id="term-sort"
                label={t("admin.catalog.fields.sortOrder")}
                type="number"
                value={String(form.sortOrder)}
                onChange={(value) => setField("sortOrder", value === "" ? 0 : Number(value))}
                disabled={saving || !canWrite}
                error={fieldErrors.sortOrder}
              />
              <label className="flex items-center gap-3 text-sm text-ivory">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setField("isActive", event.target.checked)}
                  disabled={saving || !canWrite}
                  className="size-4 accent-gold"
                />
                {form.isActive ? t("admin.catalog.active") : t("admin.catalog.inactive")}
              </label>
              <ImageUploadField
                label={t("admin.catalog.fields.image")}
                storedPath={form.imagePath}
                canUpload={canUpload && canWrite}
                disabled={saving}
                onUploaded={(path) => setField("imagePath", path)}
                onClear={() => setField("imagePath", "")}
                upload={(file) => uploadAdminImage(authorizedFormRequest, { file, scope: "categories" })}
              />
            </FormSection>

            {canWrite ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="submit" disabled={saving}>
                  {saving ? t("admin.catalog.saving") : t("admin.catalog.save")}
                </Button>
                <Button to={`/admin/catalog/${kind}`} variant="outline" disabled={saving}>
                  {t("admin.cancel")}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted">{t("admin.catalog.readOnly")}</p>
            )}
          </form>
        )}
      </div>
    </>
  );
}
