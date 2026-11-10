export const BODY_CONSTRUCTION_ATTR = "bodyConstruction";
export const NECK_CONSTRUCTION_ATTR = "neckConstruction";
export const CONSTRUCTION_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const CONSTRUCTION_ID_MAX = 40;
export const CONSTRUCTION_NAME_MAX = 80;

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function slugifyConstructionId(name) {
  const slug = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, CONSTRUCTION_ID_MAX);
  return slug;
}

const ONE_PIECE_IDS = new Set(["single-piece", "one-piece", "1-piece"]);

export function emptyConstructionOption() {
  return {
    clientKey: "",
    id: "",
    enName: "",
    viName: "",
    active: true,
  };
}

export function parseConstructionPieceCount(option) {
  const raw = option?.pieceCount ?? option?.pieces;
  const numbered = Number(raw);
  if (Number.isInteger(numbered) && numbered >= 1) return numbered;
  const id = String(option?.id || "").trim().toLowerCase();
  if (!id) return null;
  if (ONE_PIECE_IDS.has(id)) return 1;
  const match = id.match(/^(\d+)-pieces?$/);
  if (match) return Number(match[1]);
  if (id === "multi-piece") return 2;
  return null;
}

export function usesSecondaryWood(option) {
  const count = parseConstructionPieceCount(option);
  return count != null && count > 1;
}

export function usesSecondaryBodyWood(option) {
  return usesSecondaryWood(option);
}

export function usesSecondaryNeckWood(option) {
  return usesSecondaryWood(option);
}

function seriesConstructionOptions(series, attr) {
  const list = Array.isArray(series?.[attr])
    ? series[attr]
    : Array.isArray(series?.attributes?.[attr])
      ? series.attributes[attr]
      : [];
  return list
    .filter((item) => item && item.active !== false && String(item.id || "").trim())
    .slice()
    .sort((left, right) => (Number(left.sortOrder) || 0) - (Number(right.sortOrder) || 0) || String(left.id).localeCompare(String(right.id)));
}

export function seriesBodyConstructionOptions(series) {
  return seriesConstructionOptions(series, BODY_CONSTRUCTION_ATTR);
}

export function seriesNeckConstructionOptions(series) {
  return seriesConstructionOptions(series, NECK_CONSTRUCTION_ATTR);
}

export function findSeriesConstructionOption(series, selectedId) {
  if (selectedId == null || selectedId === "") return null;
  const needle = String(selectedId);
  return seriesBodyConstructionOptions(series).find((item) => String(item.id) === needle) || null;
}

export function findSeriesNeckConstructionOption(series, selectedId) {
  if (selectedId == null || selectedId === "") return null;
  const needle = String(selectedId);
  return seriesNeckConstructionOptions(series).find((item) => String(item.id) === needle) || null;
}

function translationName(item, language) {
  return trimText(item?.translations?.[language]?.name);
}

export function constructionListFromAttributes(attributes, key) {
  const source = attributes && typeof attributes === "object" && !Array.isArray(attributes)
    ? attributes[key]
    : null;
  if (!Array.isArray(source)) return [];
  return source
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const id = trimText(item.id);
      const enName = translationName(item, "en") || trimText(item.name);
      const viName = translationName(item, "vi") || enName;
      if (!id && !enName && !viName) return null;
      return {
        clientKey: id || `row-${index}`,
        id,
        enName,
        viName,
        active: item.active !== false,
        sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index,
        pieceCount: parseConstructionPieceCount(item),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
}

function allocateId(name, used) {
  const base = slugifyConstructionId(name) || "option";
  let next = CONSTRUCTION_ID_PATTERN.test(base) ? base : "option";
  let suffix = 2;
  while (used.has(next)) {
    const candidate = `${base.slice(0, Math.max(1, CONSTRUCTION_ID_MAX - `-${suffix}`.length))}-${suffix}`;
    next = CONSTRUCTION_ID_PATTERN.test(candidate) ? candidate : `option-${suffix}`;
    suffix += 1;
  }
  used.add(next);
  return next;
}

export function sanitizeConstructionList(list) {
  const used = new Set();
  const next = [];
  for (const item of Array.isArray(list) ? list : []) {
    if (!item || typeof item !== "object") continue;
    const enName = trimText(item.enName).slice(0, CONSTRUCTION_NAME_MAX);
    const viName = trimText(item.viName).slice(0, CONSTRUCTION_NAME_MAX);
    if (!enName && !viName) continue;
    const lockedId = trimText(item.id);
    let id = lockedId;
    if (id && CONSTRUCTION_ID_PATTERN.test(id) && id.length <= CONSTRUCTION_ID_MAX && !used.has(id)) {
      used.add(id);
    } else {
      id = allocateId(enName || viName, used);
    }
    const pieceCount = parseConstructionPieceCount({ ...item, id });
    next.push({
      id,
      sortOrder: next.length,
      active: item.active !== false,
      name: enName || viName,
      translations: {
        en: { name: enName || viName },
        vi: { name: viName || enName },
      },
      ...(pieceCount != null ? { pieceCount } : {}),
    });
  }
  return next;
}

function assignConstruction(next, key, formList, existing) {
  const sanitized = sanitizeConstructionList(formList);
  const had = Array.isArray(existing?.[key]);
  if (!sanitized.length && !had) {
    delete next[key];
    return;
  }
  next[key] = sanitized;
}

export function mergeSeriesConstructionAttributes(existing, bodyConstruction, neckConstruction) {
  const next = existing && typeof existing === "object" && !Array.isArray(existing)
    ? { ...existing }
    : {};
  assignConstruction(next, BODY_CONSTRUCTION_ATTR, bodyConstruction, existing);
  assignConstruction(next, NECK_CONSTRUCTION_ATTR, neckConstruction, existing);
  return next;
}

export function moveConstructionOption(list, index, offset) {
  const items = Array.isArray(list) ? [...list] : [];
  const nextIndex = index + offset;
  if (index < 0 || nextIndex < 0 || index >= items.length || nextIndex >= items.length) return items;
  const [row] = items.splice(index, 1);
  items.splice(nextIndex, 0, row);
  return items;
}
