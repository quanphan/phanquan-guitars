import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { moveId } from "../../auth/catalog.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { errorText } from "../../auth/errorText.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import Button from "../../components/Button.jsx";
import FitImage from "../../components/FitImage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { mediaUrl } from "../../config/api.js";
import { serviceLocale } from "../../data/services.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  deleteAdminServiceCategory,
  deleteAdminServiceItem,
  listAdminServiceCategories,
  listAdminServiceItems,
  reorderAdminServiceCategories,
  reorderAdminServiceItems,
  updateAdminServiceCategory,
  updateAdminServiceItem,
} from "../../services/serviceCatalog.js";

export default function AdminServices() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { authorizedRequest, hasPermission } = useAuth();
  const canRead = hasPermission("catalog.read");
  const canWrite = hasPermission("catalog.write");
  const canDelete = hasPermission("catalog.delete");
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    if (!canRead) {
      setError("FORBIDDEN");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const [listed, listedItems] = await Promise.all([
      listAdminServiceCategories(authorizedRequest),
      listAdminServiceItems(authorizedRequest, categoryFilter || undefined),
    ]);
    if (!listed.ok) {
      setError(listed.code);
      setLoading(false);
      if (listed.code === "UNAUTHORIZED") {
        navigate("/admin/login?from=/admin/services", { replace: true });
      }
      return;
    }
    setCategories(listed.items);
    setItems(listedItems.ok ? listedItems.items : []);
    setLoading(false);
  }, [authorizedRequest, canRead, categoryFilter, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((item) => [item.id, serviceLocale(item, language).name || item.name]));
    return (id) => map.get(id) || "";
  }, [categories, language]);

  async function moveCategory(id, direction) {
    if (!canWrite) return;
    const nextIds = moveId(categories.map((item) => item.id), id, direction);
    if (!nextIds) return;
    setBusyId(id);
    const result = await reorderAdminServiceCategories(authorizedRequest, nextIds);
    setBusyId(null);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setCategories(result.items);
    setNotice("reordered");
  }

  async function moveItem(id, direction) {
    if (!canWrite || !categoryFilter) return;
    const nextIds = moveId(items.map((item) => item.id), id, direction);
    if (!nextIds) return;
    setBusyId(id);
    const result = await reorderAdminServiceItems(authorizedRequest, categoryFilter, nextIds);
    setBusyId(null);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setItems(result.items);
    setNotice("reordered");
  }

  async function toggleCategory(item) {
    if (!canWrite) return;
    setBusyId(item.id);
    const result = await updateAdminServiceCategory(authorizedRequest, item.id, { isActive: item.isActive === false });
    setBusyId(null);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setCategories((current) => current.map((row) => (row.id === item.id ? result.item : row)));
    setNotice("saved");
  }

  async function toggleItem(item) {
    if (!canWrite) return;
    setBusyId(item.id);
    const result = await updateAdminServiceItem(authorizedRequest, item.id, { isActive: item.isActive === false });
    setBusyId(null);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setItems((current) => current.map((row) => (row.id === item.id ? result.item : row)));
    setNotice("saved");
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    const result = pendingDelete.kind === "category"
      ? await deleteAdminServiceCategory(authorizedRequest, pendingDelete.id)
      : await deleteAdminServiceItem(authorizedRequest, pendingDelete.id);
    setBusyId(null);
    setPendingDelete(null);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setNotice("deleted");
    await load();
  }

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.services.title")}
        description={t("admin.services.description")}
      >
        {canWrite ? (
          <div className="mt-8 flex flex-wrap gap-4">
            <Button to="/admin/services/categories/new">{t("admin.services.addCategory")}</Button>
            <Button to="/admin/services/items/new" variant="outline">{t("admin.services.addItem")}</Button>
          </div>
        ) : null}
      </PageHeader>

      <div className="mx-auto mt-10 max-w-7xl space-y-16 px-6 lg:px-10">
        {error ? <p className="text-sm text-gold" role="alert">{errorText(t, "admin.catalog", error)}</p> : null}
        {notice ? <p className="text-sm text-ivory/80">{t(`admin.catalog.notices.${notice}`)}</p> : null}
        {loading ? <p className="text-sm text-muted">{t("admin.services.loading")}</p> : null}

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("admin.services.categories")}</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-[0.16em] text-muted">
                <tr>
                  <th className="py-3 pr-4">{t("admin.services.fields.name")}</th>
                  <th className="py-3 pr-4">{t("admin.services.fields.slug")}</th>
                  <th className="py-3 pr-4">{t("admin.services.fields.linkMode")}</th>
                  <th className="py-3 pr-4">{t("admin.services.fields.status")}</th>
                  <th className="py-3">{t("admin.services.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="py-4 pr-4 text-ivory">{serviceLocale(item, language).name || item.name}</td>
                    <td className="py-4 pr-4 text-muted">{item.slug}</td>
                    <td className="py-4 pr-4 text-muted">{t(`admin.services.linkModes.${item.linkMode}`)}</td>
                    <td className="py-4 pr-4 text-muted">
                      {item.isActive === false ? t("admin.services.hidden") : t("admin.services.visible")}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-3">
                        <Link className="text-gold" to={`/admin/services/categories/${item.id}`}>{t("admin.services.edit")}</Link>
                        {canWrite ? (
                          <>
                            <button type="button" className="text-ivory/80" disabled={busyId === item.id} onClick={() => void moveCategory(item.id, -1)}>
                              {t("admin.pageContent.moveUp")}
                            </button>
                            <button type="button" className="text-ivory/80" disabled={busyId === item.id} onClick={() => void moveCategory(item.id, 1)}>
                              {t("admin.pageContent.moveDown")}
                            </button>
                            <button type="button" className="text-ivory/80" disabled={busyId === item.id} onClick={() => void toggleCategory(item)}>
                              {item.isActive === false ? t("admin.services.show") : t("admin.services.hide")}
                            </button>
                          </>
                        ) : null}
                        {canDelete ? (
                          <button type="button" className="text-gold" onClick={() => setPendingDelete({ kind: "category", id: item.id, name: item.name })}>
                            {t("admin.delete")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && categories.length === 0 ? (
              <p className="mt-6 text-sm text-muted">{t("admin.services.emptyCategories")}</p>
            ) : null}
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("admin.services.items")}</h2>
            <label className="text-[11px] uppercase tracking-[0.16em] text-muted">
              {t("admin.services.fields.category")}
              <select
                className="mt-2 block border border-white/10 bg-ink px-3 py-2 text-sm text-ivory"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="">{t("admin.services.allCategories")}</option>
                {categories.filter((item) => item.linkMode !== "contact").map((item) => (
                  <option key={item.id} value={item.id}>
                    {serviceLocale(item, language).name || item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {!loading && items.length === 0 ? (
            <p className="mt-6 text-sm text-muted">{t("admin.services.emptyItems")}</p>
          ) : null}
          {!loading && items.length > 0 ? (
            <div className="mt-6 overflow-x-auto border border-white/10">
              <table className="min-w-[44rem] w-full text-left text-sm">
                <thead className="bg-ink text-[11px] uppercase tracking-[0.16em] text-gold">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("admin.services.fields.image")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.services.fields.title")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.services.fields.category")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.services.fields.status")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.services.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const title = serviceLocale(item, language).title || item.title;
                    const hidden = item.isActive === false;
                    return (
                      <tr key={item.id} className="border-t border-white/8">
                        <td className="px-4 py-2.5 align-middle">
                          {item.imagePath ? (
                            <FitImage
                              src={mediaUrl(item.imagePath)}
                              alt=""
                              fit="cover"
                              frameClassName="h-10 w-10 shrink-0"
                            />
                          ) : (
                            <span className="block h-10 w-10 bg-ink" aria-hidden="true" />
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-middle text-ivory">{title}</td>
                        <td className="px-4 py-2.5 align-middle text-muted">{categoryName(item.categoryId)}</td>
                        <td className={`px-4 py-2.5 align-middle ${hidden ? "text-muted" : "text-gold"}`}>
                          {hidden ? t("admin.services.hidden") : t("admin.services.visible")}
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex flex-nowrap items-center gap-3 whitespace-nowrap">
                            <Link
                              className="text-[11px] uppercase tracking-[0.16em] text-gold hover:text-gold-light"
                              to={`/admin/services/items/${item.id}`}
                            >
                              {t("admin.services.edit")}
                            </Link>
                            {canWrite ? (
                              <Link
                                className="text-[11px] uppercase tracking-[0.16em] text-gold hover:text-gold-light"
                                to={`/admin/services/items/new?copyFrom=${encodeURIComponent(item.id)}`}
                              >
                                {t("admin.services.copyNew")}
                              </Link>
                            ) : null}
                            {canWrite && categoryFilter ? (
                              <>
                                <button
                                  type="button"
                                  className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40"
                                  disabled={busyId === item.id}
                                  onClick={() => void moveItem(item.id, -1)}
                                >
                                  {t("admin.pageContent.moveUp")}
                                </button>
                                <button
                                  type="button"
                                  className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40"
                                  disabled={busyId === item.id}
                                  onClick={() => void moveItem(item.id, 1)}
                                >
                                  {t("admin.pageContent.moveDown")}
                                </button>
                              </>
                            ) : null}
                            {canWrite ? (
                              <button
                                type="button"
                                className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40"
                                disabled={busyId === item.id}
                                onClick={() => void toggleItem(item)}
                              >
                                {hidden ? t("admin.services.show") : t("admin.services.hide")}
                              </button>
                            ) : null}
                            {canDelete ? (
                              <button
                                type="button"
                                className="text-[11px] uppercase tracking-[0.16em] text-gold"
                                onClick={() => setPendingDelete({ kind: "item", id: item.id, name: item.title })}
                              >
                                {t("admin.delete")}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("admin.services.deleteTitle")}
        body={t("admin.services.deleteBody")}
        confirmLabel={t("admin.delete")}
        cancelLabel={t("admin.cancel")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
