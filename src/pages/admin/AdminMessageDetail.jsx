import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { getAdminMessage } from "../../services/adminMessageService.js";
import { phoneHref } from "../../services/inquiryDisplay.js";

export default function AdminMessageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { authorizedRequest } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getAdminMessage(authorizedRequest, id);
    if (!result.ok) {
      setItem(null);
      setError(result.code);
      setLoading(false);
      if (result.code === "UNAUTHORIZED") {
        navigate(`/admin/login?from=${encodeURIComponent(`/admin/messages/${id}`)}`, {
          replace: true,
        });
      }
      return;
    }
    setItem(result.message);
    setLoading(false);
  }, [authorizedRequest, id, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const dateFormatter = new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const notProvided = t("admin.detail.notProvided");
  const submitted = item?.createdAt ? dateFormatter.format(new Date(item.createdAt)) : null;
  const phoneLink = phoneHref(item?.phone);
  const typeLabel = item?.inquiryType
    ? t(`contact.types.${item.inquiryType}.title`)
    : "";
  const typeText = typeLabel && typeLabel !== `contact.types.${item?.inquiryType}.title`
    ? typeLabel
    : item?.inquiryType;

  return (
    <section className="pb-24">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.messages.detail.title")}
        description={t("admin.messages.detail.description")}
      >
        <Link
          to="/admin/messages"
          className="mt-8 inline-flex text-[11px] uppercase tracking-[0.22em] text-gold hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {t("admin.messages.detail.back")}
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

        {!loading && item ? (
          <section className="border border-white/10 bg-panel/40 p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
              {t("admin.detail.submitted")}
            </p>
            <p className="mt-2 text-sm text-muted">{submitted || notProvided}</p>
            <dl className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              <InfoRow label={t("admin.detail.name")} value={item.name} empty={notProvided} />
              <InfoRow
                label={t("admin.detail.email")}
                value={item.email}
                empty={notProvided}
                href={item.email ? `mailto:${item.email}` : null}
              />
              <InfoRow label={t("admin.detail.phone")} value={item.phone} empty={notProvided} href={phoneLink} />
              <InfoRow label={t("admin.detail.inquiryType")} value={typeText} empty={notProvided} />
              <InfoRow label={t("admin.detail.subject")} value={item.subject} empty={notProvided} />
              <InfoRow label={t("admin.detail.productRef")} value={item.productRef} empty={notProvided} />
              <InfoRow label={t("admin.detail.productId")} value={item.productId} empty={notProvided} />
              <InfoRow label={t("admin.detail.draftId")} value={item.draftId} empty={notProvided} />
            </dl>
            <div className="mt-8">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">
                {t("admin.detail.message")}
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm text-ivory">
                {item.message || t("admin.detail.noMessage")}
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

function InfoRow({ label, value, empty, href }) {
  const display = value == null || String(value).trim() === "" ? empty : value;
  const missing = display === empty;
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-baseline">
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
