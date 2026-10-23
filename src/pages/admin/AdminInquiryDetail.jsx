import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import Button from "../../components/Button.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  deleteAdminInquiry,
  getAdminInquiry,
  updateAdminInquiryStatus,
} from "../../services/adminInquiryService.js";
import { buildInquiryDisplay, phoneHref } from "../../services/inquiryDisplay.js";
import { INQUIRY_STATUSES } from "../../services/inquiryQuery.js";

const STATUS_BADGE = {
  new: "border-gold bg-gold/15 text-gold",
  ready_to_build: "border-gold/70 bg-gold/10 text-gold-light",
  building: "border-ivory/30 bg-ivory/5 text-ivory",
  completed: "border-gold bg-gold text-charcoal",
  cancelled: "border-white/20 bg-white/5 text-muted",
};

export default function AdminInquiryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { authorizedRequest, hasPermission } = useAuth();
  const canUpdateStatus = hasPermission("inquiries.update_status");
  const canDelete = hasPermission("inquiries.delete");
  const [inquiry, setInquiry] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const busy = saving || deleting;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getAdminInquiry(authorizedRequest, id);
    if (!result.ok) {
      setInquiry(null);
      setError(result.code);
      setLoading(false);
      if (result.code === "UNAUTHORIZED") {
        navigate(`/admin/login?from=${encodeURIComponent(`/admin/inquiries/${id}`)}`, {
          replace: true,
        });
      }
      return;
    }
    setInquiry(result.inquiry);
    setStatus(result.inquiry.status);
    setLoading(false);
  }, [authorizedRequest, id, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveStatus(event) {
    event.preventDefault();
    if (!inquiry || busy || status === inquiry.status) return;
    setSaving(true);
    setError(null);
    const result = await updateAdminInquiryStatus(authorizedRequest, inquiry.id, status);
    setSaving(false);
    if (!result.ok) {
      setError(result.code);
      setStatus(inquiry.status);
      return;
    }
    setInquiry(result.inquiry);
    setStatus(result.inquiry.status);
  }

  async function confirmDelete() {
    if (!inquiry || busy) return;
    setDeleting(true);
    const result = await deleteAdminInquiry(authorizedRequest, inquiry.id);
    setDeleting(false);
    if (!result.ok) {
      setError(result.code);
      setPendingDelete(false);
      return;
    }
    navigate("/admin/inquiries", { replace: true });
  }

  const dateFormatter = new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const display = inquiry ? buildInquiryDisplay(inquiry, t) : null;
  const notProvided = t("admin.detail.notProvided");
  const submitted = inquiry?.createdAt ? dateFormatter.format(new Date(inquiry.createdAt)) : null;
  const phoneLink = phoneHref(inquiry?.customer?.phone);

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.detail.title")}
        description={t("admin.detail.description")}
      >
        <Link
          to="/admin/inquiries"
          className="mt-8 inline-flex text-[11px] uppercase tracking-[0.22em] text-gold hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {t("admin.detail.back")}
        </Link>
      </PageHeader>

      <div className="mx-auto mt-10 max-w-6xl px-6 lg:px-10">
        {error ? (
          <div className="mb-8 border border-gold/40 bg-gold/10 px-4 py-4 text-sm text-ivory" role="alert">
            <p>
              {t(`admin.errors.${error}`) === `admin.errors.${error}`
                ? t("admin.errors.failure")
                : t(`admin.errors.${error}`)}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold"
            >
              {t("admin.retry")}
            </button>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted" role="status">
            {t("admin.loadingBody")}
          </p>
        ) : null}

        {!loading && inquiry ? (
          <div className="space-y-8">
            <section className="border border-white/10 bg-panel/40 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
                    {t("admin.detail.inquiryId")}
                  </p>
                  <h2 className="mt-2 font-display text-3xl tracking-wide text-ivory">{inquiry.id}</h2>
                  <p className="mt-2 text-sm text-muted">
                    {submitted || notProvided}
                  </p>
                </div>
                <StatusBadge status={inquiry.status} label={t(`admin.status.${inquiry.status}`)} />
              </div>

              <dl className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-2">
                <InfoRow label={t("admin.detail.name")} value={inquiry.customer?.name} empty={notProvided} />
                <InfoRow
                  label={t("admin.detail.email")}
                  value={inquiry.customer?.email}
                  empty={notProvided}
                  href={inquiry.customer?.email ? `mailto:${inquiry.customer.email}` : null}
                />
                <InfoRow
                  label={t("admin.detail.phone")}
                  value={inquiry.customer?.phone}
                  empty={notProvided}
                  href={phoneLink}
                />
                <InfoRow
                  label={t("admin.detail.country")}
                  value={display?.metadata.country}
                  empty={notProvided}
                />
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                {inquiry.customer?.email ? (
                  <a
                    href={`mailto:${inquiry.customer.email}`}
                    className="inline-flex items-center border border-gold bg-gold px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    {t("admin.detail.emailAction")}
                  </a>
                ) : null}
                {phoneLink ? (
                  <a
                    href={phoneLink}
                    className="inline-flex items-center border border-gold/70 px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    {t("admin.detail.callAction")}
                  </a>
                ) : null}
              </div>
            </section>

            <form
              onSubmit={saveStatus}
              className="flex flex-col gap-4 border border-white/10 bg-panel/40 p-5 sm:flex-row sm:items-end"
            >
              <label className="block flex-1 text-[11px] uppercase tracking-[0.18em] text-gold">
                {t("admin.inquiries.status")}
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  disabled={busy || !canUpdateStatus}
                  className="mt-2 w-full border border-white/10 bg-ink px-3 py-2.5 text-sm text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {INQUIRY_STATUSES.map((key) => (
                    <option key={key} value={key}>
                      {t(`admin.status.${key}`)}
                    </option>
                  ))}
                </select>
              </label>
              {canUpdateStatus ? (
                <Button type="submit" disabled={busy || status === inquiry.status}>
                  {saving ? t("admin.detail.saving") : t("admin.detail.saveStatus")}
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setPendingDelete(true)}
                >
                  {t("admin.delete")}
                </Button>
              ) : null}
            </form>

            <section className="border border-white/10 bg-panel/40 p-5 sm:p-6">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">
                {t("admin.detail.message")}
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ivory/90">
                {inquiry.message?.trim() ? inquiry.message : t("admin.detail.noMessage")}
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">
                {t("admin.detail.configuration")}
              </h2>
              {!display?.hasConfiguration ? (
                <p className="mt-4 border border-white/10 px-4 py-5 text-sm text-muted">
                  {t("admin.detail.noConfiguration")}
                </p>
              ) : (
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {display.groups.map((group) => (
                    <article key={group.id} className="border border-white/10 bg-panel/40 p-5">
                      <h3 className="text-[11px] uppercase tracking-[0.22em] text-gold">
                        {t(group.titleKey)}
                      </h3>
                      <dl className="mt-4">
                        {group.rows.map((item) => (
                          <InfoRow
                            key={item.labelKey}
                            label={t(item.labelKey)}
                            value={item.value}
                            empty={notProvided}
                            compact
                          />
                        ))}
                      </dl>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <details className="border border-white/10 bg-ink/40 p-5">
              <summary className="cursor-pointer text-[11px] uppercase tracking-[0.22em] text-gold">
                {t("admin.detail.metadata")}
              </summary>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <InfoRow label={t("admin.detail.draftId")} value={display?.metadata.draftId} empty={notProvided} />
                <InfoRow
                  label={t("admin.detail.formLanguage")}
                  value={display?.metadata.languageLabel}
                  empty={notProvided}
                />
                <InfoRow
                  label={t("admin.detail.inquiryType")}
                  value={display?.metadata.inquiryTypeLabel || display?.metadata.inquiryType}
                  empty={notProvided}
                />
                <InfoRow label={t("admin.detail.subject")} value={display?.metadata.subject} empty={notProvided} />
                <InfoRow
                  label={t("admin.detail.productRef")}
                  value={display?.metadata.productRef}
                  empty={notProvided}
                />
                <InfoRow label={t("admin.detail.productId")} value={display?.metadata.productId} empty={notProvided} />
                <InfoRow label={t("admin.detail.country")} value={display?.metadata.country} empty={notProvided} />
              </dl>
            </details>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={pendingDelete}
        title={t("admin.deleteTitle")}
        body={t("admin.deleteBody")}
        confirmLabel={t("admin.deleteConfirm")}
        cancelLabel={t("admin.cancel")}
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(false);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}

function StatusBadge({ status, label }) {
  return (
    <span
      className={`inline-flex border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] ${
        STATUS_BADGE[status] || STATUS_BADGE.new
      }`}
    >
      {label}
    </span>
  );
}

function InfoRow({ label, value, empty, href, compact = false }) {
  const display = value == null || String(value).trim() === "" ? empty : value;
  const missing = display === empty;
  return (
    <div
      className={
        compact
          ? "grid gap-1 border-b border-white/8 py-2.5 last:border-b-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline"
          : "grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-baseline"
      }
    >
      <dt className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className={missing ? "text-sm text-muted" : "text-sm text-ivory"}>
        {href && !missing ? (
          <a
            href={href}
            className="text-gold transition-colors hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            {display}
          </a>
        ) : (
          display
        )}
      </dd>
    </div>
  );
}
