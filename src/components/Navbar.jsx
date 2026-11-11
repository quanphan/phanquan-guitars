import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import brandLogo from "../assets/guitars/logo/Screenshot 2026-10-16 at 15.56.04.png";
import { useCart } from "../cart/CartContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { PRIMARY_NAV_LINKS } from "../data/nav.js";
import useResumableCustomBuildDraft from "../hooks/useResumableCustomBuildDraft.js";
import AccountMenu from "./AccountMenu.jsx";

function LanguageSwitcher({ className = "" }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] ${className}`}
      role="group"
      aria-label={t("nav.language")}
    >
      <button
        type="button"
        onClick={() => setLanguage("vi")}
        className={`transition-colors duration-300 ${
          language === "vi" ? "text-gold" : "text-ivory/75 hover:text-ivory"
        }`}
        aria-pressed={language === "vi"}
      >
        VI
      </button>
      <span className="text-ivory/35" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`transition-colors duration-300 ${
          language === "en" ? "text-gold" : "text-ivory/75 hover:text-ivory"
        }`}
        aria-pressed={language === "en"}
      >
        EN
      </button>
    </div>
  );
}

function ContinueBuildLink({ className = "", onNavigate, overlay = false }) {
  const { t } = useLanguage();
  const location = useLocation();
  const resumable = useResumableCustomBuildDraft();
  if (!resumable || location.pathname === "/custom-build") return null;

  if (overlay) {
    return (
      <Link
        to="/custom-build"
        onClick={onNavigate}
        className={`inline-flex max-w-full items-center gap-1 whitespace-nowrap bg-transparent py-1.5 pl-3 pr-0 text-[10px] uppercase tracking-[0.16em] text-gold transition-colors duration-300 hover:text-gold-light ${className}`}
      >
        {t("nav.continueBuild")}
        <ArrowRight className="size-3 shrink-0" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link
      to="/custom-build"
      onClick={onNavigate}
      className={`inline-flex items-center border border-gold/70 bg-transparent px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-gold transition-colors duration-300 hover:bg-gold/10 hover:text-gold-light sm:text-[11px] ${className}`}
    >
      {t("nav.continueBuild")}
    </Link>
  );
}

function CartLink({ className = "", onNavigate }) {
  const { t } = useLanguage();
  const { itemCount } = useCart();
  const slotClass = `relative inline-flex shrink-0 items-center justify-center ${className}`;

  if (itemCount <= 0) {
    return <span className={`${slotClass} pointer-events-none`} aria-hidden="true" />;
  }

  return (
    <NavLink
      to="/cart"
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        `${slotClass} text-ivory/75 transition-colors duration-300 hover:text-ivory ${
          isActive ? "text-gold" : ""
        }`
      }
      aria-label={t("nav.cartWithCount").replace("{count}", String(itemCount))}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-gold px-1 text-center text-[10px] leading-4 text-charcoal sm:right-1 sm:top-1">
        {itemCount > 99 ? "99+" : itemCount}
      </span>
    </NavLink>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-white/5 bg-charcoal/85 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-nowrap items-center justify-between gap-2 px-3 py-3 sm:px-6 lg:gap-8 lg:px-10 lg:py-4">
        <Link
          to="/"
          className="group flex min-w-0 shrink items-center gap-1.5 sm:gap-3"
          onClick={closeMenu}
        >
          <img
            src={brandLogo}
            alt=""
            aria-hidden="true"
            className="h-8 w-auto shrink-0 object-contain max-[360px]:h-7 sm:h-10 lg:h-11"
          />
          <span className="min-w-0">
            <span className="block truncate font-display text-base tracking-[0.08em] text-ivory max-[360px]:text-[15px] sm:text-xl sm:tracking-[0.14em] lg:text-2xl">
              PhanQuan
            </span>
            <span className="block text-[9px] uppercase tracking-[0.22em] text-gold transition-colors group-hover:text-gold-light sm:text-[10px] sm:tracking-[0.42em]">
              Guitars
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {PRIMARY_NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 ${
                  isActive ? "text-gold" : "text-ivory/75 hover:text-ivory"
                }`
              }
            >
              {t(link.key)}
            </NavLink>
          ))}
          <ContinueBuildLink />
          <AccountMenu />
          <CartLink className="h-11 w-11" />
          <LanguageSwitcher />
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 max-[360px]:gap-0 sm:gap-2.5 lg:hidden">
          <LanguageSwitcher className="gap-0.5 text-[10px] tracking-[0.08em] [&_button]:min-h-9 [&_button]:px-0.5 sm:[&_button]:min-h-10" />
          <CartLink className="h-9 w-9 sm:h-10 sm:w-10" onNavigate={closeMenu} />
          <AccountMenu
            buttonClassName="h-9 w-9 sm:h-10 sm:w-10"
            iconSize={20}
            onOpen={closeMenu}
          />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center text-ivory sm:h-10 sm:w-10"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{t("nav.menu")}</span>
            <span className="flex w-5 flex-col gap-1.5">
              <span
                className={`h-px w-full bg-ivory transition-transform duration-300 ${open ? "translate-y-[4px] rotate-45" : ""}`}
              />
              <span
                className={`h-px w-full bg-ivory transition-opacity duration-300 ${open ? "opacity-0" : "opacity-100"}`}
              />
              <span
                className={`h-px w-full bg-ivory transition-transform duration-300 ${open ? "-translate-y-[8px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <nav
          className="border-t border-white/5 bg-ink px-6 py-6 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-5">
            {PRIMARY_NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `text-sm uppercase tracking-[0.22em] ${
                      isActive ? "text-gold" : "text-ivory/80"
                    }`
                  }
                >
                  {t(link.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 top-full z-[51] flex justify-end px-3 sm:px-6 lg:hidden">
        <ContinueBuildLink overlay className="pointer-events-auto" onNavigate={closeMenu} />
      </div>
    </header>
  );
}
