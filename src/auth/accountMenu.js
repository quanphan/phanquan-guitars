export function accountMenuLinks({ isAuthenticated, isAdmin }) {
  if (isAuthenticated) {
    const links = [{ to: "/account", key: "nav.myAccount" }];
    if (isAdmin) links.push({ to: "/admin", key: "nav.adminAccess" });
    return links;
  }
  return [
    { to: "/login", key: "nav.login" },
    { to: "/register", key: "nav.register" },
  ];
}
