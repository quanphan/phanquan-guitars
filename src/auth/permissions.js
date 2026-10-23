export const PERMISSIONS = [
  "users.read",
  "users.create_admin",
  "users.update_role",
  "users.update_status",
  "inquiries.read",
  "inquiries.update_status",
  "inquiries.delete",
  "catalog.read",
  "catalog.write",
  "catalog.delete",
  "uploads.write",
];

export const SUPERADMIN_ONLY = [
  "users.create_admin",
  "users.update_role",
  "users.update_status",
];

export const ADMIN_ASSIGNABLE = PERMISSIONS.filter(
  (permission) => !SUPERADMIN_ONLY.includes(permission),
);

export function userHasPermission(user, permission) {
  return Boolean(user && Array.isArray(user.permissions) && user.permissions.includes(permission));
}

export function canChangeTarget(actor, target) {
  if (!actor || !target) return false;
  if (target.role === "superadmin") return false;
  if (actor.id && target.id && actor.id === target.id) return false;
  return true;
}
