const SCALE_MIN = 18;
const SCALE_MAX = 40;

function trimText(value) {
  if (value == null || value === false) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value === 0) return "";
    return String(value);
  }
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text || text === "0" || /^undefined$/i.test(text) || /^null$/i.test(text)) return "";
  return text;
}

export function flattenGuitarSpecs(guitar) {
  const tabs = guitar?.specTabs && typeof guitar.specTabs === "object" ? Object.values(guitar.specTabs) : [];
  const merged = Object.assign({}, ...tabs.filter((tab) => tab && typeof tab === "object" && !Array.isArray(tab)));
  if (guitar?.specs && typeof guitar.specs === "object" && !Array.isArray(guitar.specs)) {
    return { ...guitar.specs, ...merged };
  }
  return merged;
}

function uniqueNumbers(values) {
  const seen = [];
  for (const value of values) {
    if (!seen.includes(value)) seen.push(value);
  }
  return seen;
}

export function parseScaleInches(text) {
  const source = trimText(text);
  if (!source) return [];
  const matches = source.match(/\d+(?:\.\d+)?/g) || [];
  return uniqueNumbers(
    matches.map((item) => Number(item)).filter((value) => value >= SCALE_MIN && value <= SCALE_MAX),
  );
}

function formatInch(value) {
  return `${value}"`;
}

function withMultiscaleLabel(text) {
  if (/multiscale/i.test(text)) return text;
  return `${text} Multiscale`;
}

export function formatScaleDisplay(scaleLength, multiscaleRange) {
  const scale = trimText(scaleLength);
  const range = trimText(multiscaleRange);
  const rangeInches = parseScaleInches(range);
  const scaleInches = parseScaleInches(scale);

  if (rangeInches.length >= 2) return withMultiscaleLabel(range);
  if (scaleInches.length >= 2) return withMultiscaleLabel(scale);

  if (scaleInches.length === 1 && rangeInches.length === 1 && scaleInches[0] !== rangeInches[0]) {
    const low = Math.min(scaleInches[0], rangeInches[0]);
    const high = Math.max(scaleInches[0], rangeInches[0]);
    return withMultiscaleLabel(`${formatInch(low)}–${formatInch(high)}`);
  }

  if (scale) return scale;
  if (range) return range;
  return "";
}

export function formatStringsDisplay(stringCount, t) {
  const raw = trimText(stringCount);
  if (!raw) return "";
  if (/string/i.test(raw) || /dây/i.test(raw)) return raw;
  const count = raw.match(/\d+/);
  if (!count) return raw;
  return t("guitars.cardSummary.stringsValue").replace("{count}", count[0]);
}

export function formatStringsAndScale(specs, t) {
  const strings = formatStringsDisplay(specs?.stringCount, t);
  const scale = formatScaleDisplay(specs?.scaleLength, specs?.multiscaleRange);
  return [strings, scale].filter(Boolean).join(" · ");
}

export function formatBodyNeck(specs) {
  const body = trimText(specs?.bodyWood);
  const neck = trimText(specs?.neckWood);
  return [body, neck].filter(Boolean).join(" / ");
}

export function guitarCardSummary(guitar, t) {
  const specs = flattenGuitarSpecs(guitar);
  const rows = [];
  const stringsScale = formatStringsAndScale(specs, t);
  const bodyNeck = formatBodyNeck(specs);
  const finish = trimText(specs.finishType);
  if (stringsScale) rows.push({ id: "stringsScale", value: stringsScale });
  if (bodyNeck) rows.push({ id: "bodyNeck", value: bodyNeck });
  if (finish) rows.push({ id: "finishType", value: finish });
  return rows;
}
