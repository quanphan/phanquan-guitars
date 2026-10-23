import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import brandLogo from "../assets/guitars/logo/Screenshot 2026-10-16 at 15.56.04.png";
import { useAuth } from "../auth/AuthContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { accountMenuLinks } from "../auth/accountMenu.js";
import AccountMenu from "./AccountMenu.jsx";

const links = [
  { to: "/guitars", key: "nav.guitars" },
  { to: "/in-stock", key: "nav.inStock" },
  { to: "/gallery", key: "nav.gallery" },
  { to: "/build-process", key: "nav.buildProcess" },
  { to: "/about", key: "nav.about" },
  { to: "/contact", key: "nav.contact" },
];

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

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const { isAdmin, isAuthenticated, logout } = useAuth();
  const menuLinks = accountMenuLinks({ isAuthenticated, isAdmin });

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-charcoal/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link
          to="/"
          className="group flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <img
            src={brandLogo}
            alt=""
            aria-hidden="true"
            className="h-10 w-auto shrink-0 object-contain sm:h-11"
          />
          <span>
            <span className="block font-display text-xl tracking-[0.14em] text-ivory sm:text-2xl">
              PhanQuan
            </span>
            <span className="block text-[10px] uppercase tracking-[0.42em] text-gold transition-colors group-hover:text-gold-light">
              Guitars
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {links.map((link) => (
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
          <AccountMenu />
          <LanguageSwitcher />
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center text-ivory lg:hidden"
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

      {open ? (
        <nav
          className="border-t border-white/5 bg-ink px-6 py-6 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-5">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setOpen(false)}
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
            {menuLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `text-sm uppercase tracking-[0.22em] ${isActive ? "text-gold" : "text-ivory/80"}`
                  }
                >
                  {t(link.key)}
                </NavLink>
              </li>
            ))}
            {isAuthenticated ? (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void logout();
                  }}
                  className="text-sm uppercase tracking-[0.22em] text-ivory/80"
                >
                  {t("nav.logout")}
                </button>
              </li>
            ) : null}
            <li>
              <LanguageSwitcher />
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
