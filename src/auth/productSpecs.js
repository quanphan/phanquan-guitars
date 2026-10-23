export const PRODUCT_TYPE_KEY = "productType";
export const PRODUCT_TYPES = {
  CUSTOM_ORDER: "custom-order",
  READY_STOCK: "ready-stock",
};

export const SPEC_VALUE_MAX = 1000;

export const PICKUP_PART_KEYS = [
  "neckPickup",
  "middlePickup",
  "bridgePickup",
  "pickupModel",
  "pickupSelector",
];

export const SPEC_GROUPS = [
  {
    id: "instrument",
    keys: ["bodyConstruction", "stringCount", "scaleLength", "fretCount"],
  },
  {
    id: "body",
    keys: ["bodyWood", "topWood", "bodyContour"],
  },
  {
    id: "neck",
    keys: [
      "neckWood",
      "neckConstruction",
      "neckProfile",
      "fingerboardWood",
      "fingerboardRadius",
      "fretMaterial",
      "nutWidth",
      "nut",
    ],
  },
  {
    id: "electronics",
    keys: ["pickupConfiguration", "controlsAndSwitching", "bridge", "tuningSystem", "hardwareFinish"],
  },
  {
    id: "finish",
    keys: ["finishType", "finishColor", "inlay"],
  },
  {
    id: "additional",
    keys: ["weight", "specialFeatures", "otherDetails"],
  },
];

export const SPEC_FORM_KEYS = SPEC_GROUPS.flatMap((group) => group.keys);

export const SPEC_TEXTAREA_KEYS = [
  "pickupConfiguration",
  "controlsAndSwitching",
  "specialFeatures",
  "otherDetails",
];

const OBJECT_ID = /^[a-f0-9]{24}$/i;

const PICKUP_LABELS = [
  ["pickupModel", "Pickup"],
  ["neckPickup", "Neck"],
  ["middlePickup", "Middle"],
  ["bridgePickup", "Bridge"],
  ["pickupSelector", "Selector"],
];

export function emptySpecForm() {
  return Object.fromEntries(SPEC_FORM_KEYS.map((key) => [key, ""]));
}

export function isProductType(value) {
  return value === PRODUCT_TYPES.CUSTOM_ORDER || value === PRODUCT_TYPES.READY_STOCK;
}

export function readProductType(product) {
  if (isProductType(product?.productType)) return product.productType;
  if (isProductType(product?.specs?.[PRODUCT_TYPE_KEY])) return product.specs[PRODUCT_TYPE_KEY];
  return null;
}

export function productsOfType(items, productType) {
  if (!isProductType(productType)) return [];
  return (items || []).filter((item) => readProductType(item) === productType);
}

export function combinedPickupText(specs) {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return "";
  const existing = typeof specs.pickupConfiguration === "string" ? specs.pickupConfiguration.trim() : "";
  const parts = [];
  if (existing) parts.push(existing);
  for (const [key, label] of PICKUP_LABELS) {
    const value = typeof specs[key] === "string" ? specs[key].trim() : "";
    if (!value) continue;
    if (existing && existing.includes(value)) continue;
    parts.push(`${label}: ${value}`);
  }
  return parts.join("\n");
}

export function specsToForm(specs) {
  const form = emptySpecForm();
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return form;
  for (const key of SPEC_FORM_KEYS) {
    if (typeof specs[key] === "string") form[key] = specs[key];
  }
  if (!form.finishColor) {
    if (typeof specs.finishColor === "string" && specs.finishColor.trim()) form.finishColor = specs.finishColor;
    else if (typeof specs.colour === "string") form.finishColor = specs.colour;
  }
  const pickup = combinedPickupText(specs);
  if (pickup) form.pickupConfiguration = pickup;
  if (!form.hardwareFinish && typeof specs.hardwareManufacturerFinish === "string") {
    form.hardwareFinish = specs.hardwareManufacturerFinish;
  }
  return form;
}

export function editorFormFromProduct(item) {
  return {
    ...emptySpecForm(),
    ...specsToForm(item?.specs),
    name: item?.name || "",
    code: item?.code || "",
    productType: readProductType(item) || "",
    qty: item?.inventory?.quantity ?? item?.qty ?? "",
    price: item?.price == null ? "" : String(item.price),
    unit: item?.unit || "",
    description: item?.description || "",
    descriptionDetail: item?.descriptionDetail || "",
    status: item?.status === "published" ? "published" : "draft",
    sortOrder: item?.sortOrder || 0,
    image: item?.image || "",
    images: Array.isArray(item?.images) ? item.images.filter(Boolean) : [],
    categoryId: item?.category?.id || "",
    instrumentTypeId: item?.instrumentType?.id || "",
    bodyShapeId: item?.bodyShape?.id || "",
    seriesId: item?.series?.id || "",
  };
}

export function copyFormFromProduct(item) {
  const form = editorFormFromProduct(item);
  return {
    ...form,
    code: "",
    qty: "",
    status: "draft",
    sortOrder: 0,
  };
}

export function mergeProductSpecs(existing, specForm) {
  const next = {};
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    for (const [key, value] of Object.entries(existing)) {
      if (key === PRODUCT_TYPE_KEY) continue;
      if (typeof value === "string" && value.trim()) next[key] = value.trim().slice(0, SPEC_VALUE_MAX);
    }
  }
  for (const key of SPEC_FORM_KEYS) {
    const value = typeof specForm?.[key] === "string" ? specForm[key].trim() : "";
    if (value) next[key] = value.slice(0, SPEC_VALUE_MAX);
    else delete next[key];
  }
  if (typeof specForm?.finishColor === "string") {
    const color = specForm.finishColor.trim();
    if (color) {
      next.finishColor = color.slice(0, SPEC_VALUE_MAX);
      next.colour = color.slice(0, SPEC_VALUE_MAX);
    } else {
      delete next.finishColor;
      delete next.colour;
    }
  }
  if (next.hardwareFinish && next.hardwareManufacturerFinish === next.hardwareFinish) {
    delete next.hardwareManufacturerFinish;
  }
  delete next[PRODUCT_TYPE_KEY];
  const keys = Object.keys(next);
  if (keys.length > 30) {
    const keep = new Set(SPEC_FORM_KEYS);
    for (const key of keys) {
      if (Object.keys(next).length <= 30) break;
      if (!keep.has(key)) delete next[key];
    }
  }
  return next;
}

export function displaySpecValue(value, catalogNames = {}) {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text) return "";
  if (OBJECT_ID.test(text) && catalogNames[text]) return catalogNames[text];
  if (OBJECT_ID.test(text) && !catalogNames[text]) return "";
  if (!/\s/.test(text) && /[A-Za-z]Id$/.test(text)) return "";
  if (!/\s/.test(text) && /[a-z]+-[a-z]+\.[a-z]/i.test(text)) return "";
  return text;
}

export function specsToTabs(specs, catalogNames = {}) {
  const source = specs && typeof specs === "object" && !Array.isArray(specs) ? specs : {};
  const tabs = {
    body: {},
    neck: {},
    electronicsHardware: {},
    finish: {},
    additional: {},
  };
  const assign = (tab, key) => {
    const value = displaySpecValue(source[key], catalogNames);
    if (value) tabs[tab][key] = value;
  };
  const combinedPickup = displaySpecValue(source.pickupConfiguration, catalogNames);

  for (const key of ["bodyWood", "topWood", "bodyConstruction", "bodyContour", "neckHeel", "binding"]) {
    assign("body", key);
  }
  for (const key of [
    "neckWood",
    "neckConstruction",
    "neckProfile",
    "scaleLength",
    "multiscaleRange",
    "stringCount",
    "fretCount",
    "fingerboardWood",
    "fingerboardRadius",
    "nutWidth",
    "fretMaterial",
    "nut",
  ]) {
    assign("neck", key);
  }
  if (combinedPickup) tabs.electronicsHardware.pickupConfiguration = combinedPickup;
  else {
    for (const key of ["pickupConfiguration", ...PICKUP_PART_KEYS]) assign("electronicsHardware", key);
  }
  for (const key of ["controlsAndSwitching", "preamp", "bridge", "tuningSystem", "stringSpacing"]) {
    assign("electronicsHardware", key);
  }
  if (displaySpecValue(source.hardwareFinish, catalogNames)) assign("electronicsHardware", "hardwareFinish");
  else assign("electronicsHardware", "hardwareManufacturerFinish");
  assign("finish", "finishType");
  const finishColor = displaySpecValue(source.finishColor, catalogNames) || displaySpecValue(source.colour, catalogNames);
  if (finishColor) tabs.finish.colour = finishColor;
  assign("finish", "inlay");
  for (const key of ["weight", "designStory", "specialFeatures", "setupNotes", "buildNotes", "otherDetails"]) {
    assign("additional", key);
  }
  return tabs;
}

export function productQuantity(product) {
  const raw = product?.inventory?.quantity ?? product?.qty;
  const quantity = Number(raw);
  return Number.isFinite(quantity) ? quantity : null;
}

export function productImagePaths(product) {
  const paths = [];
  if (typeof product?.image === "string" && product.image.trim()) paths.push(product.image.trim());
  if (Array.isArray(product?.images)) {
    for (const item of product.images) {
      if (typeof item === "string" && item.trim() && !paths.includes(item.trim())) {
        paths.push(item.trim());
      }
    }
  }
  return paths;
}
