import assert from "node:assert/strict";
import test from "node:test";
import {
  firstContactFieldId,
  nextSubmitAction,
} from "../src/utils/customBuildSubmitFlow.js";

test("ignores a second click while submitting", () => {
  assert.equal(
    nextSubmitAction({
      locked: true,
      status: "submitting",
      incompleteStep: null,
      contactErrorKeys: [],
      configured: true,
    }).action,
    "ignore-duplicate",
  );
});

test("treats a leftover lock after a failed attempt as stale", () => {
  assert.equal(
    nextSubmitAction({
      locked: true,
      status: "idle",
      incompleteStep: null,
      contactErrorKeys: [],
      configured: true,
    }).action,
    "stale-lock",
  );
});

test("blocks incomplete wizard steps before contact or the API", () => {
  const result = nextSubmitAction({
    locked: false,
    status: "idle",
    incompleteStep: 3,
    contactErrorKeys: ["contactName"],
    configured: true,
  });
  assert.equal(result.action, "invalid-config");
  assert.equal(result.incompleteStep, 3);
});

test("blocks invalid contact fields without calling the API", () => {
  const result = nextSubmitAction({
    locked: false,
    status: "idle",
    incompleteStep: null,
    contactErrorKeys: ["acknowledgement", "contactEmail"],
    configured: true,
  });
  assert.equal(result.action, "invalid");
  assert.equal(firstContactFieldId(result.contactErrorKeys), "contact-email");
});

test("proceeds to submit only when config, contact, and API are ready", () => {
  assert.equal(
    nextSubmitAction({
      locked: false,
      status: "idle",
      incompleteStep: null,
      contactErrorKeys: [],
      configured: true,
    }).action,
    "submit",
  );
});

test("does not treat success as a new submit", () => {
  assert.equal(
    nextSubmitAction({
      locked: true,
      status: "success",
      incompleteStep: null,
      contactErrorKeys: [],
      configured: true,
    }).action,
    "ignore-success",
  );
});
