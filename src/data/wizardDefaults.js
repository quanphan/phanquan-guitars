import { isCustomScale } from "./wizardScaleAttributes.js";

function isUsable(option) {
  return Boolean(option) && option.active !== false;
}

function scopeMatches(option, instrumentTypeId) {
  const needle = String(instrumentTypeId);
  return (option.defaultForInstrumentTypeIds || []).some((value) => {
    const id = String(value);
    return id === needle || id.endsWith(`.${needle}`) || needle.endsWith(`.${id}`);
  });
}

export function pickDefaultOption(options, instrumentTypeId) {
  if (!Array.isArray(options) || !options.length) return null;
  const usable = options.filter(isUsable);
  if (!usable.length) return null;
  if (instrumentTypeId) {
    const scoped = usable.find((item) => scopeMatches(item, instrumentTypeId));
    if (scoped) return scoped;
  }
  return usable.find((item) => item.isDefault) || null;
}

export function pickConfiguredOption(options, instrumentTypeId, { skipCustomScale = false } = {}) {
  const usable = (options || []).filter(isUsable);
  if (!usable.length) return null;
  const withoutCustom = skipCustomScale ? usable.filter((item) => !isCustomScale(item)) : usable;
  const pool = withoutCustom.length ? withoutCustom : usable;
  return pickDefaultOption(pool, instrumentTypeId) || pool[0] || null;
}

export function configuredOptionId(options, instrumentTypeId, extra) {
  return pickConfiguredOption(options, instrumentTypeId, extra)?.id || null;
}

export function applySeriesDefault(selections, availableSeries) {
  if (!selections || selections.seriesId || !selections.instrumentTypeId) return selections;
  const picked = pickDefaultOption(availableSeries, selections.instrumentTypeId);
  if (!picked) return selections;
  return { ...selections, seriesId: picked.id };
}
