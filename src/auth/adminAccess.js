export function isAdminRole(role) {
  return role === "admin" || role === "superadmin";
}

export function resolveAdminView({ pathname, session }) {
  const path = pathname || "/";
  const isAdminPath =
    path === "/admin" || path.startsWith("/admin/");
  if (!isAdminPath) return { view: "public", redirectTo: null };

  const isLogin = path === "/admin/login";
  const role = session?.user?.role;
  const authenticated = Boolean(session?.accessToken);
  const admin = authenticated && isAdminRole(role);

  if (isLogin) {
    if (admin) {
      return { view: "redirect", redirectTo: "/admin" };
    }
    return { view: "login", redirectTo: null };
  }

  if (!authenticated) {
    const search = path && path !== "/admin/login" ? `?from=${encodeURIComponent(path)}` : "";
    return { view: "redirect", redirectTo: `/admin/login${search}` };
  }

  if (!admin) {
    return { view: "forbidden", redirectTo: null };
  }

  return { view: "allow", redirectTo: null };
}

export function safeAdminRedirect(from) {
  if (typeof from !== "string" || !from.startsWith("/admin")) return "/admin";
  if (from === "/admin/login") return "/admin";
  if (from.includes("//") || from.includes("\\")) return "/admin";
  return from;
}
