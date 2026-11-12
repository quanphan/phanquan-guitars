export const PRIMARY_NAV_LINKS = [
  { to: "/guitars", key: "nav.guitars" },
  { to: "/in-stock", key: "nav.inStock" },
  { to: "/services", key: "nav.services" },
  { to: "/gallery", key: "nav.gallery" },
];

export const INFO_NAV_LINKS = [
  { to: "/build-process", key: "nav.buildProcess" },
  { to: "/about", key: "nav.about" },
  { to: "/contact", key: "nav.contact" },
];

export function isInfoNavPath(pathname) {
  return INFO_NAV_LINKS.some((link) => pathname === link.to || pathname.startsWith(`${link.to}/`));
}
