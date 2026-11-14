import { selectionAliases } from "./wizardSelection.js";
import { choiceImageSrc } from "./wizardCatalog.js";

/**
 * Mesh name conventions for workshop GLBs. Real models must be inspected
 * and listed per entry — these are fallbacks only when a registry row omits
 * `meshes`.
 */
export const DEFAULT_MESH_SLOTS = {
  body: ["Body", "body", "BodyMesh"],
  top: ["Top", "top", "BodyTop", "TopMesh"],
  neck: ["Neck", "neck", "NeckMesh"],
  fretboard: ["Fretboard", "Fingerboard", "fretboard", "fingerboard"],
  headstock: ["Headstock", "headstock"],
  pickups: ["Pickup", "Pickups", "pickup"],
  bridge: ["Bridge", "bridge"],
  hardware: ["Hardware", "Tuners", "Tuner", "tuners", "Knobs", "hardware"],
};

export const GUITAR_3D_SLOTS = Object.keys(DEFAULT_MESH_SLOTS);

/** PBR scalars only — not textures. Applied when a GLB is actually loaded. */
export const FINISH_SHEEN_PRESETS = {
  gloss: { roughness: 0.14, clearcoat: 0.72, clearcoatRoughness: 0.1 },
  satin: { roughness: 0.42, clearcoat: 0.22, clearcoatRoughness: 0.28 },
  matte: { roughness: 0.78, clearcoat: 0.04, clearcoatRoughness: 0.55 },
  "open-pore": { roughness: 0.7, clearcoat: 0, clearcoatRoughness: 1 },
};

export const DEFAULT_3D_CAMERA = {
  front: { position: [1.15, 0.58, 1.55], target: [0, 0.32, 0] },
  back: { position: [-1.15, 0.58, -1.55], target: [0, 0.32, 0] },
};

/**
 * Shape → GLB registry. Empty until workshop files exist.
 * Example row (do not enable without a real GLB at `url`):
 * {
 *   id: "modern-double-cutaway",
 *   shapeKeys: ["modern-double-cutaway"],
 *   url: "/models/guitars/modern-double-cutaway/model.glb",
 *   meshes: { body: ["Body"], top: ["Top"], neck: ["Neck"], fretboard: ["Fretboard"] },
 * }
 */
export const WIZARD_GUITAR_3D_MODELS = [];

/** Wood PBR maps keyed by option aliases. Empty until unique maps exist. */
export const WIZARD_GUITAR_3D_WOODS = [];

/** Hardware / pickup / bridge maps or metal colors. Empty until assets exist. */
export const WIZARD_GUITAR_3D_HARDWARE = [];

const GLB_EXT = /\.(glb|gltf)(\?.*)?$/i;
const MAP_KEYS = ["map", "albedoMap", "normalMap", "roughnessMap", "metalnessMap", "aoMap"];

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function trimmedString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function optionAliases(option) {
  return selectionAliases(option, option?.id);
}

export function optionLooksLikeNone(option) {
  if (!option) return true;
  if (option.kind === "none" || asObject(option.attributes).kind === "none") return true;
  const id = String(option.id || option.code || "").toLowerCase();
  return id === "none" || id.endsWith(".none");
}

export function guitar3dSrc(path, resolveUpload) {
  const trimmed = trimmedString(path);
  if (!trimmed) return "";
  return choiceImageSrc(trimmed, resolveUpload);
}

export function optionModelUrl(option) {
  if (!option) return "";
  const attrs = asObject(option.attributes);
  for (const value of [option.modelPath, option.modelGlb, option.glb, option.gltf, attrs.modelPath, attrs.modelGlb, attrs.glb, attrs.gltf]) {
    const path = trimmedString(value);
    if (path && GLB_EXT.test(path)) return path;
  }
  return "";
}

function collectMaps(source) {
  const attrs = asObject(source?.attributes);
  const pbr = asObject(source?.pbr || attrs.pbr);
  const maps = {};
  const pools = [source, attrs, pbr];
  for (const pool of pools) {
    for (const key of MAP_KEYS) {
      const path = trimmedString(pool?.[key]);
      if (!path) continue;
      if (key === "albedoMap" && !maps.map) maps.map = path;
      else if (!maps[key === "albedoMap" ? "map" : key]) maps[key === "albedoMap" ? "map" : key] = path;
    }
    const textureMap = trimmedString(pool?.textureMap);
    if (textureMap && !maps.map) maps.map = textureMap;
  }
  return Object.keys(maps).length ? maps : null;
}

function findByKeys(list, option) {
  if (!option || !Array.isArray(list) || list.length === 0) return null;
  const aliases = optionAliases(option);
  return (
    list.find((entry) => {
      const keys = Array.isArray(entry.shapeKeys)
        ? entry.shapeKeys
        : Array.isArray(entry.optionKeys)
          ? entry.optionKeys
          : [entry.id];
      return keys.some((key) => aliases.has(String(key)));
    }) || null
  );
}

export function matchModelForShape(shape, models = WIZARD_GUITAR_3D_MODELS) {
  const embedded = optionModelUrl(shape);
  const registered = findByKeys(models, shape);
  if (registered?.url) {
    return {
      id: registered.id || String([...optionAliases(shape)][0] || "shape"),
      url: registered.url,
      meshes: { ...DEFAULT_MESH_SLOTS, ...asObject(registered.meshes) },
      camera: registered.camera || DEFAULT_3D_CAMERA,
      source: "registry",
    };
  }
  if (embedded) {
    return {
      id: String([...optionAliases(shape)][0] || "shape"),
      url: embedded,
      meshes: { ...DEFAULT_MESH_SLOTS, ...asObject(asObject(shape.attributes).meshes) },
      camera: DEFAULT_3D_CAMERA,
      source: "option",
    };
  }
  return null;
}

export function meshNameMatches(meshName, patterns) {
  const name = String(meshName || "").trim().toLowerCase();
  if (!name) return false;
  for (const pattern of patterns || []) {
    const needle = String(pattern || "").trim().toLowerCase();
    if (!needle) continue;
    if (name === needle) return true;
    if (name.startsWith(`${needle}_`) || name.endsWith(`_${needle}`)) return true;
    if (name.startsWith(`${needle}-`) || name.endsWith(`-${needle}`)) return true;
  }
  return false;
}

export function assignMeshesToSlots(meshNames, slots = DEFAULT_MESH_SLOTS) {
  const assigned = {};
  for (const slot of GUITAR_3D_SLOTS) assigned[slot] = [];
  const used = new Set();
  for (const slot of GUITAR_3D_SLOTS) {
    for (const name of meshNames || []) {
      if (used.has(name)) continue;
      if (!meshNameMatches(name, slots[slot])) continue;
      assigned[slot].push(name);
      used.add(name);
    }
  }
  return assigned;
}

function sheenFromFinish(finishType) {
  const raw = trimmedString(finishType?.sheen || asObject(finishType?.attributes).sheen).toLowerCase();
  if (raw && FINISH_SHEEN_PRESETS[raw]) return raw;
  return "";
}

function finishColorHex(finishColor) {
  const swatch = trimmedString(finishColor?.swatch || asObject(finishColor?.attributes).swatch);
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(swatch) ? swatch : "";
}

function woodIntent(option, woods, slot) {
  if (!option || optionLooksLikeNone(option)) {
    return { slot, applied: false, reason: "none-or-empty" };
  }
  const registered = findByKeys(woods, option);
  const maps = collectMaps(registered) || collectMaps(option);
  if (!maps) {
    return {
      slot,
      applied: false,
      reason: "no-pbr-maps",
      optionId: option.id || option.code || "",
    };
  }
  return {
    slot,
    applied: true,
    reason: registered ? "registry" : "option-attributes",
    optionId: option.id || option.code || "",
    maps,
    uvRepeat: registered?.uvRepeat || [1, 1],
  };
}

function hardwareIntent(option, hardware, slot) {
  if (!option || optionLooksLikeNone(option)) {
    return { slot, applied: false, reason: "none-or-empty" };
  }
  const registered = findByKeys(hardware, option);
  const maps = collectMaps(registered) || collectMaps(option);
  const color = trimmedString(registered?.color || option.swatch);
  const metalness = typeof registered?.metalness === "number" ? registered.metalness : null;
  const roughness = typeof registered?.roughness === "number" ? registered.roughness : null;
  if (!maps && !color) {
    return { slot, applied: false, reason: "no-hardware-asset", optionId: option.id || option.code || "" };
  }
  return {
    slot,
    applied: true,
    reason: registered ? "registry" : "option-attributes",
    optionId: option.id || option.code || "",
    maps,
    color: color || "",
    metalness,
    roughness,
  };
}

export function resolveGuitar3dMaterials(builder = {}, woods = WIZARD_GUITAR_3D_WOODS, hardware = WIZARD_GUITAR_3D_HARDWARE) {
  const sheen = sheenFromFinish(builder.finishType);
  const tint = finishColorHex(builder.finishColor);
  const body = woodIntent(builder.bodyWood, woods, "body");
  const top = woodIntent(builder.topWood, woods, "top");
  const neck = woodIntent(builder.neckWood, woods, "neck");
  const fretboard = woodIntent(builder.fingerboardWood, woods, "fretboard");
  return {
    body,
    top,
    neck,
    fretboard,
    headstock: { slot: "headstock", applied: false, reason: "no-dedicated-asset" },
    pickups: hardwareIntent(builder.pickupType, hardware, "pickups"),
    bridge: hardwareIntent(builder.bridge, hardware, "bridge"),
    hardware: hardwareIntent(builder.hardwareFinish || builder.tuner, hardware, "hardware"),
    finish: {
      sheen,
      sheenPreset: sheen ? FINISH_SHEEN_PRESETS[sheen] : null,
      color: tint,
      applied: Boolean(sheen || tint),
    },
  };
}

export function resolveGuitar3d(
  builder = {},
  {
    models = WIZARD_GUITAR_3D_MODELS,
    woods = WIZARD_GUITAR_3D_WOODS,
    hardware = WIZARD_GUITAR_3D_HARDWARE,
    resolveUpload,
  } = {},
) {
  const materials = resolveGuitar3dMaterials(builder, woods, hardware);
  const shape = builder.shape;
  if (!shape) {
    return { mode: "fallback-2d", reason: "no-shape", model: null, materials, keys: {} };
  }
  const matched = matchModelForShape(shape, models);
  if (!matched) {
    return {
      mode: "fallback-2d",
      reason: "no-model",
      model: null,
      materials,
      keys: { shape: [...optionAliases(shape)] },
    };
  }
  const url = guitar3dSrc(matched.url, resolveUpload);
  if (!url) {
    return {
      mode: "fallback-2d",
      reason: "no-model",
      model: null,
      materials,
      keys: { shape: [...optionAliases(shape)] },
    };
  }
  return {
    mode: "model",
    reason: "ok",
    model: { ...matched, url },
    materials,
    keys: {
      shape: [...optionAliases(shape)],
      bodyWood: builder.bodyWood ? [...optionAliases(builder.bodyWood)] : [],
      topWood: builder.topWood ? [...optionAliases(builder.topWood)] : [],
      finishType: builder.finishType ? [...optionAliases(builder.finishType)] : [],
      finishColor: builder.finishColor ? [...optionAliases(builder.finishColor)] : [],
    },
  };
}

export function guitar3dMaterialSignature(materials) {
  if (!materials) return "";
  return JSON.stringify({
    body: materials.body,
    top: materials.top,
    neck: materials.neck,
    fretboard: materials.fretboard,
    pickups: materials.pickups,
    bridge: materials.bridge,
    hardware: materials.hardware,
    finish: materials.finish,
  });
}

export const WIZARD_GUITAR_3D_ASSET_SPEC = {
  models: [
    {
      id: "per-body-shape",
      path: "public/models/guitars/<shape-key>/model.glb",
      format: "glTF Binary (.glb)",
      scale: "real-world meters, guitar ~0.9–1.1m long, origin at body center",
      meshes: DEFAULT_MESH_SLOTS,
      notes: "Separate meshes (or material slots) for body, top, neck, fretboard, headstock, pickups, bridge, tuners. Do not merge into one mesh if those parts must change independently.",
    },
  ],
  textures: {
    wood: {
      path: "public/textures/wood/<wood-key>/{albedo,normal,roughness}.jpg",
      size: "2048×2048 max (1024×1024 preferred on mobile)",
      colorSpace: "albedo sRGB; data maps linear",
      unique: "One set per wood species — never reuse alder maps for mahogany.",
    },
    finish: {
      path: "public/textures/finish/<sheen>/ if clearcoat or roughness maps exist",
      fallback: "Sheen currently uses PBR scalars from finishType.sheen (gloss/satin/matte/open-pore).",
    },
    hardware: {
      path: "public/textures/hardware/<finish-key>/{albedo,metalness,roughness}.jpg",
    },
  },
  missingInRepo: {
    glb: true,
    woodPbr: true,
    hardwarePbr: true,
  },
};
