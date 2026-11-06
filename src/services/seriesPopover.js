const VIEW_PADDING = 16;
const GAP = 12;
const INFO_OFFSET = 44;
export const SERIES_POPOVER_MAX_WIDTH = 360;
export const SERIES_POPOVER_MAX_HEIGHT = 280;
export const SERIES_LAYOUT_MIN_WIDTH = 1024;

export function prefersFinePointer(media = globalThis) {
  if (!media?.matchMedia) return false;
  return media.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function prefersWideSeriesLayout(media = globalThis) {
  if (!media?.matchMedia) return false;
  return media.matchMedia(`(min-width: ${SERIES_LAYOUT_MIN_WIDTH}px)`).matches;
}

export function placeSeriesPopover({ cardRect, viewport, gap = GAP } = {}) {
  const viewWidth = Number(viewport?.width) || 0;
  const viewHeight = Number(viewport?.height) || 0;
  const maxWidth = Math.max(200, Math.min(SERIES_POPOVER_MAX_WIDTH, viewWidth - VIEW_PADDING * 2));
  const cardLeft = Number(cardRect?.left) || 0;
  let left = cardLeft;
  if (left + maxWidth > viewWidth - VIEW_PADDING) {
    left = viewWidth - VIEW_PADDING - maxWidth;
  }
  if (left < VIEW_PADDING) left = VIEW_PADDING;

  const cardTop = Number(cardRect?.top) || 0;
  const belowTop = cardTop + INFO_OFFSET;
  const spaceBelow = viewHeight - belowTop - VIEW_PADDING;
  const spaceAbove = cardTop - VIEW_PADDING - gap;
  const placement = spaceBelow >= 140 || spaceBelow >= spaceAbove ? "below" : "above";
  const available = placement === "below" ? spaceBelow : spaceAbove;
  const maxHeight = Math.max(120, Math.min(SERIES_POPOVER_MAX_HEIGHT, available));

  if (placement === "below") {
    return {
      placement,
      left,
      maxWidth,
      top: Math.max(VIEW_PADDING, belowTop),
      bottom: "auto",
      maxHeight,
    };
  }

  return {
    placement,
    left,
    maxWidth,
    top: "auto",
    bottom: Math.max(VIEW_PADDING, viewHeight - (Number(cardRect?.top) || 0) + gap),
    maxHeight,
  };
}
