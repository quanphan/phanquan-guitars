import { Link } from "react-router-dom";
import {
  BrandHours,
  BrandSocialLinks,
  BrandWorkshops,
} from "../brand/BrandPublicContacts.jsx";
import { usePublicBrandSettings } from "../brand/BrandSettingsContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { telHref, whatsappHref } from "../services/brandSettings.js";

const linkClass = "transition-colors hover:text-gold";
const FALLBACK_PHONE = "+84 903083489";

export default function Footer() {
  const { t, language } = useLanguage();
  const { settings } = usePublicBrandSettings();
  const phone = settings.phone || FALLBACK_PHONE;

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
          <Link to="/custom-build" className="transition-colors hover:text-gold">
            {t("footer.startBuild")}
          </Link>
          <p className="mt-3">
            <Link to="/contact" className="transition-colors hover:text-gold">
              {t("footer.contact")}
            </Link>
          </p>
          <p className="mt-6">
            © {new Date().getFullYear()} PhanQuan Guitars. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
