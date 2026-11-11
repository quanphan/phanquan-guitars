import assert from "node:assert/strict";
import test from "node:test";
import {
  seriesCarouselNeedsNav,
  seriesCarouselTrack,
  seriesCarouselVisibleCount,
  seriesCarouselWindow,
  seriesCarouselWrappedOffset,
} from "../src/data/seriesCarousel.js";
import { tFor } from "../src/i18n/translations.js";

const items = ["A", "B", "C", "D", "E"];

test("desktop shows three cards, tablet two, mobile one", () => {
  assert.equal(seriesCarouselVisibleCount(1440), 3);
  assert.equal(seriesCarouselVisibleCount(1280), 3);
  assert.equal(seriesCarouselVisibleCount(1024), 2);
  assert.equal(seriesCarouselVisibleCount(768), 2);
  assert.equal(seriesCarouselVisibleCount(767), 1);
  assert.equal(seriesCarouselVisibleCount(390), 1);
});

test("navigation is hidden when every series already fits", () => {
  assert.equal(seriesCarouselNeedsNav(3, 3), false);
  assert.equal(seriesCarouselNeedsNav(2, 3), false);
  assert.equal(seriesCarouselNeedsNav(1, 1), false);
  assert.equal(seriesCarouselNeedsNav(4, 3), true);
  assert.equal(seriesCarouselNeedsNav(5, 3), true);
});

test("right arrow advances one card and wraps through the first items", () => {
  const windows = [];
  let offset = 0;
  for (let step = 0; step < 6; step += 1) {
    windows.push(seriesCarouselWindow(items, offset, 3).join(" – "));
    offset += 1;
  }
  assert.deepEqual(windows, [
    "A – B – C",
    "B – C – D",
    "C – D – E",
    "D – E – A",
    "E – A – B",
    "A – B – C",
  ]);
});

test("left arrow reverses the same one-card loop", () => {
  assert.deepEqual(seriesCarouselWindow(items, -1, 3), ["E", "A", "B"]);
  assert.deepEqual(seriesCarouselWindow(items, 0, 3), ["A", "B", "C"]);
});

test("cloned track jumps back onto the real list without a gap", () => {
  const { slides, startOffset, looping } = seriesCarouselTrack(items, 3);
  assert.equal(looping, true);
  assert.equal(startOffset, 3);
  assert.deepEqual(slides.slice(startOffset, startOffset + 3), ["A", "B", "C"]);
  assert.equal(seriesCarouselWrappedOffset(8, 5, 3), 3);
  assert.equal(seriesCarouselWrappedOffset(0, 5, 3), 5);
  assert.deepEqual(slides.slice(5, 8), ["C", "D", "E"]);
});

test("short lists keep a single non-looping row", () => {
  const two = seriesCarouselTrack(["A", "B"], 3);
  assert.equal(two.looping, false);
  assert.deepEqual(two.slides, ["A", "B"]);
  assert.deepEqual(seriesCarouselWindow(["A"], 0, 3), ["A"]);
});

test("series carousel controls have English and Vietnamese labels", () => {
  assert.equal(tFor("en", "guitars.series.previous"), "Previous series");
  assert.equal(tFor("vi", "guitars.series.previous"), "Series trước");
  assert.equal(tFor("en", "guitars.series.next"), "Next series");
  assert.equal(tFor("vi", "guitars.series.next"), "Series tiếp");
});
