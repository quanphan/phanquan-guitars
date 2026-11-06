import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";

const FALLBACKS = [
  ["users.read", "/admin/users"],
  ["catalog.read", "/admin/catalog"],
  ["customBuild.read", "/admin/custom-build-setup"],
  ["inquiries.read", "/admin/inquiries"],
  ["messages.read", "/admin/messages"],
  ["pages.read", "/admin/page-content"],
  ["services.read", "/admin/services"],
  ["brand.read", "/admin/settings/brand"],
  ["footerLinks.read", "/admin/settings/footer-links"],
];

export default function AdminIndex() {
  const { hasPermission } = useAuth();
  const next = FALLBACKS.find(([permission]) => hasPermission(permission));
  return <Navigate to={next ? next[1] : "/admin/inquiries"} replace />;
}
