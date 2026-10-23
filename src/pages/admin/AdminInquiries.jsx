import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  deleteAdminInquiry,
  listAdminInquiries,
  loadInquiryStatusCounts,
} from "../../services/adminInquiryService.js";
import { INQUIRY_STATUSES, summarizeConfiguration } from "../../services/inquiryQuery.js";

const PAGE_SIZE = 10;
const inputClass =
  "mt-2 w-full border border-white/10 bg-ink px-3 py-2.5 text-sm text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export default function AdminInquiries() {
  const { t, language } = useLanguage();
  const { authorizedRequest, hasPermission } = useAuth();
  const canDelete = hasPermission("inquiries.delete");
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 400);
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filters = {
    q: search,
    status,
    startDate,
    endDate,
    page,
    limit: PAGE_SIZE,
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const listed = await listAdminInquiries(authorizedRequest, filters);
    const summary = await loadInquiryStatusCounts(authorizedRequest, {
      q: search,
      startDate,
      endDate,
    });
    if (!listed.ok) {
      setItems([]);
      setMeta(null);
      setError(listed.code);
      setLoading(false);
      if (listed.code === "UNAUTHORIZED") navigate("/admin/login?from=/admin/inquiries", { replace: true });
      return;
    }
    setItems(listed.items);
    setMeta(listed.meta);
    setCounts(summary.ok ? summary.counts : null);
    setLoading(false);
  }, [authorizedRequest, endDate, navigate, page, search, startDate, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status, startDate, endDate]);

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    const result = await deleteAdminInquiry(authorizedRequest, pendingDelete.id);
    setDeleting(false);
    if (!result.ok) {
      setError(result.code);
      setPendingDelete(null);
      return;
    }
    setPendingDelete(null);
    await load();
  }

  const dateFormatter = new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.inquiries.title")}
        description={t("admin.inquiries.description")}
      />

      <div className="mx-auto mt-10 max-w-7xl px-6 lg:px-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {INQUIRY_STATUSES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus((current) => (current === key ? "" : key))}
              className={`border px-4 py-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                status === key ? "border-gold bg-gold/10" : "border-white/10 bg-panel/40 hover:border-gold/40"
              }`}
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-gold">
                {t(`admin.status.${key}`)}
              </p>
              <p className="mt-2 font-display text-3xl text-ivory">
                {counts && counts[key] != null ? counts[key] : "—"}
              </p>
            </button>
          ))}
        </div>

        <form
          className="mt-8 grid gap-4 border border-white/10 bg-panel/40 p-5 md:grid-cols-2 lg:grid-cols-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.inquiries.search")}
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              maxLength={80}
              className={inputClass}
              placeholder={t("admin.inquiries.searchPlaceholder")}
            />
          </label>
          <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.inquiries.status")}
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={inputClass}
            >
              <option value="">{t("admin.inquiries.allStatuses")}</option>
              {INQUIRY_STATUSES.map((key) => (
                <option key={key} value={key}>
                  {t(`admin.status.${key}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.inquiries.startDate")}
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            {t("admin.inquiries.endDate")}
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={inputClass}
            />
          </label>
        </form>

        {error ? (
          <div className="mt-8 border border-gold/40 bg-gold/10 px-4 py-4 text-sm text-ivory" role="alert">
            <p>
              {t(`admin.errors.${error}`) === `admin.errors.${error}`
                ? t("admin.errors.failure")
                : t(`admin.errors.${error}`)}
            </p>
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
            {t("admin.inquiries.empty")}
          </p>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="mt-8 overflow-x-auto border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink text-[11px] uppercase tracking-[0.16em] text-gold">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("admin.inquiries.columns.id")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.inquiries.columns.customer")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.inquiries.columns.email")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.inquiries.columns.date")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.inquiries.columns.configuration")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.inquiries.columns.status")}</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">{t("admin.inquiries.columns.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-white/8 text-ivory/90">
                    <td className="px-4 py-4 align-top">
                      <Link
                        to={`/admin/inquiries/${encodeURIComponent(item.id)}`}
                        className="text-gold hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                      >
                        {item.id}
                      </Link>
                    </td>
                    <td className="px-4 py-4 align-top">{item.customer?.name || "—"}</td>
                    <td className="px-4 py-4 align-top">{item.customer?.email || "—"}</td>
                    <td className="px-4 py-4 align-top">
                      {item.createdAt ? dateFormatter.format(new Date(item.createdAt)) : "—"}
                    </td>
                    <td className="max-w-xs px-4 py-4 align-top text-muted">
                      {summarizeConfiguration(item.configuration) || "—"}
                    </td>
                    <td className="px-4 py-4 align-top">{t(`admin.status.${item.status}`) || item.status}</td>
                    <td className="px-4 py-4 align-top">
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(item)}
                          className="text-[11px] uppercase tracking-[0.16em] text-gold hover:text-gold-light"
                        >
                          {t("admin.delete")}
                        </button>
                      ) : null}
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("admin.deleteTitle")}
        body={t("admin.deleteBody")}
        confirmLabel={t("admin.deleteConfirm")}
        cancelLabel={t("admin.cancel")}
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
