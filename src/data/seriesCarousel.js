const MD_MIN = 768;
const XL_MIN = 1280;
/** Visible-count breakpoints match the former series grid: 1 / 2 / 3. */

export function seriesCarouselVisibleCount(width) {
  const value = Number(width);
  if (!Number.isFinite(value) || value < MD_MIN) return 1;
  if (value < XL_MIN) return 2;
  return 3;
}

export function seriesCarouselNeedsNav(itemCount, visibleCount) {
  const count = Number(itemCount) || 0;
  const visible = Math.max(1, Number(visibleCount) || 1);
  return count > visible;
}

export function seriesCarouselTrack(items, visibleCount) {
  const list = Array.isArray(items) ? items : [];
  const visible = Math.max(1, Number(visibleCount) || 1);
  if (!seriesCarouselNeedsNav(list.length, visible)) {
    return { slides: list, startOffset: 0, looping: false };
  }
  const head = list.slice(Math.max(0, list.length - visible));
  const tail = list.slice(0, visible);
  return {
    slides: head.concat(list, tail),
    startOffset: visible,
    looping: true,
  };
}

export function seriesCarouselWrappedOffset(offset, itemCount, visibleCount) {
  const count = Number(itemCount) || 0;
  const visible = Math.max(1, Number(visibleCount) || 1);
  const current = Number(offset) || 0;
  if (!seriesCarouselNeedsNav(count, visible)) return 0;
  if (current <= 0) return count;
  if (current >= visible + count) return visible;
  return current;
}

export function seriesCarouselWindow(items, offset, visibleCount) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return [];
  const visible = Math.min(Math.max(1, Number(visibleCount) || 1), list.length);
  const start = ((Number(offset) || 0) % list.length + list.length) % list.length;
  return Array.from({ length: visible }, (_, index) => list[(start + index) % list.length]);
}
