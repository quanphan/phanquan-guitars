import assert from "node:assert/strict";
import test from "node:test";
import {
  imageElementStatus,
  restartImageLoad,
  shouldIgnoreImageError,
} from "../src/utils/imageLoadState.js";

test("cached images that already decoded are ready without waiting for onLoad", () => {
  assert.equal(imageElementStatus({ complete: true, naturalWidth: 1200 }), "ready");
  assert.equal(imageElementStatus({ complete: false, naturalWidth: 0 }), "loading");
});

test("complete images with no intrinsic size are broken", () => {
  assert.equal(imageElementStatus({ complete: true, naturalWidth: 0 }), "broken");
  assert.equal(imageElementStatus(null), "empty");
});

test("aborted errors from unmounted nodes or empty src are ignored", () => {
  assert.equal(shouldIgnoreImageError(null), true);
  assert.equal(shouldIgnoreImageError({ isConnected: false, getAttribute: () => "/a.jpg" }), true);
  assert.equal(
    shouldIgnoreImageError({ isConnected: true, getAttribute: () => "" }),
    true,
  );
  assert.equal(
    shouldIgnoreImageError({ isConnected: true, getAttribute: () => "/uploads/categories/a.jpg" }),
    false,
  );
});

test("restarting a load reassigns src without cache-busting query params", () => {
  let src = "/uploads/categories/a.jpg";
  const img = {
    getAttribute(name) {
      return name === "src" ? src : null;
    },
    setAttribute(name, value) {
      if (name === "src") src = value;
    },
    removeAttribute(name) {
      if (name === "src") src = "";
    },
  };
  assert.equal(restartImageLoad(img, "/uploads/categories/a.jpg"), true);
  assert.equal(src, "/uploads/categories/a.jpg");
  assert.equal(restartImageLoad(img, ""), false);
});
