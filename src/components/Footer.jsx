import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  BrandHours,
  BrandSocialLinks,
  BrandWorkshops,
} from "../brand/BrandPublicContacts.jsx";
import { usePublicBrandSettings } from "../brand/BrandSettingsContext.jsx";
import { footerLinkLocale, mergePublicFooterLinks } from "../data/footerQuickLinks.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { telHref, whatsappHref } from "../services/brandSettings.js";
import { listPublicFooterQuickLinks } from "../services/footerQuickLinkService.js";

const linkClass = "transition-colors hover:text-gold";
const FALLBACK_PHONE = "+84 903083489";

function FooterQuickLink({ link, language, t }) {
  const locale = footerLinkLocale(link, language);
  const label = locale.title || (link.titleKey ? t(link.titleKey) : link.title || link.url);
  const className = linkClass;
  if (link.linkType === "external") {
    return (
      <a
        href={link.url}
        className={className}
        target={link.openInNewTab ? "_blank" : undefined}
        rel={link.openInNewTab ? "noreferrer" : undefined}
      >
        {label}
      </a>
    );
  }
  return (
    <Link to={link.url} className={className}>
      {label}
    </Link>
  );
}

export default function Footer() {
  const { t, language } = useLanguage();
  const { settings } = usePublicBrandSettings();
  const phone = settings.phone || FALLBACK_PHONE;
  const [quickLinks, setQuickLinks] = useState(() => mergePublicFooterLinks([]));

  useEffect(() => {
    let cancelled = false;
    listPublicFooterQuickLinks().then((result) => {
      if (cancelled) return;
      setQuickLinks(mergePublicFooterLinks(result.ok ? result.items : []));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="border-t border-white/5 bg-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-3 lg:items-start lg:px-10">
        <div>
          <p className="font-display text-2xl tracking-[0.12em] text-ivory">
            PhanQuan Guitars
          </p>
          <p className="mt-3 text-sm text-muted">{t("footer.handmade")}</p>
          {settings.workshops?.length ? (
            <div className="mt-6 max-w-xs">
              <BrandWorkshops settings={settings} t={t} />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-5 text-sm text-ivory/75">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{t("brand.channels.phone")}</p>
            <a className={`${linkClass} mt-1 inline-block text-ivory`} href={telHref(phone)}>
              {phone}
            </a>
          </div>
          {settings.email ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{t("brand.channels.email")}</p>
              <a className={`${linkClass} mt-1 inline-block text-ivory`} href={`mailto:${settings.email}`}>
                {settings.email}
              </a>
            </div>
          ) : null}
          {settings.whatsapp ? (
            <a className={linkClass} href={whatsappHref(settings.whatsapp)} target="_blank" rel="noreferrer">
              {t("brand.channels.whatsapp")}
            </a>
          ) : null}
          <BrandSocialLinks settings={settings} t={t} className="flex flex-col gap-3" />
          <BrandHours settings={settings} language={language} t={t} />
        </div>

        <div className="text-sm text-muted">
          {quickLinks.map((link, index) => {
            const item = (
              <FooterQuickLink
                key={link.id || `${link.url}-${index}`}
                link={link}
                language={language}
                t={t}
              />
            );
            return index === 0 ? item : (
              <p key={link.id || `${link.url}-${index}`} className="mt-3">
                <FooterQuickLink link={link} language={language} t={t} />
              </p>
            );
          })}
          <p className="mt-6">
            © {new Date().getFullYear()} PhanQuan Guitars. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
