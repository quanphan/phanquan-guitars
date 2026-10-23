import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { USER_ROLES, USER_STATUSES } from "../../auth/adminUserQuery.js";
import { PERMISSIONS } from "../../auth/permissions.js";
import CreateAdminModal from "../../components/admin/CreateAdminModal.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { errorText } from "../../auth/errorText.js";
import { listAdminUsers } from "../../services/adminUserService.js";

const PAGE_SIZE = 10;
const inputClass =
  "mt-2 w-full border border-white/10 bg-ink px-3 py-2.5 text-sm text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export default function AdminUsers() {
  const { t, language } = useLanguage();
  const { authorizedRequest, hasPermission, session } = useAuth();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 400);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const canRead = hasPermission("users.read");
  const canCreate = hasPermission("users.create_admin");

  const load = useCallback(async () => {
    if (!canRead) {
      setItems([]);
      setMeta(null);
      setError("FORBIDDEN");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const listed = await listAdminUsers(authorizedRequest, {
      q: search,
      role,
      status,
      page,
      limit: PAGE_SIZE,
    });
    if (!listed.ok) {
      setItems([]);
      setMeta(null);
      setError(listed.code);
      setLoading(false);
      if (listed.code === "UNAUTHORIZED") {
        navigate("/admin/login?from=/admin/users", { replace: true });
      }
      return;
    }
    setItems(listed.items);
    setMeta(listed.meta);
    setLoading(false);
  }, [authorizedRequest, canRead, navigate, page, role, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, role, status]);

  const dateFormatter = new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
    dateStyle: "medium",
  });
  const granted = session?.user?.permissions || [];

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.users.title")}
        description={t("admin.users.description")}
      />

      <div className="mx-auto mt-10 max-w-7xl px-6 lg:px-10">
        <section className="border border-white/10 bg-panel/40 p-5">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("admin.users.permissionGuide")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("admin.users.permissionGuideBody")}</p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {PERMISSIONS.map((permission) => (
              <li key={permission} className="border border-white/8 px-4 py-3">
                <p className="text-sm text-ivory">{t(`admin.permissions.${permission}`)}</p>
                <p className="mt-1 text-xs text-muted">{permission}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-gold">
                  {granted.includes(permission) ? t("admin.users.youHave") : t("admin.users.youLack")}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <form
          className="mt-8 grid gap-4 border border-white/10 bg-panel/40 p-5 md:grid-cols-2 lg:grid-cols-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.users.search")}
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              maxLength={80}
              className={inputClass}
              placeholder={t("admin.users.searchPlaceholder")}
            />
          </label>
          <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.users.role")}
            <select value={role} onChange={(event) => setRole(event.target.value)} className={inputClass}>
              <option value="">{t("admin.users.allRoles")}</option>
              {USER_ROLES.map((key) => (
                <option key={key} value={key}>
                  {t(`admin.users.roles.${key}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.users.status")}
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              <option value="">{t("admin.users.allStatuses")}</option>
              {USER_STATUSES.map((key) => (
                <option key={key} value={key}>
                  {t(`admin.users.statuses.${key}`)}
                </option>
              ))}
            </select>
          </label>
          {canCreate ? (
            <div className="flex items-end">
              <Button type="button" className="w-full" onClick={() => setCreateOpen(true)}>
                {t("admin.users.create")}
              </Button>
            </div>
          ) : null}
        </form>

        {error ? (
          <div className="mt-8 border border-gold/40 bg-gold/10 px-4 py-4 text-sm text-ivory" role="alert">
            <p>{errorText(t, "admin", error)}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold hover:text-gold-light"
            >
              {t("admin.retry")}
            </button>
          </div>
        ) : null}

        {loading ? (
          <p className="mt-10 text-sm text-muted" role="status">
            {t("admin.loadingBody")}
          </p>
        ) : !error && items.length === 0 ? (
          <p className="mt-10 border border-white/10 px-4 py-6 text-sm text-muted" role="status">
            {t("admin.users.empty")}
          </p>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="mt-8 overflow-x-auto border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink text-[11px] uppercase tracking-[0.16em] text-gold">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("admin.users.columns.name")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.users.columns.email")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.users.columns.username")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.users.columns.role")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.users.columns.permissions")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.users.columns.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.users.columns.created")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-white/8 text-ivory/90">
                    <td className="px-4 py-4 align-top">
                      <Link
                        to={`/admin/users/${encodeURIComponent(item.id)}`}
                        className="text-gold hover:text-gold-light"
                      >
                        {item.name || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-4 align-top">{item.email || "—"}</td>
                    <td className="px-4 py-4 align-top">{item.username || "—"}</td>
                    <td className="px-4 py-4 align-top">{t(`admin.users.roles.${item.role}`) || item.role}</td>
                    <td className="max-w-xs px-4 py-4 align-top text-xs text-muted">
                      {item.permissions?.length ? item.permissions.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {t(`admin.users.statuses.${item.status}`) || item.status}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {item.createdAt ? dateFormatter.format(new Date(item.createdAt)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {meta && meta.totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-between text-sm text-muted">
            <p>
              {t("admin.inquiries.page")
                .replace("{page}", String(meta.page))
                .replace("{total}", String(meta.totalPages))}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="uppercase tracking-[0.16em] text-gold disabled:opacity-40"
              >
                {t("admin.inquiries.previous")}
              </button>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="uppercase tracking-[0.16em] text-gold disabled:opacity-40"
              >
                {t("admin.inquiries.next")}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <CreateAdminModal
        open={createOpen}
        request={authorizedRequest}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          void load();
        }}
      />
    </section>
  );
}
