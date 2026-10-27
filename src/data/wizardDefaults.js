import { isActiveOption } from "./wizardSelection.js";

function scopeMatches(option, instrumentTypeId) {
  const needle = String(instrumentTypeId);
  return (option.defaultForInstrumentTypeIds || []).some((value) => {
    const id = String(value);
    return id === needle || id.endsWith(`.${needle}`) || needle.endsWith(`.${id}`);
  });
}

export function pickDefaultOption(options, instrumentTypeId) {
  if (!Array.isArray(options) || !options.length) return null;
  const usable = options.filter(isActiveOption);
  if (!usable.length) return null;
  if (instrumentTypeId) {
    const scoped = usable.find((item) => scopeMatches(item, instrumentTypeId));
    if (scoped) return scoped;
  }
  return usable.find((item) => item.isDefault) || null;
}

export function applySeriesDefault(selections, availableSeries) {
  if (!selections || selections.seriesId || !selections.instrumentTypeId) return selections;
  const picked = pickDefaultOption(availableSeries, selections.instrumentTypeId);
  if (!picked) return selections;
  return { ...selections, seriesId: picked.id };
}
