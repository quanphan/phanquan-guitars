import { hoursForLanguage, telHref, whatsappHref } from "../services/brandSettings.js";

const linkClass =
  "text-ivory/80 transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export function socialItems(settings, t) {
  return [
    settings.instagram ? { href: settings.instagram, label: t("brand.channels.instagram") } : null,
    settings.facebook ? { href: settings.facebook, label: t("brand.channels.facebook") } : null,
    settings.youtube ? { href: settings.youtube, label: t("brand.channels.youtube") } : null,
    settings.other ? { href: settings.other, label: t("brand.channels.other") } : null,
  ].filter(Boolean);
}

export function BrandSocialLinks({ settings, t, className = "flex flex-col gap-2 text-sm" }) {
  const items = socialItems(settings, t);
  if (!items.length) return null;
  return (
    <div className={className}>
      {items.map((item) => (
        <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className={linkClass}>
          {item.label}
        </a>
      ))}
    </div>
  );
}

export function BrandWorkshops({ settings, t }) {
  if (!settings.workshops?.length) return null;
  return (
    <div className="space-y-5">
      {settings.workshops.map((workshop, index) => (
        <div key={`${workshop.name || workshop.address}-${index}`}>
          {workshop.name ? (
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{workshop.name}</p>
          ) : (
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{t("brand.workshop")}</p>
          )}
          {workshop.address ? <p className="mt-1 text-sm text-ivory">{workshop.address}</p> : null}
          {workshop.note ? <p className="mt-1 text-sm text-muted">{workshop.note}</p> : null}
          {workshop.mapsUrl ? (
            <a href={workshop.mapsUrl} target="_blank" rel="noreferrer" className={`${linkClass} mt-1 inline-block text-sm`}>
              {t("brand.maps")}
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function BrandHours({ settings, language, t }) {
  const value = hoursForLanguage(settings.hours, language);
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{t("brand.hours")}</p>
      <p className="mt-1 text-sm text-ivory">{value}</p>
    </div>
  );
}

export function BrandDirectContacts({ settings, t }) {
  const items = [];
  if (settings.email) {
    items.push({ href: `mailto:${settings.email}`, label: settings.email, key: "email" });
  }
  if (settings.phone) {
    items.push({ href: telHref(settings.phone), label: settings.phone, key: "phone" });
  }
  const whatsapp = whatsappHref(settings.whatsapp);
  if (whatsapp) {
    items.push({ href: whatsapp, label: settings.whatsapp, key: "whatsapp", external: true });
  }
  if (!items.length) return null;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key}>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{t(`brand.channels.${item.key}`)}</p>
          <a
            href={item.href}
            className={`${linkClass} mt-1 inline-block text-sm text-ivory`}
            {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {item.label}
          </a>
        </div>
      ))}
    </div>
  );
}
