const VIEW_PADDING = 12;
const GAP = 12;
const MAX_WIDTH = 420;

export function prefersFinePointer(media = globalThis) {
  if (!media?.matchMedia) return false;
  return media.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function placeSeriesPopover({ cardRect, viewport, gap = GAP } = {}) {
  const viewWidth = Number(viewport?.width) || 0;
  const viewHeight = Number(viewport?.height) || 0;
  const maxWidth = Math.max(180, Math.min(MAX_WIDTH, viewWidth - VIEW_PADDING * 2));
  const preferredLeft = Number(cardRect?.left) || 0;
  const left = Math.min(
    Math.max(VIEW_PADDING, preferredLeft),
    Math.max(VIEW_PADDING, viewWidth - maxWidth - VIEW_PADDING),
  );
  const belowTop = (Number(cardRect?.bottom) || 0) + gap;
  const spaceBelow = viewHeight - belowTop - VIEW_PADDING;
  const spaceAbove = (Number(cardRect?.top) || 0) - VIEW_PADDING - gap;
  const placement = spaceBelow >= 140 || spaceBelow >= spaceAbove ? "below" : "above";

  if (placement === "below") {
    return {
      placement,
      left,
      maxWidth,
      top: Math.max(VIEW_PADDING, belowTop),
      bottom: "auto",
      maxHeight: Math.max(120, viewHeight - belowTop - VIEW_PADDING),
    };
  }

  return {
    placement,
    left,
    maxWidth,
    top: "auto",
    bottom: viewHeight - (Number(cardRect?.top) || 0) + gap,
    maxHeight: Math.max(120, spaceAbove),
  };
}
