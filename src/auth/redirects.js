export function safeAppRedirect(from, fallback = "/account") {
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//")) {
    return fallback;
  }
  if (from.includes("\\") || from.includes("://")) return fallback;
  if (from === "/login" || from === "/register" || from.startsWith("/login?") || from.startsWith("/register?")) {
    return fallback;
  }
  return from;
}

export function postLoginPath(from, isAdmin) {
  const fallback = isAdmin ? "/admin" : "/account";
  const next = safeAppRedirect(from, fallback);
  if (next.startsWith("/admin") && !isAdmin) return "/account";
  if (isAdmin && !next.startsWith("/admin")) return "/admin";
  return next;
}
