import { choiceImageSrc } from "./wizardCatalog.js";

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

function isLinePixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return r > 130 && g > 90 && b < r * 0.88 && max - min > 22 && max < 250;
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
  return {
    ...guitar,
    imageBack: guitarBack?.imageBack || null,
    backSource: guitarBack?.backSource || null,
    layers: {
      bodyWoodImage: optionImage(source.bodyWood) || null,
      topWoodImage: optionImage(source.topWood) || null,
      finishSwatch: optionSwatch(source.finishColor) || null,
    },
  };
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
  return {
    bodyWood: layers.bodyWoodImage ? choiceImageSrc(layers.bodyWoodImage, resolveUpload) : "",
    topWood: layers.topWoodImage ? choiceImageSrc(layers.topWoodImage, resolveUpload) : "",
    finishSwatch: layers.finishSwatch || "",
  };
}

export function fillPreviewFromImageData(guitarData, fillData, tint, width, height) {
  const out = new Uint8ClampedArray(guitarData);
  const bg = { r: out[0], g: out[1], b: out[2] };
  const color = parseHex(tint);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    if (near(r, bg.r, 26) && near(g, bg.g, 26) && near(b, bg.b, 26)) continue;
    if (isLinePixel(r, g, b)) continue;
    let nr = r;
    let ng = g;
    let nb = b;
    const shade = 0.42 + (r + g + b) / (255 * 3) * 0.58;
    if (fillData) {
      nr = fillData[i] * shade;
      ng = fillData[i + 1] * shade;
      nb = fillData[i + 2] * shade;
    }
    if (color && !fillData) {
      nr = (nr * color.r) / 255;
      ng = (ng * color.g) / 255;
      nb = (nb * color.b) / 255;
    }
    out[i] = nr;
    out[i + 1] = ng;
    out[i + 2] = nb;
  }
  return { data: out, width, height };
}
