import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import brandLogo from "../assets/guitars/logo/Screenshot 2026-10-16 at 15.56.04.png";
import { useCart } from "../cart/CartContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { INFO_NAV_LINKS, PRIMARY_NAV_LINKS, isInfoNavPath } from "../data/nav.js";
import useResumableCustomBuildDraft from "../hooks/useResumableCustomBuildDraft.js";
import AccountMenu from "./AccountMenu.jsx";
import InfoNavMenu from "./InfoNavMenu.jsx";

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
        className={`transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
          language === "vi" ? "text-gold" : "text-ivory/75 hover:text-gold"
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
        className={`transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
          language === "en" ? "text-gold" : "text-ivory/75 hover:text-gold"
        }`}
        aria-pressed={language === "en"}
      >
        EN
      </button>
    </div>
  );
}

function ContinueBuildLink({ className = "", onNavigate, overlay = false, utility = false }) {
  const { t } = useLanguage();
  const location = useLocation();
  const resumable = useResumableCustomBuildDraft();
  if (!resumable || location.pathname === "/custom-build") return null;

  if (utility) {
    return (
      <Link
        to="/custom-build"
        onClick={onNavigate}
        className={`flex h-full min-h-11 w-full items-center justify-center px-1 text-center text-[9px] uppercase leading-tight tracking-[0.12em] text-gold transition-colors duration-300 hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold ${className}`}
      >
        {t("nav.continueBuild")}
      </Link>
    );
  }

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

function CartLink({ className = "", onNavigate, hideWhenEmpty = false }) {
  const { t } = useLanguage();
  const { itemCount } = useCart();
  const slotClass = `inline-flex shrink-0 items-center justify-center ${className}`;

  if (itemCount <= 0) {
    if (hideWhenEmpty) return null;
    return <span className={`${slotClass} pointer-events-none`} aria-hidden="true" />;
  }

  return (
    <NavLink
      to="/cart"
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        `${slotClass} text-ivory/75 transition-colors duration-300 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
          isActive ? "text-gold" : ""
        }`
      }
      aria-label={t("nav.cartWithCount").replace("{count}", String(itemCount))}
    >
      <span className="relative inline-flex">
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        <span className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-gold px-1 text-center text-[10px] leading-4 text-charcoal">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      </span>
    </NavLink>
  );
}

function LogoLink({ onNavigate, centered = false }) {
  return (
    <Link
      to="/"
      className={`group flex min-w-0 shrink items-center gap-1.5 sm:gap-3 ${
        centered ? "justify-center" : ""
      }`}
      onClick={onNavigate}
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
  );
}

function MenuToggleIcon({ open }) {
  return (
    <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
      <span
        className={`h-px w-full bg-current transition-transform duration-300 ${open ? "translate-y-[4px] rotate-45" : ""}`}
      />
      <span
        className={`h-px w-full bg-current transition-opacity duration-300 ${open ? "opacity-0" : "opacity-100"}`}
      />
      <span
        className={`h-px w-full bg-current transition-transform duration-300 ${open ? "-translate-y-[8px] -rotate-45" : ""}`}
      />
    </span>
  );
}

function HamburgerButton({ open, onToggle }) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 items-center justify-center text-ivory transition-colors duration-300 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
      aria-expanded={open}
      aria-controls="mobile-primary-menu"
      onClick={onToggle}
    >
      <span className="sr-only">{t("nav.menu")}</span>
      <MenuToggleIcon open={open} />
    </button>
  );
}

function MobilePrimaryNav({ onNavigate }) {
  const { t } = useLanguage();
  const location = useLocation();
  const [infoOpen, setInfoOpen] = useState(false);
  const infoActive = isInfoNavPath(location.pathname);

  useEffect(() => {
    setInfoOpen(false);
  }, [location.pathname]);

  return (
    <ul className="flex flex-col gap-5">
      {PRIMARY_NAV_LINKS.map((link) => (
        <li key={link.to}>
          <NavLink
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `text-sm uppercase tracking-[0.22em] transition-colors duration-300 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                isActive ? "text-gold" : "text-ivory/80"
              }`
            }
          >
            {t(link.key)}
          </NavLink>
        </li>
      ))}
      <li>
        <a
          href="#"
          className={`text-sm uppercase tracking-[0.22em] transition-colors duration-300 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
            infoActive ? "text-gold" : "text-ivory/80"
          }`}
          aria-expanded={infoOpen}
          aria-controls="mobile-info-menu"
          onClick={(event) => {
            event.preventDefault();
            setInfoOpen((value) => !value);
          }}
        >
          {t("nav.info")}
        </a>
        {infoOpen ? (
          <ul id="mobile-info-menu" className="mt-3 flex flex-col gap-1 border-l border-gold/30 pl-4">
            {INFO_NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center text-sm uppercase tracking-[0.18em] transition-colors duration-300 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                      isActive ? "text-gold" : "text-ivory/75"
                    }`
                  }
                >
                  {t(link.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        ) : null}
      </li>
    </ul>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const location = useLocation();
  const closeMenu = () => setOpen(false);
  const toggleMenu = () => setOpen((value) => !value);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-white/5 bg-charcoal/85 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
      <div className="relative z-[52] md:hidden">
        <div className="flex justify-center px-3 py-2.5">
          <LogoLink onNavigate={closeMenu} centered />
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-between bg-white/10 px-4 text-ivory transition-colors duration-300 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold"
          aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
          aria-expanded={open}
          aria-controls="mobile-primary-menu"
          onClick={toggleMenu}
        >
          <span className="font-display text-[22px] leading-none">{t("nav.navigation")}</span>
          <span className="inline-flex h-10 w-10 items-center justify-center">
            <MenuToggleIcon open={open} />
          </span>
        </button>

        <div className="grid grid-flow-col auto-cols-fr divide-x divide-white/15 border-t border-white/10">
          <LanguageSwitcher className="h-11 justify-center gap-1.5 text-[10px] tracking-[0.14em] [&_button]:min-h-11 [&_button]:px-1" />
          <ContinueBuildLink utility onNavigate={closeMenu} />
          <CartLink
            className="h-11 w-full"
            onNavigate={closeMenu}
            hideWhenEmpty
          />
          <AccountMenu
            className="w-full"
            buttonClassName="h-11 w-full"
            iconSize={20}
            onOpen={closeMenu}
            closeToken={open}
          />
        </div>
      </div>

      <div className="relative z-[52] mx-auto hidden w-full min-w-0 max-w-7xl flex-nowrap items-center justify-between gap-2 px-3 py-3 sm:px-6 md:flex lg:gap-8 lg:px-10 lg:py-4">
        <LogoLink onNavigate={closeMenu} />

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
          <InfoNavMenu />
          <ContinueBuildLink />
          <AccountMenu />
          <CartLink className="h-11 w-11" />
          <LanguageSwitcher />
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2.5 lg:hidden">
          <LanguageSwitcher className="gap-0.5 text-[10px] tracking-[0.08em] [&_button]:min-h-9 [&_button]:px-0.5 sm:[&_button]:min-h-10" />
          <CartLink className="h-9 w-9 sm:h-10 sm:w-10" onNavigate={closeMenu} />
          <AccountMenu
            buttonClassName="h-9 w-9 sm:h-10 sm:w-10"
            iconSize={20}
            onOpen={closeMenu}
            closeToken={open}
          />
          <HamburgerButton open={open} onToggle={toggleMenu} />
        </div>
      </div>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          aria-label={t("nav.closeMenu")}
          onClick={closeMenu}
        />
      ) : null}

      <div
        className={`grid lg:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"} transition-[grid-template-rows] duration-300 ease-out`}
      >
        <div className="overflow-hidden">
          <nav
            id="mobile-primary-menu"
            className="relative z-[52] max-h-[min(70dvh,28rem)] overflow-y-auto border-t border-white/5 bg-ink px-6 py-6"
            aria-label="Mobile"
            aria-hidden={!open}
            inert={!open ? true : undefined}
          >
            <MobilePrimaryNav onNavigate={closeMenu} />
          </nav>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-full z-[51] hidden justify-end px-3 sm:px-6 md:flex lg:hidden">
        <ContinueBuildLink overlay className="pointer-events-auto" onNavigate={closeMenu} />
      </div>
    </header>
  );
}
