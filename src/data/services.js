const SCRIPT = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;

export function safeServiceHtml(value) {
  return String(value || "").replace(SCRIPT, "").trim();
}

export const FALLBACK_SERVICE_CATEGORIES = [
  { slug: "guitar-repair", key: "repair", linkMode: "details" },
  { slug: "tools-equipment", key: "tools", linkMode: "details" },
  { slug: "3d-design-cnc", key: "cnc", linkMode: "contact" },
];

export function serviceLocale(record, language) {
  if (!record || typeof record !== "object") return {};
  const current = record.translations?.[language];
  if (current && typeof current === "object") return current;
  const other = record.translations?.[language === "vi" ? "en" : "vi"];
  return other && typeof other === "object" ? other : {};
}

export function mergePublicCategories(apiItems) {
  const list = Array.isArray(apiItems) ? apiItems.filter((item) => item && item.slug) : [];
  if (list.length) {
    return [...list].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  return FALLBACK_SERVICE_CATEGORIES.map((item) => ({
    id: item.slug,
    slug: item.slug,
    linkMode: item.linkMode,
    imagePath: null,
    fallbackKey: item.key,
    translations: {},
  }));
}

export function categoryFallbackKey(slug) {
  return FALLBACK_SERVICE_CATEGORIES.find((item) => item.slug === slug)?.key || "";
}

export function newServiceOptionId(prefix) {
  const bytes = new Uint8Array(6);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return `${prefix}${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function emptyOptionGroup() {
  return {
    id: newServiceOptionId("g"),
    enName: "",
    viName: "",
    values: [emptyOptionValue()],
  };
}

export function emptyOptionValue() {
  return {
    id: newServiceOptionId("v"),
    enLabel: "",
    viLabel: "",
    price: "",
  };
}

export function optionGroupsFromItem(item, { remapIds = false } = {}) {
  const idMap = new Map();
  const groups = Array.isArray(item?.optionGroups) ? item.optionGroups : [];
  const mapped = groups.map((group) => {
    const id = remapIds ? newServiceOptionId("g") : group.id || newServiceOptionId("g");
    if (group.id) idMap.set(String(group.id), id);
    return {
      id,
      enName: group.translations?.en?.name || group.name || "",
      viName: group.translations?.vi?.name || "",
      values: (group.values || []).map((value) => {
        const valueId = remapIds ? newServiceOptionId("v") : value.id || newServiceOptionId("v");
        if (value.id) idMap.set(String(value.id), valueId);
        return {
          id: valueId,
          enLabel: value.translations?.en?.label || value.label || "",
          viLabel: value.translations?.vi?.label || "",
          price: value.price == null ? "" : String(value.price),
        };
      }),
    };
  });
  const variantPrices = (Array.isArray(item?.variantPrices) ? item.variantPrices : [])
    .map((row) => ({
      valueIds: (row.valueIds || []).map((id) => idMap.get(String(id)) || id),
      price: row.price == null ? "" : String(row.price),
    }))
    .filter((row) => row.valueIds.length > 0);
  return { optionGroups: mapped, variantPrices };
}

export function optionGroupsToPayload(optionGroups, variantPrices) {
  return {
    optionGroups: (optionGroups || []).map((group) => ({
      id: group.id,
      translations: {
        en: { name: group.enName },
        vi: { name: group.viName },
      },
      values: (group.values || []).map((value) => ({
        id: value.id,
        translations: {
          en: { label: value.enLabel },
          vi: { label: value.viLabel },
        },
        price: value.price === "" ? null : Number(value.price),
      })),
    })),
    variantPrices: (variantPrices || [])
      .filter((row) => row.price !== "" && row.price != null)
      .map((row) => ({
        valueIds: row.valueIds || [],
        price: Number(row.price),
      })),
  };
}

function comboKey(valueIds) {
  return [...new Set((valueIds || []).map(String))].sort().join("|");
}

export function resolveServiceItemPrice(item, selectedIds) {
  const amount = item?.price == null || Number(item.price) <= 0 ? null : item.price;
  const groups = Array.isArray(item?.optionGroups) ? item.optionGroups : [];
  if (!groups.length) return amount;
  const selected = Array.isArray(selectedIds) ? selectedIds.map(String) : [];
  const key = comboKey(selected);
  const combo = (item.variantPrices || []).find((row) => comboKey(row.valueIds) === key);
  if (combo && combo.price != null && Number(combo.price) > 0) return combo.price;
  const priced = selected
    .map((id) => groups.flatMap((group) => group.values || []).find((value) => String(value.id) === id))
    .filter((value) => value && value.price != null && Number(value.price) > 0);
  if (priced.length === 1) return priced[0].price;
  return amount;
}

export function optionGroupLabel(group, language) {
  return serviceLocale(group, language).name || group?.name || "";
}

export function optionValueLabel(value, language) {
  return serviceLocale(value, language).label || value?.label || "";
}

