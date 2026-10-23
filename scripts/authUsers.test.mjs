import assert from "node:assert/strict";
import test from "node:test";
import { buildUserListQuery } from "../src/auth/adminUserQuery.js";
import { canChangeTarget, SUPERADMIN_ONLY, userHasPermission } from "../src/auth/permissions.js";
import { buildCreateAdminPayload } from "../src/auth/createAdminPayload.js";
import { buildRegisterPayload, fieldErrorsFromPayload } from "../src/auth/registerPayload.js";
import { postLoginPath, safeAppRedirect } from "../src/auth/redirects.js";
import { parseAuthData } from "../src/auth/session.js";

test("register payload omits role and defaults marketing consent off", () => {
  const next = buildRegisterPayload({
    name: "Lan",
    email: "Lan@Shop.test",
    password: "secret123",
    confirmPassword: "secret123",
  });
  assert.equal(next.ok, true);
  assert.deepEqual(next.body, {
    name: "Lan",
    email: "lan@shop.test",
    password: "secret123",
    marketingConsent: false,
  });
  assert.equal(Object.prototype.hasOwnProperty.call(next.body, "role"), false);
});

test("register requires matching passwords", () => {
  const next = buildRegisterPayload({
    name: "Lan",
    email: "lan@shop.test",
    password: "secret123",
    confirmPassword: "other",
  });
  assert.equal(next.ok, false);
  assert.equal(next.errors.confirmPassword, "mismatch");
});

test("create admin payload never sends superadmin role", () => {
  const next = buildCreateAdminPayload({
    name: "Workshop",
    email: "admin@shop.test",
    password: "secret123",
    confirmPassword: "secret123",
    permissions: ["users.read", "inquiries.read"],
  });
  assert.equal(next.ok, true);
  assert.equal(Object.prototype.hasOwnProperty.call(next.body, "role"), false);
  assert.deepEqual(next.body.permissions, ["users.read", "inquiries.read"]);
});

test("user list query only sends known filters", () => {
  const query = buildUserListQuery({
    q: "lan@shop.test",
    role: "admin",
    status: "locked",
    page: 2,
    limit: 10,
  });
  assert.equal(query.includes("q=lan%40shop.test"), true);
  assert.equal(query.includes("role=admin"), true);
  assert.equal(query.includes("status=locked"), true);
  assert.equal(buildUserListQuery({ role: "owner" }).includes("role="), false);
});

test("admins cannot manage superadmin or themselves", () => {
  const actor = { id: "a1", role: "admin", permissions: ["users.update_role"] };
  assert.equal(canChangeTarget(actor, { id: "s1", role: "superadmin" }), false);
  assert.equal(canChangeTarget(actor, { id: "a1", role: "customer" }), false);
  assert.equal(canChangeTarget(actor, { id: "c1", role: "customer" }), true);
  assert.equal(userHasPermission({ permissions: ["users.read"] }, "users.create_admin"), false);
  assert.equal(SUPERADMIN_ONLY.includes("users.create_admin"), true);
});

test("customer login redirect stays on-site and skips admin unless admin", () => {
  assert.equal(safeAppRedirect("https://evil.example"), "/account");
  assert.equal(postLoginPath("/admin/users", false), "/account");
  assert.equal(postLoginPath("/admin/users", true), "/admin/users");
  assert.equal(postLoginPath("/custom-build", false), "/custom-build");
});

test("session restore keeps marketing consent and permissions, not password", () => {
  const session = parseAuthData({
    success: true,
    data: {
      accessToken: "access",
      refreshToken: "refresh",
      user: {
        id: "u1",
        email: "lan@shop.test",
        role: "customer",
        marketingConsent: true,
        permissions: [],
        password: "nope",
      },
    },
  });
  assert.equal(session.user.marketingConsent, true);
  assert.equal(Object.prototype.hasOwnProperty.call(session.user, "password"), false);
});

test("backend validation details map onto fields", () => {
  const errors = fieldErrorsFromPayload({
    error: { details: [{ field: "email", code: "INVALID" }] },
  });
  assert.equal(errors.email, "INVALID");
});
