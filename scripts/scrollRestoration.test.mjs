import assert from "node:assert/strict";
import test from "node:test";
import {
  applyScrollAction,
  decodeLocationHash,
  resolveScrollAction,
} from "../src/utils/scrollRestoration.js";

test("hash targets the decoded id and does not force the top of the page", () => {
  assert.equal(decodeLocationHash("#series"), "series");
  assert.equal(decodeLocationHash("#nh%E1%BA%A1c-c%E1%BB%A5"), "nhạc-cụ");
  assert.deepEqual(
    resolveScrollAction({
      navigationType: "PUSH",
      pathnameChanged: true,
      hash: "#series",
      savedY: 800,
    }),
    { type: "hash", id: "series" },
  );
});

test("internal navigation to a new route goes to the top", () => {
  assert.deepEqual(
    resolveScrollAction({
      navigationType: "PUSH",
      pathnameChanged: true,
      hash: "",
      savedY: 1200,
    }),
    { type: "top" },
  );
  assert.deepEqual(
    resolveScrollAction({
      navigationType: "REPLACE",
      pathnameChanged: true,
      hash: "",
    }),
    { type: "top" },
  );
});

test("same-route state changes keep the current scroll position", () => {
  assert.deepEqual(
    resolveScrollAction({
      navigationType: "PUSH",
      pathnameChanged: false,
      hash: "",
      savedY: 400,
    }),
    { type: "preserve" },
  );
});

test("back and forward restore the saved scroll when the route changes", () => {
  assert.deepEqual(
    resolveScrollAction({
      navigationType: "POP",
      pathnameChanged: true,
      hash: "",
      savedY: 640,
    }),
    { type: "restore", y: 640 },
  );
  assert.deepEqual(
    resolveScrollAction({
      navigationType: "POP",
      pathnameChanged: true,
      hash: "",
    }),
    { type: "top" },
  );
});

test("applyScrollAction writes the requested window position", () => {
  const calls = [];
  const root = {
    scrollTo(...args) {
      calls.push(args);
    },
  };
  applyScrollAction({ type: "preserve" }, root, {});
  applyScrollAction({ type: "top" }, root, {});
  applyScrollAction({ type: "restore", y: 420 }, root, {});
  const doc = {
    getElementById: (id) => (id === "contact" ? { scrollIntoView: (opts) => calls.push(["into", opts]) } : null),
  };
  applyScrollAction({ type: "hash", id: "contact" }, root, doc);
  applyScrollAction({ type: "hash", id: "missing" }, root, doc);
  assert.deepEqual(calls, [
    [{ top: 0, left: 0, behavior: "instant" }],
    [{ top: 420, left: 0, behavior: "instant" }],
    ["into", { block: "start", behavior: "auto" }],
    [{ top: 0, left: 0, behavior: "instant" }],
  ]);
});
