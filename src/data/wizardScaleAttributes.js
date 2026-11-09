export const DEFAULT_FRET_COUNT = 24;
export const SCALE_TYPES = ["single", "multiscale", "custom"];

const INCH_MARK = "″";

export function emptyScaleForm(scaleType = "single") {
  return {
    scaleType: normalizeScaleType(scaleType),
    display: "",
    bass: "",
    treble: "",
  };
}

export function normalizeScaleType(type) {
  const value = String(type || "").trim().toLowerCase();
  if (value === "multiscale" || value === "multi") return "multiscale";
  if (value === "custom" || value === "custom-scale" || value === "customscale") return "custom";
  return "single";
}

export function parsePositiveFretCount(value) {
  if (value == null || value === "") return null;
  if (typeof value === "boolean") return null;
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return null;
  const count = Number(text);
  if (!Number.isInteger(count) || count <= 0) return null;
  return count;
}

export function resolvedFretCount(value, fallback = DEFAULT_FRET_COUNT) {
  return parsePositiveFretCount(value) ?? fallback;
}

function formatOneLength(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  const cleaned = text.replace(/["″”]+\s*$/u, "").trim();
  if (!cleaned) return "";
  return `${cleaned}${INCH_MARK}`;
}

export function formatScaleLength(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  const parts = text.split(/\s*[–-]\s*/);
  if (parts.length === 2 && parts[0] && parts[1]) {
    return `${formatOneLength(parts[0])} – ${formatOneLength(parts[1])}`;
  }
  return formatOneLength(text);
}

export function isValidCustomScaleValue(value) {
  return Boolean(String(value || "").trim());
}

export function isValidFretCountSelection(value) {
  return parsePositiveFretCount(value) != null;
}

export function scaleDisplayValue(scale, customValue = "") {
  if (!scale || typeof scale !== "object") return "";
  if (isCustomScale(scale)) return String(customValue || "").trim();
  const attributes = scale.attributes && typeof scale.attributes === "object" ? scale.attributes : {};
  const type = normalizeScaleType(scale.type || attributes.type);
  const display = String(scale.display || attributes.display || scale.value || attributes.value || "").trim();
  const bass = String(scale.bass || attributes.bass || "").trim();
  const treble = String(scale.treble || attributes.treble || "").trim();
  if (type === "multiscale" && (bass || treble)) {
    return display || `${formatScaleLength(bass)} – ${formatScaleLength(treble)}`;
  }
  return display;
}

function optionText(scale) {
  return [
    scale?.name,
    scale?.code,
    scale?.translations?.en?.name,
    scale?.translations?.vi?.name,
  ].filter(Boolean).join(" ").toLowerCase();
}

export function isCustomScale(scale) {
  if (!scale) return false;
  if (normalizeScaleType(scale.type || scale.attributes?.type) === "custom") return true;
  const text = optionText(scale);
  if (text.includes("custom scale") || text.includes("custom-scale")) return true;
  const id = String(scale.id || scale.code || scale.optionId || "").toLowerCase();
  return id.includes("custom-scale") || /(^|[.-])custom$/.test(id);
}

export function shouldKeepCustomScaleValue(scale, scaleId) {
  if (!scaleId) return false;
  if (!scale) return true;
  return isCustomScale(scale);
}

export function scaleListSummary(option, t) {
  const form = scaleFormFromAttributes(option?.attributes);
  const typeLabel = t(`admin.wizardSetup.scaleTypes.${form.scaleType}`);
  if (form.scaleType === "custom") return typeLabel;
  const display = scaleDisplayValue(option) || form.display;
  return display ? `${typeLabel} · ${display}` : typeLabel;
}

export function isMultiscale(scale) {
  if (!scale) return false;
  return normalizeScaleType(scale.type || scale.attributes?.type) === "multiscale";
}

export function scaleFormFromAttributes(attributes = {}) {
  const source = attributes && typeof attributes === "object" ? attributes : {};
  return {
    scaleType: normalizeScaleType(source.type),
    display: source.display || source.value || "",
    bass: source.bass || "",
    treble: source.treble || "",
  };
}

export function validateScaleForm(form) {
  const errors = {};
  const type = normalizeScaleType(form?.scaleType);
  if (type === "multiscale" && (!String(form?.bass || "").trim() || !String(form?.treble || "").trim())) {
    errors.scaleEnds = "scaleEnds";
  }
  return errors;
}

export function mergeScaleAttributes(existing, form) {
  const next = existing && typeof existing === "object" && !Array.isArray(existing)
    ? { ...existing }
    : {};
  const type = normalizeScaleType(form?.scaleType);
  next.type = type;
  delete next.customMode;
  if (type === "custom") {
    delete next.display;
    delete next.bass;
    delete next.treble;
    delete next.value;
    return next;
  }
  if (type === "multiscale") {
    next.bass = formatScaleLength(form.bass);
    next.treble = formatScaleLength(form.treble);
    next.display = `${next.bass} – ${next.treble}`;
    return next;
  }
  const display = formatScaleLength(form?.display);
  if (display) next.display = display;
  delete next.bass;
  delete next.treble;
  return next;
}

export function inquiryFretCount(value) {
  return parsePositiveFretCount(value) ?? DEFAULT_FRET_COUNT;
}
