import assert from "node:assert/strict";
import test from "node:test";
import { accountDisplayName, accountMenuLinks } from "../src/auth/accountMenu.js";

test("guests see login and register, never admin or account", () => {
  assert.deepEqual(
    accountMenuLinks({ isAuthenticated: false, isAdmin: false }).map((item) => item.to),
    ["/login", "/register"],
  );
  assert.deepEqual(
    accountMenuLinks({ isAuthenticated: false, isAdmin: true }).map((item) => item.to),
    ["/login", "/register"],
  );
});

test("customers see account without admin", () => {
  assert.deepEqual(
    accountMenuLinks({ isAuthenticated: true, isAdmin: false }).map((item) => item.to),
    ["/account"],
  );
});

test("account menu prefers the customer's name when the session has one", () => {
  assert.equal(accountDisplayName({ name: "Phan Quan", username: "phanquan" }), "Phan Quan");
  assert.equal(accountDisplayName({ name: "  ", username: "phanquan" }), "phanquan");
  assert.equal(accountDisplayName({ email: "a@b.c" }), "");
  assert.equal(accountDisplayName(null), "");
});

test("admins and superadmins see account and admin", () => {
  assert.deepEqual(
    accountMenuLinks({ isAuthenticated: true, isAdmin: true }).map((item) => item.to),
    ["/account", "/admin"],
  );
});
