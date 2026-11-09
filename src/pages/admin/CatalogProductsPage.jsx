import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import {
  ADMIN_PRODUCT_PAGE_SIZES,
  recordRange,
  visiblePageNumbers,
} from "../../auth/catalog.js";
import { errorText } from "../../auth/errorText.js";
import { PRODUCT_TYPES } from "../../auth/productSpecs.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import ProductPinToggle from "../../components/admin/ProductPinToggle.jsx";
import ProductSttCell from "../../components/admin/ProductSttCell.jsx";
import Button from "../../components/Button.jsx";
import FitImage from "../../components/FitImage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { mediaUrl } from "../../config/api.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  deleteAdminProduct,
  listAdminCatalogProducts,
  updateAdminCatalogProduct,
} from "../../services/adminCatalogService.js";

const inputClass =
  "mt-2 w-full border border-white/10 bg-ink px-3 py-2.5 text-sm text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export default function CatalogProductsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { authorizedRequest, hasPermission } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 400);
  const [status, setStatus] = useState("");
  const [productType, setProductType] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rowState, setRowState] = useState({});
  const canRead = hasPermission("catalog.read");
  const canWrite = hasPermission("catalog.write");
  const canDelete = hasPermission("catalog.delete");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!canRead) {
      setItems([]);
      setError("FORBIDDEN");
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setError(null);
    const listed = await listAdminCatalogProducts(authorizedRequest, {
      search,
      status,
      productType,
      page,
      limit: pageSize,
      sort: "listing",
    });
    if (!listed.ok) {
      setItems([]);
      setMeta(null);
      setError(listed.code);
      setLoading(false);
      if (listed.code === "UNAUTHORIZED") {
        navigate("/admin/login?from=/admin/catalog/products", { replace: true });
      }
      return;
    }
    setItems(listed.items);
    setMeta(listed.meta);
    setLoading(false);
  }, [authorizedRequest, canRead, navigate, page, pageSize, productType, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status, productType, pageSize]);

  function patchRow(id, patch) {
    setRowState((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  async function togglePin(item) {
    if (!canWrite) return;
    patchRow(item.id, { pinSaving: true });
    const result = await updateAdminCatalogProduct(authorizedRequest, item.id, { pin: item.pin !== true });
    if (!result.ok) {
      patchRow(item.id, { pinSaving: false, pinError: true });
      setError(result.code);
      return;
    }
    patchRow(item.id, { pinSaving: false, pinError: false });
    setNotice("pinUpdated");
    await load({ silent: true });
  }

  async function saveStt(item, result) {
    if (!canWrite) return;
    if (!result.ok) {
      patchRow(item.id, { sttStatus: "error", sttMessage: t("admin.catalog.sttInvalid") });
      return;
    }
    patchRow(item.id, { sttSaving: true, sttStatus: "saving", sttMessage: t("admin.catalog.saving") });
    const saved = await updateAdminCatalogProduct(authorizedRequest, item.id, { sortOrder: result.value });
    if (!saved.ok) {
      patchRow(item.id, { sttSaving: false, sttStatus: "error", sttMessage: errorText(t, "admin.catalog", saved.code) });
      setError(saved.code);
      await load({ silent: true });
      return;
    }
    patchRow(item.id, { sttSaving: false, sttStatus: "saved", sttMessage: t("admin.catalog.notices.sttUpdated") });
    setNotice("sttUpdated");
    await load({ silent: true });
  }

  async function confirmDelete() {
    if (!pendingDelete || !canDelete) return;
    setBusy(true);
    const result = await deleteAdminProduct(authorizedRequest, pendingDelete.id);
    setBusy(false);
    setPendingDelete(null);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setNotice("deleted");
    await load({ silent: true });
  }

  const range = recordRange(meta?.page || page, meta?.limit || pageSize, meta?.total || 0);
  const pages = visiblePageNumbers(meta?.page || page, meta?.totalPages || 0);

  return (
    <>
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.catalog.groups.products")}
        description={t("admin.catalog.groupHelp.products")}
      />
      <div className="mx-auto mt-8 max-w-7xl px-6 lg:px-10">
        <form
          className="grid gap-4 border border-white/10 bg-panel/40 p-5 md:grid-cols-2 lg:grid-cols-5"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.catalog.search")}
            <input
              type="search"
              value={searchInput}
              maxLength={80}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("admin.catalog.productSearchPlaceholder")}
              className={inputClass}
            />
          </label>
          <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.catalog.status")}
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              <option value="">{t("admin.catalog.allStatuses")}</option>
              <option value="published">{t("admin.catalog.published")}</option>
              <option value="draft">{t("admin.catalog.draft")}</option>
            </select>
          </label>
          <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.catalog.columns.productType")}
            <select value={productType} onChange={(event) => setProductType(event.target.value)} className={inputClass}>
              <option value="">{t("admin.catalog.allProductTypes")}</option>
              <option value={PRODUCT_TYPES.CUSTOM_ORDER}>{t("admin.catalog.productTypes.custom-order")}</option>
              <option value={PRODUCT_TYPES.READY_STOCK}>{t("admin.catalog.productTypes.ready-stock")}</option>
            </select>
          </label>
          <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.catalog.perPage")}
            <select
              value={String(pageSize)}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className={inputClass}
            >
              {ADMIN_PRODUCT_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          {canWrite ? (
            <div className="flex items-end">
              <Button to="/admin/catalog/products/new" className="w-full">
                {t("admin.catalog.add")}
              </Button>
            </div>
          ) : null}
        </form>

        {notice ? (
          <p className="mt-6 border border-gold/40 px-4 py-3 text-sm" role="status">
            {t(`admin.catalog.notices.${notice}`)}
          </p>
        ) : null}

        {error ? (
          <div className="mt-6 border border-gold/40 bg-gold/10 px-4 py-4 text-sm" role="alert">
            <p>{errorText(t, "admin.catalog", error)}</p>
            <button type="button" onClick={() => void load()} className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold">
              {t("admin.retry")}
            </button>
          </div>
        ) : null}

        {loading ? (
          <p className="mt-8 text-sm text-muted" role="status">
            {t("admin.loadingBody")}
          </p>
        ) : !error && items.length === 0 ? (
          <p className="mt-8 border border-white/10 px-4 py-6 text-sm text-muted" role="status">
            {t("admin.catalog.empty")}
          </p>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="mt-8 overflow-x-auto border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink text-[11px] uppercase tracking-[0.16em] text-gold">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.image")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.name")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.productType")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.type")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.shape")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.series")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.pin")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.stt")}</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">{t("admin.catalog.columns.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const row = rowState[item.id] || {};
                  return (
                    <tr key={item.id} className="border-t border-white/8">
                      <td className="px-4 py-3">
                        {item.image ? (
                          <FitImage src={mediaUrl(item.image)} alt="" fit="contain" frameClassName="h-12 w-12" />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/catalog/products/${item.id}`} className="text-gold hover:text-gold-light">
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {item.productType || item.specs?.productType
                          ? t(`admin.catalog.productTypes.${item.productType || item.specs.productType}`)
                          : t("admin.catalog.productTypes.unset")}
                      </td>
                      <td className="px-4 py-3 text-muted">{item.instrumentType?.name || item.type || "—"}</td>
                      <td className="px-4 py-3 text-muted">{item.bodyShape?.name || "—"}</td>
                      <td className="px-4 py-3 text-muted">{item.series?.name || "—"}</td>
                      <td className="px-4 py-3">{t(`admin.catalog.${item.status === "draft" ? "draft" : "published"}`)}</td>
                      <td className="px-4 py-3">
                        <ProductPinToggle
                          pinned={item.pin === true}
                          disabled={!canWrite}
                          saving={row.pinSaving}
                          label={item.pin === true ? t("admin.catalog.pinned") : t("admin.catalog.pin")}
                          onToggle={() => void togglePin(item)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <ProductSttCell
                          value={item.sortOrder}
                          disabled={!canWrite}
                          saving={row.sttSaving}
                          status={row.sttMessage}
                          message={row.sttStatus === "saved" || row.sttStatus === "error" ? row.sttMessage : null}
                          onSave={(result) => void saveStt(item, result)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-3">
                          {canWrite ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => navigate(`/admin/catalog/products/new?copyFrom=${encodeURIComponent(item.id)}`)}
                              className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40"
                            >
                              {t("admin.catalog.copy")}
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button type="button" onClick={() => setPendingDelete(item)} className="text-[11px] uppercase tracking-[0.16em] text-gold">
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

        {meta ? (
          <div className="mt-6 flex flex-col gap-4 text-sm text-muted md:flex-row md:items-center md:justify-between">
            <p>
              {t("admin.catalog.showing")
                .replace("{from}", String(range.from))
                .replace("{to}", String(range.to))
                .replace("{total}", String(range.total))}
            </p>
            {meta.totalPages > 1 ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="uppercase tracking-[0.16em] text-gold disabled:opacity-40"
                >
                  {t("admin.catalog.previous")}
                </button>
                {pages.map((value, index) => {
                  const previous = pages[index - 1];
                  return (
                    <span key={value} className="flex items-center gap-3">
                      {previous && value - previous > 1 ? <span>…</span> : null}
                      <button
                        type="button"
                        onClick={() => setPage(value)}
                        className={`uppercase tracking-[0.16em] ${value === page ? "text-ivory" : "text-gold"}`}
                        aria-current={value === page ? "page" : undefined}
                      >
                        {value}
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  className="uppercase tracking-[0.16em] text-gold disabled:opacity-40"
                >
                  {t("admin.catalog.next")}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("admin.catalog.deleteProductTitle")}
        body={t("admin.catalog.deleteProductBody")}
        confirmLabel={t("admin.catalog.deleteConfirm")}
        cancelLabel={t("admin.cancel")}
        busy={busy}
        onCancel={() => {
          if (!busy) setPendingDelete(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
