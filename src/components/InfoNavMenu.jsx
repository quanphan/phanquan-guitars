import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { INFO_NAV_LINKS, isInfoNavPath } from "../data/nav.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function InfoNavMenu() {
  const { t } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const closeTimer = useRef(null);
  const menuId = useId();
  const active = isInfoNavPath(location.pathname);

  function clearClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openMenu() {
    clearClose();
    setOpen(true);
  }

  function closeMenu() {
    clearClose();
    setOpen(false);
  }

  function scheduleClose() {
    clearClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  }

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) closeMenu();
    }
    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        rootRef.current?.querySelector("a[aria-haspopup]")?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => () => clearClose(), []);

  return (
    <div
      ref={rootRef}
      className="relative inline-flex items-center"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) scheduleClose();
      }}
    >
      <a
        href="#"
        className={`text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 ${
          active ? "text-gold" : "text-ivory/75 hover:text-ivory"
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={(event) => {
          event.preventDefault();
          if (open) closeMenu();
          else openMenu();
        }}
      >
        {t("nav.info")}
      </a>
      {open ? (
        <div className="absolute left-1/2 top-full z-[60] pt-3 -translate-x-1/2">
          <div
            id={menuId}
            role="menu"
            aria-label={t("nav.info")}
            className="relative min-w-[16rem] bg-ivory px-2 py-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
          >
            <span
              className="pointer-events-none absolute -top-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent border-b-ivory drop-shadow-[0_-1px_1px_rgba(0,0,0,0.06)]"
              aria-hidden="true"
            />
            <ul className="relative flex flex-col">
              {INFO_NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    role="menuitem"
                    to={link.to}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `block px-8 py-4 text-left text-[12px] uppercase tracking-[0.18em] text-[#1e3a5f] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold ${
                        isActive
                          ? "bg-[#1e3a5f]/8 font-medium"
                          : "hover:bg-[#1e3a5f]/6 hover:text-[#12263f]"
                      }`
                    }
                  >
                    {t(link.key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
