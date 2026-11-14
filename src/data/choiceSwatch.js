const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const CHECKER = {
  backgroundColor: "#2a2a2a",
  backgroundImage:
    "linear-gradient(45deg,#6b6b6b 25%,transparent 25%),linear-gradient(-45deg,#6b6b6b 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#6b6b6b 75%),linear-gradient(-45deg,transparent 75%,#6b6b6b 75%)",
  backgroundPosition: "0 0,0 4px,4px -4px,-4px 0",
  backgroundSize: "8px 8px",
};

const RULES = [
  { re: /\b(transparent|see through|trong suot|clear)\b/, css: CHECKER },
  {
    re: /\b(metallic|kim loai|metal flake)\b/,
    css: {
      backgroundImage: "linear-gradient(135deg,#6f757c 0%,#e4e7eb 42%,#9aa1a8 72%,#d5d8dc 100%)",
    },
  },
  {
    re: /\b(trao doi|discuss|custom color|custom colour)\b/,
    css: {
      backgroundImage: "conic-gradient(from 210deg,#c6a15b,#8b5a2b,#ead8b0,#3d2b1f,#c6a15b)",
    },
  },
  {
    re: /\b(sunburst|amber burst)\b/,
    css: {
      backgroundImage: "radial-gradient(circle at 50% 35%,#f0d089 0%,#c48a3a 38%,#5a2e12 78%,#1a100c 100%)",
    },
  },
  { re: /\b(solid|son dac)\b/, color: "#5a5a5a" },
  { re: /\b(vintage white|vintage)\b/, color: "#e8dcc8" },
  { re: /\b(natural wood|natural|go tu nhien)\b/, color: "#8b5a2b" },
  { re: /\b(amber)\b/, color: "#c48a3a" },
  { re: /\b(black|den)\b/, color: "#171717" },
  { re: /\b(white|trang)\b/, color: "#f4f0e6" },
  { re: /\b(cherry|do cherry)\b/, color: "#6b1c1c" },
  { re: /\b(red|do)\b/, color: "#8b1e1e" },
  { re: /\b(blue|xanh duong)\b/, color: "#1e3a5f" },
  { re: /\b(green|xanh la)\b/, color: "#2d4a2b" },
  { re: /\b(gold|vang)\b/, color: "#c6a15b" },
  { re: /\b(silver|bac)\b/, color: "#c5c9ce" },
  { re: /\b(chrome)\b/, color: "#d8dce0" },
  { re: /\b(nickel)\b/, color: "#b7b09f" },
  { re: /\b(copper|dong)\b/, color: "#b87333" },
  { re: /\b(walnut|oc cho)\b/, color: "#5a3a28" },
  { re: /\b(tobacco)\b/, color: "#6e3b1e" },
  { re: /\b(ivory|nga)\b/, color: "#f3efe6" },
  { re: /\b(charcoal)\b/, color: "#2b2b2b" },
];

export function foldChoiceText(text) {
  return String(text ?? "")
    .replace(/đ/gi, "d")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function catalogPaint(swatch) {
  if (typeof swatch !== "string") return null;
  const value = swatch.trim();
  if (!value) return null;
  if (HEX.test(value) || /^(rgb|hsl)a?\(/i.test(value)) return { backgroundColor: value };
  return null;
}

function optionHaystack(option) {
  if (!option || typeof option !== "object") return "";
  return foldChoiceText(
    [option.id, option.value, option.label, option.name, option.code].filter(Boolean).join(" "),
  );
}

export function choiceSwatchCss(option) {
  const fromCatalog = catalogPaint(option?.swatch);
  if (fromCatalog) return fromCatalog;
  const text = optionHaystack(option);
  if (!text) return null;
  for (const rule of RULES) {
    if (!rule.re.test(text)) continue;
    if (rule.css) return rule.css;
    return { backgroundColor: rule.color };
  }
  return null;
}

export function choiceSwatchColor(option) {
  const css = choiceSwatchCss(option);
  return css?.backgroundColor || "";
}
