import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import {
  buildTermPayload,
  isCatalogKind,
  parentChoices,
  PARENT_KIND_SOURCES,
  slugifyName,
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
  description: "",
  parentId: "",
  imagePath: "",
  isActive: true,
  sortOrder: 0,
  viName: "",
  viDescription: "",
  enName: "",
  enDescription: "",
};

export default function CatalogTermEditor() {
  const { kind, id } = useParams();
  const isNew = !id || id === "new";
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { authorizedRequest, authorizedFormRequest, hasPermission } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const canRead = hasPermission("catalog.read");
  const canWrite = hasPermission("catalog.write");
  const canUpload = hasPermission("uploads.write");

  const setField = useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  useEffect(() => {
    if (slugTouched) return;
    setForm((current) => ({ ...current, slug: slugifyName(current.name) }));
  }, [form.name, slugTouched]);

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
        description: item.description || "",
        parentId: item.parentId || "",
        imagePath: item.imagePath || "",
        isActive: item.isActive !== false,
        sortOrder: item.sortOrder || 0,
        viName: item.translations?.vi?.name || "",
        viDescription: item.translations?.vi?.description || "",
        enName: item.translations?.en?.name || "",
        enDescription: item.translations?.en?.description || "",
      });
      setSlugTouched(true);
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
    const next = buildTermPayload(form);
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
          <form className="space-y-5 border border-white/10 bg-panel/40 p-6" onSubmit={onSubmit} noValidate>
            {error ? (
              <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm" role="alert">
                {error === "invalid" ? t("auth.formIncomplete") : errorText(t, "admin.catalog", error)}
              </p>
            ) : null}
            <Field
              id="term-name"
              label={t("admin.catalog.fields.name")}
              value={form.name}
              onChange={(value) => setField("name", value)}
              disabled={saving || !canWrite}
              required
              error={fieldErrors.name || fieldErrors.slug}
            />
            <div>
              <label htmlFor="term-description" className="text-[11px] uppercase tracking-[0.18em] text-gold">
                {t("admin.catalog.fields.description")}
              </label>
              <textarea
                id="term-description"
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                disabled={saving || !canWrite}
                rows={4}
                className={fieldErrors.description ? errorFieldClass : fieldClass}
              />
            </div>
            {kind !== "categories" ? (
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
                {t("admin.catalog.fields.parent")}
                <select
                  value={form.parentId}
                  onChange={(event) => setField("parentId", event.target.value)}
                  disabled={saving || !canWrite}
                  className={fieldClass}
                >
                  <option value="">{t("admin.catalog.noParent")}</option>
                  {parentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.kind})
                    </option>
                  ))}
                </select>
              </label>
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
              {t("admin.catalog.active")}
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
            <h2 className="pt-2 text-[11px] uppercase tracking-[0.22em] text-gold">{t("admin.catalog.translations")}</h2>
            <Field id="term-vi-name" label={t("admin.catalog.fields.viName")} value={form.viName} onChange={(value) => setField("viName", value)} disabled={saving || !canWrite} />
            <Field id="term-en-name" label={t("admin.catalog.fields.enName")} value={form.enName} onChange={(value) => setField("enName", value)} disabled={saving || !canWrite} />
            <Field id="term-vi-desc" label={t("admin.catalog.fields.viDescription")} value={form.viDescription} onChange={(value) => setField("viDescription", value)} disabled={saving || !canWrite} />
            <Field id="term-en-desc" label={t("admin.catalog.fields.enDescription")} value={form.enDescription} onChange={(value) => setField("enDescription", value)} disabled={saving || !canWrite} />
            {canWrite ? (
              <Button type="submit" disabled={saving}>
                {saving ? t("admin.catalog.saving") : t("admin.catalog.save")}
              </Button>
            ) : (
              <p className="text-sm text-muted">{t("admin.catalog.readOnly")}</p>
            )}
          </form>
        )}
      </div>
    </>
  );
}
