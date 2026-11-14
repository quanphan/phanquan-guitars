import { choiceImageSrc } from "./wizardCatalog.js";
import { isNoneTopOption, selectionAliases } from "./wizardSelection.js";

/** Fallback tones when an option has no photo/swatch. Not used as shared grain. */
const WOOD_TONES = {
  alder: "#c4a06a",
  mahogany: "#703c28",
  "swamp-ash": "#d2c09a",
  walnut: "#5a3a28",
  "hard-maple": "#e6d3a8",
  maple: "#ead8b0",
  teak: "#9c6a38",
  "flamed-maple": "#e2c48a",
  "quilted-maple": "#e0c49a",
  "exotic-figured": "#c48a4a",
  exotic: "#b57a40",
  "stabilized-burl": "#a45c32",
  sapele: "#8a4a2e",
  "flame-maple": "#e2c48a",
};

const FINISH_TONES = {
  black: "#1a1a1a",
  white: "#f3efe6",
  vintage: "#e8dcc8",
  "vintage-white": "#e8dcc8",
  "natural-wood": "#8b5a2b",
  "natural-amber-burst": "#c48a3a",
};

function optionLeafKeys(option) {
  const keys = [];
  for (const value of selectionAliases(option, option?.id)) {
    const text = String(value);
    keys.push(text.toLowerCase());
    const dot = text.lastIndexOf(".");
    if (dot >= 0) keys.push(text.slice(dot + 1).toLowerCase());
  }
  return keys;
}

function toneFromTable(option, table) {
  if (!option) return "";
  for (const key of optionLeafKeys(option)) {
    if (table[key]) return table[key];
  }
  return "";
}

function optionImage(option) {
  if (!option || typeof option.image !== "string") return "";
  return option.image.trim();
}

function optionBackImage(option) {
  if (!option || typeof option !== "object") return "";
  const attributes = option.attributes && typeof option.attributes === "object" ? option.attributes : {};
  for (const value of [option.imageBack, option.backImage, attributes.imageBack, attributes.backImage]) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function optionSwatch(option) {
  if (!option || typeof option.swatch !== "string") return "";
  const value = option.swatch.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "";
}

function parseHex(swatch) {
  const value = optionSwatch({ swatch });
  if (!value) return null;
  const hex = value.slice(1);
  const full = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function near(a, b, tolerance) {
  return Math.abs(a - b) <= tolerance;
}

export function isLinePixel(r, g, b, a = 255) {
  if (a < 12) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  if (r > 150 && g > 88 && g < r * 0.95 && b < r * 0.72 && sat > 40 && max < 230) return true;
  const lum = (r + g + b) / 3;
  return lum < 72 && sat < 42;
}

/** True gold/ink stroke — not khaki body wash or leftover gray paper. */
export function isGoldStrokePixel(r, g, b, a = 255) {
  if (a < 24) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const lum = (r + g + b) / 3;
  if (lum < 72 && sat < 42) return true;
  return r >= 160 && sat >= 70 && b < r * 0.55 && g > r * 0.35 && g < r * 0.88 && max < 240;
}

const BODY_CREAM = [239, 230, 214];

/**
 * Rebuild a clean line-art PNG: keep gold strokes, punch true exterior to
 * alpha 0, fill interior holes / gray paper / khaki wash with opaque cream.
 */
export function repairLineArtImageData(data, width, height) {
  const count = width * height;
  const opaque = new Uint8Array(count);
  const keep = new Uint8Array(count);
  for (let i = 0; i < count; i += 1) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const a = data[offset + 3];
    if (a >= 40) opaque[i] = 1;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (isGoldStrokePixel(r, g, b, a) || (isLinePixel(r, g, b, a) && sat >= 80)) {
      keep[i] = 1;
    }
  }
  const openAir = floodExterior(opaque, width, height);
  let interiorCount = 0;
  for (let i = 0; i < count; i += 1) {
    if (!openAir[i]) interiorCount += 1;
  }
  const ratio = interiorCount / count;
  if (ratio < 0.04 || ratio > 0.88) {
    return { data: new Uint8ClampedArray(data), width, height, repaired: false };
  }
  const out = new Uint8ClampedArray(data);
  for (let p = 0, i = 0; p < count; p += 1, i += 4) {
    if (keep[p]) {
      out[i] = data[i];
      out[i + 1] = data[i + 1];
      out[i + 2] = data[i + 2];
      out[i + 3] = 255;
      continue;
    }
    if (openAir[p]) {
      out[i] = 0;
      out[i + 1] = 0;
      out[i + 2] = 0;
      out[i + 3] = 0;
      continue;
    }
    out[i] = BODY_CREAM[0];
    out[i + 1] = BODY_CREAM[1];
    out[i + 2] = BODY_CREAM[2];
    out[i + 3] = 255;
  }
  return { data: out, width, height, repaired: true };
}

function dilateBinary(src, width, height) {
  const out = new Uint8Array(src.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let hit = 0;
      for (let dy = -1; dy <= 1 && !hit; dy += 1) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          if (src[ny * width + nx]) {
            hit = 1;
            break;
          }
        }
      }
      out[y * width + x] = hit;
    }
  }
  return out;
}

function floodExterior(blocked, width, height) {
  const exterior = new Uint8Array(blocked.length);
  const stack = [];
  function seed(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (blocked[index] || exterior[index]) return;
    exterior[index] = 1;
    stack.push(index);
  }
  for (let x = 0; x < width; x += 1) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    seed(0, y);
    seed(width - 1, y);
  }
  while (stack.length) {
    const index = stack.pop();
    const x = index % width;
    const y = (index - x) / width;
    seed(x - 1, y);
    seed(x + 1, y);
    seed(x, y - 1);
    seed(x, y + 1);
  }
  return exterior;
}

/**
 * Closed (or nearly closed) gold/ink outlines: interior is the region that
 * edge flood-fill cannot reach. White body fill is included. Returns ok=false
 * when the outline is too open so filling would paint the whole canvas.
 */
export function buildLineArtInteriorMask(data, width, height) {
  const count = width * height;
  const line = new Uint8Array(count);
  for (let i = 0; i < count; i += 1) {
    const offset = i * 4;
    if (isLinePixel(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])) {
      line[i] = 1;
    }
  }

  let dilated = line;
  for (let pass = 0; pass < 3; pass += 1) dilated = dilateBinary(dilated, width, height);

  const exterior = floodExterior(dilated, width, height);
  const mask = new Uint8Array(count);
  let interiorCount = 0;
  for (let i = 0; i < count; i += 1) {
    if (!exterior[i] && !line[i]) {
      mask[i] = 1;
      interiorCount += 1;
    }
  }
  const ratio = interiorCount / count;
  return {
    mask,
    line,
    count: interiorCount,
    ok: ratio >= 0.04 && ratio <= 0.88,
  };
}

/**
 * Preview uses the guitar silhouette (shape → series → type). Wood grain and
 * finish swatches are optional fill layers and are never used as the guitar
 * photo. Missing layers keep the nearest valid silhouette.
 */
export function resolveGuitarPreview(source = {}) {
  const ranked = [
    { option: source.shape, source: "shape" },
    { option: source.series, source: "series" },
    { option: source.instrumentType, source: "instrumentType" },
  ];
  let guitar = null;
  let guitarBack = null;
  for (const item of ranked) {
    const image = optionImage(item.option);
    if (!guitar && image) {
      guitar = {
        image,
        source: item.source,
        altName: item.option?.name || "",
      };
    }
    const backImage = optionBackImage(item.option);
    if (!guitarBack && backImage) {
      guitarBack = {
        imageBack: backImage,
        backSource: item.source,
      };
    }
  }
  if (!guitar) return null;
  const topWoodImage = isNoneTopOption(source.topWood) ? null : optionImage(source.topWood) || null;
  const fillWoodOption = !isNoneTopOption(source.topWood) && (topWoodImage || toneFromTable(source.topWood, WOOD_TONES))
    ? source.topWood
    : source.bodyWood;
  return {
    ...guitar,
    imageBack: guitarBack?.imageBack || null,
    backSource: guitarBack?.backSource || null,
    layers: {
      bodyWoodImage: optionImage(source.bodyWood) || null,
      topWoodImage,
      woodTone: toneFromTable(fillWoodOption, WOOD_TONES) || null,
      finishSwatch: optionSwatch(source.finishColor) || toneFromTable(source.finishColor, FINISH_TONES) || null,
    },
  };
}

/** Keep /uploads on the page origin so canvas reads are not CORS-tainted. */
export function previewCanvasSrc(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("/uploads/")) return trimmed;
  const match = trimmed.match(/\/uploads\/[^\s?#]+/);
  return match ? match[0] : trimmed;
}

export function guitarPreviewSrc(preview, resolveUpload, side = "front") {
  const path = side === "back" ? preview?.imageBack : preview?.image;
  if (!path) return "";
  return choiceImageSrc(path, resolveUpload);
}

export function guitarPreviewPath(preview, side = "front") {
  if (side === "back") return preview?.imageBack || "";
  return preview?.image || "";
}

export function guitarPreviewLayerSrcs(preview, resolveUpload) {
  const layers = preview?.layers || {};
  const topWood = layers.topWoodImage ? choiceImageSrc(layers.topWoodImage, resolveUpload) : "";
  const bodyWood = layers.bodyWoodImage ? choiceImageSrc(layers.bodyWoodImage, resolveUpload) : "";
  return {
    bodyWood,
    topWood,
    fillWood: topWood || bodyWood,
    woodTone: layers.woodTone || "",
    finishSwatch: layers.finishSwatch || "",
  };
}

function tintChannel(value, tint, amount) {
  return value * (1 - amount) + (value * tint) / 255 * amount;
}

function downsampleRgba(data, width, height, mw, mh) {
  const out = new Uint8ClampedArray(mw * mh * 4);
  for (let y = 0; y < mh; y += 1) {
    const sy = Math.min(height - 1, Math.floor((y * height) / mh));
    for (let x = 0; x < mw; x += 1) {
      const sx = Math.min(width - 1, Math.floor((x * width) / mw));
      const si = (sy * width + sx) * 4;
      const di = (y * mw + x) * 4;
      out[di] = data[si];
      out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2];
      out[di + 3] = data[si + 3];
    }
  }
  return out;
}

export function fillPreviewFromImageData(guitarData, fillData, tint, width, height, woodTone) {
  const out = new Uint8ClampedArray(guitarData);
  const color = parseHex(tint);
  const tone = parseHex(woodTone);
  const longest = Math.max(width, height);
  const maxEdge = 800;
  const mw = longest > maxEdge ? Math.max(1, Math.round((width * maxEdge) / longest)) : width;
  const mh = longest > maxEdge ? Math.max(1, Math.round((height * maxEdge) / longest)) : height;
  const maskSource = mw === width && mh === height
    ? guitarData
    : downsampleRgba(guitarData, width, height, mw, mh);
  const interior = buildLineArtInteriorMask(maskSource, mw, mh);
  const useMask = interior.ok;
  const bg = { r: out[0], g: out[1], b: out[2] };

  for (let y = 0, p = 0, i = 0; y < height; y += 1) {
    const my = Math.min(mh - 1, Math.round((y * mh) / height));
    for (let x = 0; x < width; x += 1, p += 1, i += 4) {
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      const a = out[i + 3];
      const mx = Math.min(mw - 1, Math.round((x * mw) / width));
      const mp = my * mw + mx;
      if (interior.line[mp] || isLinePixel(r, g, b, a)) continue;
      const inside = useMask
        ? interior.mask[mp]
        : !(near(r, bg.r, 26) && near(g, bg.g, 26) && near(b, bg.b, 26));
      if (!inside) continue;

      let nr;
      let ng;
      let nb;
      if (fillData) {
        let fr = fillData[i];
        let fg = fillData[i + 1];
        let fb = fillData[i + 2];
        const grain = (fr + fg + fb) / 3;
        const contrast = 1.55;
        fr = grain + (fr - grain) * contrast;
        fg = grain + (fg - grain) * contrast;
        fb = grain + (fb - grain) * contrast;
        if (tone) {
          const mix = 0.42;
          fr = fr * (1 - mix) + tone.r * mix;
          fg = fg * (1 - mix) + tone.g * mix;
          fb = fb * (1 - mix) + tone.b * mix;
        }
        nr = fr;
        ng = fg;
        nb = fb;
      } else if (tone) {
        nr = tone.r;
        ng = tone.g;
        nb = tone.b;
      } else {
        nr = r;
        ng = g;
        nb = b;
      }
      if (color) {
        const amount = fillData || tone ? 0.62 : 1;
        nr = tintChannel(nr, color.r, amount);
        ng = tintChannel(ng, color.g, amount);
        nb = tintChannel(nb, color.b, amount);
      }
      out[i] = nr;
      out[i + 1] = ng;
      out[i + 2] = nb;
    }
  }
  return { data: out, width, height, usedInteriorMask: useMask };
}
