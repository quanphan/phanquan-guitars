import assert from "node:assert/strict";
import test from "node:test";
import { accountMenuLinks } from "../src/auth/accountMenu.js";

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

test("admins and superadmins see account and admin", () => {
  assert.deepEqual(
    accountMenuLinks({ isAuthenticated: true, isAdmin: true }).map((item) => item.to),
    ["/account", "/admin"],
  );
});
