import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";

export default function AdminIndex() {
  const { hasPermission } = useAuth();
  if (hasPermission("users.read")) {
    return <Navigate to="/admin/users" replace />;
  }
  if (hasPermission("catalog.read")) {
    return <Navigate to="/admin/catalog" replace />;
  }
  return <Navigate to="/admin/inquiries" replace />;
}
