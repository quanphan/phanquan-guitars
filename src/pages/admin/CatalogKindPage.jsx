import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import {
  catalogParentLabel,
  catalogTermDescription,
  catalogTermName,
  filterTerms,
  indexCatalogTerms,
  isCatalogKind,
  moveId,
  PARENT_KIND_SOURCES,
  resolvesExternalParents,
  usesParentField,
} from "../../auth/catalog.js";
import { errorText } from "../../auth/errorText.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  deleteCatalogTerm,
  listCatalogTerms,
  reorderCatalogTerms,
  updateCatalogTerm,
} from "../../services/adminCatalogService.js";

const inputClass =
  "mt-2 w-full border border-white/10 bg-ink px-3 py-2.5 text-sm text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export default function CatalogKindPage() {
  const { kind } = useParams();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { authorizedRequest, hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [parentLookup, setParentLookup] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [status, setStatus] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const canRead = hasPermission("catalog.read");
  const canWrite = hasPermission("catalog.write");
  const canDelete = hasPermission("catalog.delete");

  const load = useCallback(async () => {
    if (!isCatalogKind(kind)) return;
    if (!canRead) {
      setItems([]);
      setParentLookup([]);
      setError("FORBIDDEN");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const listed = await listCatalogTerms(authorizedRequest, kind);
    if (!listed.ok) {
      setItems([]);
      setParentLookup([]);
      setError(listed.code);
      setLoading(false);
      if (listed.code === "UNAUTHORIZED") {
        navigate(`/admin/login?from=${encodeURIComponent(`/admin/catalog/${kind}`)}`, { replace: true });
      }
      return;
    }
    setItems(listed.items);
    if (resolvesExternalParents(kind)) {
      const sources = (PARENT_KIND_SOURCES[kind] || [kind]).filter((source) => source !== kind);
      const extras = await Promise.all(sources.map((source) => listCatalogTerms(authorizedRequest, source)));
      const related = extras.filter((result) => result.ok).flatMap((result) => result.items);
      setParentLookup([...listed.items, ...related]);
    } else {
      setParentLookup([]);
    }
    setLoading(false);
  }, [authorizedRequest, canRead, kind, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => filterTerms(items, { q: search, status }), [items, search, status]);
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const parentById = useMemo(
    () => (resolvesExternalParents(kind) ? indexCatalogTerms(parentLookup) : byId),
    [byId, kind, parentLookup],
  );

  async function move(id, direction) {
    if (!canWrite) return;
    const nextIds = moveId(
      items.map((item) => item.id),
      id,
      direction,
    );
    if (!nextIds) return;
    setBusyId(id);
    setError(null);
    const result = await reorderCatalogTerms(authorizedRequest, kind, nextIds);
    setBusyId(null);
    if (!result.ok) {
      setError(result.code);
      if (result.code === "UNAUTHORIZED") {
        navigate(`/admin/login?from=${encodeURIComponent(`/admin/catalog/${kind}`)}`, { replace: true });
      }
      return;
    }
    setItems(result.items);
    setNotice("reordered");
  }

  async function toggleActive(item) {
    if (!canWrite) return;
    setBusyId(item.id);
    setError(null);
    const result = await updateCatalogTerm(authorizedRequest, kind, item.id, {
      isActive: item.isActive === false,
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setItems((current) => current.map((row) => (row.id === item.id ? result.item : row)));
    setNotice("saved");
  }

  async function confirmDelete() {
    if (!pendingDelete || !canDelete) return;
    setBusyId(pendingDelete.id);
    const result = await deleteCatalogTerm(authorizedRequest, kind, pendingDelete.id);
    setBusyId(null);
    setPendingDelete(null);
    if (!result.ok) {
      setError(result.code);
      setNotice(null);
      return;
    }
    setNotice("deleted");
    await load();
  }

  if (!isCatalogKind(kind)) {
    return <Navigate to="/admin/catalog/categories" replace />;
  }

  return (
    <>
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t(`admin.catalog.groups.${kind}`)}
        description={t(`admin.catalog.groupHelp.${kind}`)}
      />
      <div className="mx-auto mt-8 max-w-7xl px-6 lg:px-10">
        <form
          className="grid gap-4 border border-white/10 bg-panel/40 p-5 md:grid-cols-3"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.catalog.search")}
            <input
              type="search"
              value={searchInput}
              maxLength={80}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("admin.catalog.searchPlaceholder")}
              className={inputClass}
            />
          </label>
          <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.catalog.status")}
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              <option value="">{t("admin.catalog.allStatuses")}</option>
              <option value="active">{t("admin.catalog.active")}</option>
              <option value="inactive">{t("admin.catalog.inactive")}</option>
            </select>
          </label>
          {canWrite ? (
            <div className="flex items-end">
              <Button to={`/admin/catalog/${kind}/new`} className="w-full">
                {t("admin.catalog.add")}
              </Button>
            </div>
          ) : null}
        </form>

        {notice ? (
          <p className="mt-6 border border-gold/40 px-4 py-3 text-sm text-ivory" role="status">
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
        ) : !error && visible.length === 0 ? (
          <p className="mt-8 border border-white/10 px-4 py-6 text-sm text-muted" role="status">
            {t("admin.catalog.empty")}
          </p>
        ) : null}

        {!loading && visible.length > 0 ? (
          <div className="mt-8 overflow-x-auto border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink text-[11px] uppercase tracking-[0.16em] text-gold">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.name")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.description")}</th>
                  {usesParentField(kind) ? (
                    <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.parent")}</th>
                  ) : null}
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.catalog.columns.sort")}</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">{t("admin.catalog.columns.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} className="border-t border-white/8">
                    <td className="px-4 py-3 align-top">
                      <Link to={`/admin/catalog/${kind}/${item.id}`} className="text-gold hover:text-gold-light">
                        {catalogTermName(item)}
                      </Link>
                    </td>
                    <td className="max-w-xs px-4 py-3 align-top text-muted">
                      <span className="line-clamp-2">
                        {catalogTermDescription(item, language) || "—"}
                      </span>
                    </td>
                    {usesParentField(kind) ? (
                      <td className="px-4 py-3 align-top text-muted">
                        {resolvesExternalParents(kind)
                          ? catalogParentLabel(item, parentById, language) || "—"
                          : catalogTermName(byId.get(item.parentId)) || "—"}
                      </td>
                    ) : null}
                    <td className="px-4 py-3 align-top">
                      {item.isActive === false ? t("admin.catalog.inactive") : t("admin.catalog.active")}
                    </td>
                    <td className="px-4 py-3 align-top">{item.sortOrder}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-3">
                        {canWrite ? (
                          <>
                            <Link
                              to={`/admin/catalog/${kind}/${item.id}`}
                              className="text-[11px] uppercase tracking-[0.16em] text-gold"
                            >
                              {t("admin.catalog.edit")}
                            </Link>
                            <button type="button" disabled={busyId === item.id} onClick={() => void move(item.id, -1)} className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40">
                              {t("admin.catalog.up")}
                            </button>
                            <button type="button" disabled={busyId === item.id} onClick={() => void move(item.id, 1)} className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40">
                              {t("admin.catalog.down")}
                            </button>
                            <button type="button" disabled={busyId === item.id} onClick={() => void toggleActive(item)} className="text-[11px] uppercase tracking-[0.16em] text-gold disabled:opacity-40">
                              {item.isActive === false ? t("admin.catalog.activate") : t("admin.catalog.deactivate")}
                            </button>
                          </>
                        ) : null}
                        {canDelete ? (
                          <button type="button" onClick={() => setPendingDelete(item)} className="text-[11px] uppercase tracking-[0.16em] text-gold">
                            {t("admin.delete")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("admin.catalog.deleteTitle")}
        body={t("admin.catalog.deleteBody")}
        confirmLabel={t("admin.catalog.deleteConfirm")}
        cancelLabel={t("admin.cancel")}
        busy={Boolean(busyId)}
        onCancel={() => {
          if (!busyId) setPendingDelete(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
