import assert from "node:assert/strict";
import test from "node:test";
import { formatProductPrice, formatStoredPrice } from "../src/services/formatPrice.js";

test("USD uses a leading dollar sign without a trailing currency code", () => {
  assert.equal(formatStoredPrice(500, "USD"), "$500");
  assert.equal(formatStoredPrice(500, "usd"), "$500");
  assert.equal(formatStoredPrice(2500, "USD"), "$2,500");
});

test("missing currency defaults to USD", () => {
  assert.equal(formatStoredPrice(500, ""), "$500");
  assert.equal(formatProductPrice({ price: 500 }), "$500");
});

test("uses a stored ISO currency other than USD", () => {
  assert.equal(formatStoredPrice(1800, "EUR"), "€1,800");
});

test("uses the stored unit text when it is not an ISO currency code", () => {
  assert.equal(formatStoredPrice(1200, "euro"), "1,200 euro");
});

test("hides missing, zero, and invalid prices", () => {
  assert.equal(formatStoredPrice(0, "USD"), "");
  assert.equal(formatStoredPrice("", "USD"), "");
  assert.equal(formatStoredPrice(null, "USD"), "");
  assert.equal(formatStoredPrice(-12, "USD"), "");
  assert.equal(formatProductPrice({ unit: "USD" }), "");
});

test("reads currency from unit when currency is absent", () => {
  assert.equal(formatProductPrice({ price: 1800, unit: "EUR" }), "€1,800");
});
