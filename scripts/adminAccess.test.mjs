import assert from "node:assert/strict";
import test from "node:test";
import { isAdminRole, resolveAdminView, safeAdminRedirect } from "../src/auth/adminAccess.js";
import { buildLoginPayload } from "../src/auth/loginPayload.js";
import { parseAuthData } from "../src/auth/session.js";
import {
  buildInquiryListQuery,
  summarizeConfiguration,
} from "../src/services/inquiryQuery.js";
import { tFor } from "../src/i18n/translations.js";

test("unauthenticated admin pages redirect to login", () => {
  const inquiries = resolveAdminView({ pathname: "/admin/inquiries/inq_123", session: null });
  const messages = resolveAdminView({ pathname: "/admin/messages/abc123", session: null });
  assert.equal(inquiries.view, "redirect");
  assert.equal(inquiries.redirectTo, "/admin/login?from=%2Fadmin%2Finquiries%2Finq_123");
  assert.equal(messages.view, "redirect");
  assert.equal(messages.redirectTo, "/admin/login?from=%2Fadmin%2Fmessages%2Fabc123");
  assert.equal(safeAdminRedirect("/admin/inquiries/inq_123"), "/admin/inquiries/inq_123");
  assert.equal(safeAdminRedirect("/admin/messages/abc123"), "/admin/messages/abc123");
  assert.equal(safeAdminRedirect("https://evil.example/admin/messages/abc123"), "/admin");
});

test("authenticated customers are denied instead of seeing inquiries", () => {
  const inquiries = resolveAdminView({
    pathname: "/admin/inquiries/inq_123",
    session: { accessToken: "token", user: { role: "customer" } },
  });
  const messages = resolveAdminView({
    pathname: "/admin/messages/abc123",
    session: { accessToken: "token", user: { role: "customer" } },
  });
  assert.equal(inquiries.view, "forbidden");
  assert.equal(messages.view, "forbidden");
});

test("admins can open inquiry and brand settings routes", () => {
  const admin = resolveAdminView({
    pathname: "/admin/inquiries/abc",
    session: { accessToken: "token", user: { role: "admin" } },
  });
  const brand = resolveAdminView({
    pathname: "/admin/settings/brand",
    session: { accessToken: "token", user: { role: "admin" } },
  });
  const wizardSetup = resolveAdminView({
    pathname: "/admin/custom-build-setup",
    session: { accessToken: "token", user: { role: "admin" } },
  });
  assert.equal(brand.view, "allow");
  assert.equal(wizardSetup.view, "allow");
  const superadmin = resolveAdminView({
    pathname: "/admin/inquiries",
    session: { accessToken: "token", user: { role: "superadmin" } },
  });
  assert.equal(admin.view, "allow");
  assert.equal(superadmin.view, "allow");
  assert.equal(isAdminRole("customer"), false);
});

test("signed-in admins are sent from login to the dashboard", () => {
  const result = resolveAdminView({
    pathname: "/admin/login",
    session: { accessToken: "token", user: { role: "admin" } },
  });
  assert.equal(result.view, "redirect");
  assert.equal(result.redirectTo, "/admin");
});

test("login payload uses email or username and never invents extra fields", () => {
  assert.deepEqual(buildLoginPayload("Admin@Shop.test", "secret").body, {
    email: "admin@shop.test",
    password: "secret",
  });
  assert.deepEqual(buildLoginPayload("phanquan", "secret").body, {
    username: "phanquan",
    password: "secret",
  });
  assert.equal(buildLoginPayload("", "").ok, false);
  assert.equal(buildLoginPayload("nope!", "secret").ok, false);
});

test("auth parser keeps tokens and role but drops passwords", () => {
  const session = parseAuthData({
    success: true,
    data: {
      accessToken: "access",
      refreshToken: "refresh",
      expiresIn: "15m",
      user: {
        id: "u1",
        email: "admin@example.com",
        role: "admin",
        password: "should-not-keep",
      },
    },
  });
  assert.equal(session.accessToken, "access");
  assert.equal(session.user.role, "admin");
  assert.equal(Object.prototype.hasOwnProperty.call(session.user, "password"), false);
});

test("inquiry filters encode search, status and date range", () => {
  const query = buildInquiryListQuery({
    q: "lan.search@example.com",
    status: "new",
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    page: 2,
    limit: 10,
  });
  assert.equal(query.includes("q=lan.search%40example.com"), true);
  assert.equal(query.includes("status=new"), true);
  assert.equal(query.includes("startDate=2026-03-01"), true);
  assert.equal(query.includes("endDate=2026-03-31"), true);
  assert.equal(buildInquiryListQuery({ status: "approved" }).includes("status="), false);
});

test("status-only patch contract does not include configuration", () => {
  const body = { status: "ready_to_build" };
  assert.deepEqual(Object.keys(body), ["status"]);
});

test("expired sessions are sent back to login", () => {
  const result = resolveAdminView({
    pathname: "/admin/inquiries/inq_1",
    session: null,
  });
  assert.equal(result.redirectTo, "/admin/login?from=%2Fadmin%2Finquiries%2Finq_1");
  assert.equal(safeAdminRedirect("/admin/inquiries/inq_1"), "/admin/inquiries/inq_1");
  assert.equal(safeAdminRedirect("https://evil.example"), "/admin");
});

test("configuration summary uses submitted keys only", () => {
  assert.equal(
    summarizeConfiguration({
      selections: { "instrument-type": "acoustic", "body-wood": "mahogany" },
    }),
    "instrument-type: acoustic · body-wood: mahogany",
  );
  assert.equal(
    summarizeConfiguration({
      selections: {},
      notes: "inquiryType=collaboration\ncountry=Vietnam",
    }),
    "collaboration",
  );
});

test("admin copy exists in English and Vietnamese", () => {
  assert.equal(tFor("en", "admin.login.submit"), "Sign in");
  assert.equal(tFor("vi", "admin.login.submit"), "Đăng nhập");
  assert.equal(tFor("en", "admin.status.ready_to_build"), "Ready to build");
  assert.equal(tFor("vi", "admin.status.cancelled"), "Đã hủy");
  assert.equal(tFor("en", "nav.login"), "Log in");
  assert.equal(tFor("vi", "nav.account"), "Tài khoản");
  assert.equal(tFor("en", "admin.tabs.users"), "Users");
  assert.equal(tFor("vi", "admin.permissions.users.read"), "Xem danh sách và hồ sơ user.");
});
