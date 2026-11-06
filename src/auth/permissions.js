export const PERMISSION_GROUPS = [
  { id: "users", keys: ["users.read", "users.create", "users.update", "users.delete"] },
  { id: "catalog", keys: ["catalog.read", "catalog.create", "catalog.update", "catalog.delete"] },
  { id: "customBuild", keys: ["customBuild.read", "customBuild.manage_options"] },
  { id: "enquiry", keys: ["inquiries.read", "inquiries.update_status", "inquiries.delete"] },
  { id: "messages", keys: ["messages.read", "messages.update", "messages.delete"] },
  { id: "brand", keys: ["brand.read", "brand.update"] },
  { id: "footerLinks", keys: ["footerLinks.read", "footerLinks.create", "footerLinks.update", "footerLinks.delete"] },
  { id: "pages", keys: ["pages.read", "pages.update", "pages.publish"] },
  { id: "services", keys: ["services.read", "services.create", "services.update", "services.delete"] },
  { id: "uploads", keys: ["uploads.upload", "uploads.delete"] },
  { id: "roles", keys: ["roles.read", "roles.update"] },
];

const LEGACY_PERMISSIONS = [
  "users.create_admin",
  "users.update_role",
  "users.update_status",
  "catalog.write",
  "uploads.write",
];

export const CANONICAL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) => group.keys);

export const PERMISSIONS = [...new Set([...CANONICAL_PERMISSIONS, ...LEGACY_PERMISSIONS])];

export const SUPERADMIN_ONLY = [
  "users.create",
  "users.create_admin",
  "users.update",
  "users.update_status",
  "users.delete",
  "roles.read",
  "roles.update",
  "users.update_role",
];

const SATISFIED_BY = {
  "catalog.create": ["catalog.create", "catalog.write"],
  "catalog.update": ["catalog.update", "catalog.write"],
  "catalog.write": ["catalog.write", "catalog.create", "catalog.update"],
  "users.create": ["users.create", "users.create_admin"],
  "users.create_admin": ["users.create_admin", "users.create"],
  "users.update": ["users.update", "users.update_status"],
  "users.update_status": ["users.update_status", "users.update"],
  "users.delete": ["users.delete", "users.update_status"],
  "roles.update": ["roles.update", "users.update_role"],
  "users.update_role": ["users.update_role", "roles.update"],
  "roles.read": ["roles.read", "users.update_role", "users.read"],
  "uploads.upload": ["uploads.upload", "uploads.write"],
  "uploads.write": ["uploads.write", "uploads.upload"],
  "uploads.delete": ["uploads.delete", "uploads.write"],
  "services.read": ["services.read", "catalog.read"],
  "services.create": ["services.create", "catalog.write", "catalog.create"],
  "services.update": ["services.update", "catalog.write", "catalog.update"],
  "services.delete": ["services.delete", "catalog.delete"],
  "customBuild.read": ["customBuild.read", "catalog.read"],
  "customBuild.manage_options": [
    "customBuild.manage_options",
    "catalog.write",
    "catalog.create",
    "catalog.update",
    "catalog.delete",
  ],
};

export const ADMIN_ASSIGNABLE = PERMISSIONS.filter((permission) => !SUPERADMIN_ONLY.includes(permission));

export const EDITOR_PERMISSIONS = [
  "catalog.read",
  "catalog.create",
  "catalog.update",
  "catalog.write",
  "customBuild.read",
  "customBuild.manage_options",
  "inquiries.read",
  "messages.read",
  "messages.update",
  "brand.read",
  "brand.update",
  "footerLinks.read",
  "footerLinks.create",
  "footerLinks.update",
  "pages.read",
  "pages.update",
  "pages.publish",
  "services.read",
  "services.create",
  "services.update",
  "uploads.upload",
  "uploads.write",
];

export const DEFAULT_ADMIN_PERMISSIONS = ADMIN_ASSIGNABLE.filter(
  (permission) =>
    permission.startsWith("users.") ||
    permission.startsWith("inquiries.") ||
    permission.startsWith("catalog.") ||
    permission.startsWith("uploads.") ||
    permission.startsWith("messages.") ||
    permission.startsWith("brand.") ||
    permission.startsWith("footerLinks.") ||
    permission.startsWith("pages.") ||
    permission.startsWith("services.") ||
    permission.startsWith("customBuild."),
);

export const MANAGEABLE_ROLES = ["admin", "editor", "custom", "customer"];

export function userHasPermission(user, permission) {
  if (!user || !permission) return false;
  if (user.role === "superadmin") return true;
  const granted = new Set(Array.isArray(user.permissions) ? user.permissions : []);
  const options = SATISFIED_BY[permission] || [permission];
  return options.some((item) => granted.has(item));
}

export function canChangeTarget(actor, target) {
  if (!actor?.id || !target?.id) return false;
  if (actor.role !== "superadmin") return false;
  if (target.role === "superadmin") return false;
  if (actor.id === target.id) return false;
  return true;
}

const LEGACY_TO_CANONICAL = {
  "catalog.write": ["catalog.create", "catalog.update"],
  "users.create_admin": ["users.create"],
  "users.update_status": ["users.update"],
  "users.update_role": ["roles.update"],
  "uploads.write": ["uploads.upload"],
};

export function canonicalPermissions(list) {
  const selected = new Set();
  for (const key of Array.isArray(list) ? list : []) {
    if (CANONICAL_PERMISSIONS.includes(key)) selected.add(key);
    for (const mapped of LEGACY_TO_CANONICAL[key] || []) selected.add(mapped);
  }
  return CANONICAL_PERMISSIONS.filter((key) => selected.has(key));
}

export function buildRoleUpdatePayload({ role, permissions }) {
  const body = { role };
  if (role === "admin" || role === "editor" || role === "custom") {
    body.permissions = canonicalPermissions(permissions);
  }
  return body;
}

export function presetForRole(role) {
  if (role === "admin") return canonicalPermissions(DEFAULT_ADMIN_PERMISSIONS);
  if (role === "editor") return canonicalPermissions(EDITOR_PERMISSIONS);
  if (role === "customer") return [];
  if (role === "superadmin") return [...CANONICAL_PERMISSIONS];
  return null;
}
