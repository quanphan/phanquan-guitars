/**
 * Local custom-build catalog (provisional discussion options).
 *
 * Sourced only from this project's existing configurator and product records.
 * Not a confirmed workshop menu. Do not treat names, scales, or radii as
 * officially offered until the workshop confirms them.
 *
 * Backed by existing project data:
 * - Electric + bass instrument types, solid-body / headless series, and
 *   body silhouettes from the previous custom-build catalog.
 * - Scale 24.75″, 25.5″, 27″ and 6/7 strings from featured guitars.
 * - Bass 34″ / 5 strings / 16″ radius from collection mock bass.
 * - Headless electric, 25″–25.5″ multiscale, 6 strings, compound 12″–16″
 *   radius from collection mock electric.
 *
 * Not backed by confirmed catalog data:
 * - Classical and acoustic series, shapes, scales, strings, and radii.
 * - 4- and 6-string bass, 8-string guitar (kept only where the previous
 *   configurator already listed them as discussion options).
 * - 20″ radius (not present in project records).
 *
 * Body/top woods backed by existing records:
 * - Alder body + stabilized burl top (collection bass).
 * - Mahogany body + exotic figured top (collection electric).
 * - Swamp ash (featured PQ-T Custom).
 * - Walnut (featured PQ Baritone).
 * - Maple as a paired top with mahogany (featured PQ Offset).
 * Flame maple, quilted maple, korina, and ash (generic) are not listed.
 *
 * Neck/fingerboard backed by existing records:
 * - Bolt-on + roasted maple neck/fingerboard, asymmetric C, nickel medium
 *   jumbo, 24 frets (collection bass).
 * - Set-neck + mahogany/maple laminate, ebony board, thin C, stainless jumbo,
 *   24 frets (collection electric).
 * - Set-neck mahogany + ebony + thin C + 24 frets (stock electric).
 * - Roasted maple on featured T-style and baritone copy.
 * Neck-through, rosewood, pau ferro, D/U/custom profiles, and fret counts
 * other than 24 are not listed.
 *
 * Electronics/hardware backed by existing records:
 * - Bass HH soapbar humbuckers, volume/blend/tone passive, single-saddle
 *   bass bridge, Hipshot-style ultralight tuners, black hardware
 *   (collection bass; headed, 5-string).
 * - Electric HH humbuckers, volume/tone/3-way, individual-saddle hardtail,
 *   headless tuning, black hardware (collection electric; 6-string).
 * - Electric HH humbuckers, volume/tone/3-way, hardtail, black hardware
 *   (sample stock electric; 6-string, no tuner brand listed).
 * Tremolo, chrome/gold hardware, named pickup brands/models, and coil-split
 * switching are not listed.
 *
 * Finish/details backed by existing records:
 * - Conversion varnish, natural amber burst, gloss, offset dots (bass).
 * - Oil / thin varnish, natural wood, satin, minimal side dots, optional
 *   top engraving (collection electric with exotic top).
 * - Thin varnish, natural / dark figure, satin (sample stock electric).
 * Solid colours, transparent palettes, bursts beyond amber burst, and
 * headstock inlay menus are not listed.
 */
import featuredGrey from "../assets/guitars/optimized/featured-grey.jpg";
import featuredHorizontal from "../assets/guitars/optimized/featured-horizontal.jpg";
import featuredEngraved from "../assets/guitars/optimized/featured-engraved.jpg";
import heroBurlBass from "../assets/guitars/optimized/hero-burl-bass.jpg";
import workshopBack from "../assets/guitars/optimized/workshop-back.jpg";

export const BUILDER_STEPS = [
  { id: 1, key: "instrumentShape" },
  { id: 2, key: "bodyTop" },
  { id: 3, key: "neckFingerboard" },
  { id: 4, key: "electronicsHardware" },
  { id: 5, key: "finishDetails" },
  { id: 6, key: "reviewSubmit" },
];

export const INSTRUMENT_TYPES = [
  { id: "electric-guitar", icon: "electric" },
  { id: "bass", icon: "bass" },
  { id: "classical-guitar", icon: "classical" },
  { id: "acoustic-guitar", icon: "acoustic" },
];

export const SERIES = [
  {
    id: "solid-body",
    instrumentTypeIds: ["electric-guitar", "bass"],
  },
  {
    id: "headless",
    instrumentTypeIds: ["electric-guitar", "bass"],
  },
];

export const SHAPES = [
  {
    id: "t-style",
    silhouette: "tStyle",
    instrumentTypeIds: ["electric-guitar"],
    seriesIds: ["solid-body"],
  },
  {
    id: "offset",
    silhouette: "offset",
    instrumentTypeIds: ["electric-guitar", "bass"],
    seriesIds: ["solid-body", "headless"],
  },
  {
    id: "double-cut",
    silhouette: "doubleCut",
    instrumentTypeIds: ["electric-guitar"],
    seriesIds: ["solid-body"],
  },
  {
    id: "modern-carve",
    silhouette: "modern",
    instrumentTypeIds: ["electric-guitar"],
    seriesIds: ["solid-body", "headless"],
  },
  {
    id: "compact-modern",
    silhouette: "compact",
    instrumentTypeIds: ["electric-guitar", "bass"],
    seriesIds: ["headless"],
  },
  {
    id: "p-inspired",
    silhouette: "precision",
    instrumentTypeIds: ["bass"],
    seriesIds: ["solid-body", "headless"],
  },
  {
    id: "j-inspired",
    silhouette: "offset",
    instrumentTypeIds: ["bass"],
    seriesIds: ["solid-body"],
  },
];

export const SCALES = [
  {
    id: "24.75",
    type: "single",
    display: "24.75″",
    instrumentTypeIds: ["electric-guitar"],
    seriesIds: ["solid-body"],
    shapeIds: ["offset"],
  },
  {
    id: "25.5",
    type: "single",
    display: "25.5″",
    instrumentTypeIds: ["electric-guitar"],
    seriesIds: ["solid-body", "headless"],
    shapeIds: ["t-style", "offset", "double-cut", "modern-carve", "compact-modern"],
  },
  {
    id: "27",
    type: "single",
    display: "27″",
    instrumentTypeIds: ["electric-guitar"],
    seriesIds: ["solid-body"],
    shapeIds: ["double-cut", "modern-carve"],
  },
  {
    id: "25-25.5-multi",
    type: "multiscale",
    bass: "25″",
    treble: "25.5″",
    display: "25″–25.5″",
    instrumentTypeIds: ["electric-guitar"],
    seriesIds: ["headless"],
    shapeIds: ["compact-modern", "offset", "modern-carve"],
  },
  {
    id: "34",
    type: "single",
    display: "34″",
    instrumentTypeIds: ["bass"],
    seriesIds: ["solid-body", "headless"],
    shapeIds: ["offset", "p-inspired", "j-inspired", "compact-modern"],
  },
];

export const STRING_COUNTS = [
  {
    id: "6",
    value: 6,
    instrumentTypeIds: ["electric-guitar"],
    scaleIds: ["24.75", "25.5", "27", "25-25.5-multi"],
  },
  {
    id: "7",
    value: 7,
    instrumentTypeIds: ["electric-guitar"],
    scaleIds: ["25.5", "27"],
  },
  {
    id: "8",
    value: 8,
    instrumentTypeIds: ["electric-guitar"],
    scaleIds: ["25.5", "25-25.5-multi"],
  },
  {
    id: "4",
    value: 4,
    instrumentTypeIds: ["bass"],
    scaleIds: ["34"],
  },
  {
    id: "5",
    value: 5,
    instrumentTypeIds: ["bass"],
    scaleIds: ["34"],
  },
  {
    id: "6-bass",
    value: 6,
    instrumentTypeIds: ["bass"],
    scaleIds: ["34"],
  },
];

export const RADII = [
  {
    id: "compound-12-16",
    type: "compound",
    display: "12″–16″ compound",
    instrumentTypeIds: ["electric-guitar"],
    scaleIds: ["25.5", "25-25.5-multi"],
  },
  {
    id: "16",
    type: "fixed",
    display: "16″",
    instrumentTypeIds: ["bass"],
    scaleIds: ["34"],
  },
];

export const BODY_WOODS = [
  {
    id: "alder",
    image: workshopBack,
    allowsTop: true,
    noneTopAllowed: true,
    instrumentTypeIds: ["bass"],
  },
  {
    id: "mahogany",
    image: featuredGrey,
    allowsTop: true,
    noneTopAllowed: true,
    instrumentTypeIds: ["electric-guitar"],
  },
  {
    id: "swamp-ash",
    image: featuredHorizontal,
    allowsTop: false,
    noneTopAllowed: false,
    instrumentTypeIds: ["electric-guitar"],
    seriesIds: ["solid-body"],
    shapeIds: ["t-style"],
    scaleIds: ["25.5"],
  },
  {
    id: "walnut",
    image: featuredEngraved,
    allowsTop: true,
    noneTopAllowed: true,
    instrumentTypeIds: ["electric-guitar"],
    seriesIds: ["solid-body"],
    scaleIds: ["27"],
  },
];

export const TOP_WOODS = [
  {
    id: "stabilized-burl",
    image: heroBurlBass,
    instrumentTypeIds: ["bass"],
    bodyWoodIds: ["alder"],
  },
  {
    id: "exotic-figured",
    image: featuredEngraved,
    instrumentTypeIds: ["electric-guitar"],
    bodyWoodIds: ["mahogany"],
  },
  {
    id: "maple",
    image: featuredGrey,
    instrumentTypeIds: ["electric-guitar"],
    bodyWoodIds: ["mahogany", "walnut"],
  },
];

export const NONE_TOP = {
  id: "none",
  kind: "none",
};

export const NECK_WOODS = [
  {
    id: "roasted-maple",
    image: featuredHorizontal,
    instrumentTypeIds: ["electric-guitar", "bass"],
    bodyWoodIds: ["alder", "swamp-ash", "walnut"],
  },
  {
    id: "mahogany",
    image: featuredGrey,
    instrumentTypeIds: ["electric-guitar"],
    seriesIds: ["solid-body", "headless"],
    bodyWoodIds: ["mahogany"],
  },
  {
    id: "mahogany-maple-laminate",
    image: featuredEngraved,
    instrumentTypeIds: ["electric-guitar"],
    bodyWoodIds: ["mahogany"],
  },
];

export const NECK_CONSTRUCTIONS = [
  {
    id: "bolt-on",
    instrumentTypeIds: ["bass"],
  },
  {
    id: "set-neck",
    instrumentTypeIds: ["electric-guitar"],
  },
];

export const FINGERBOARD_WOODS = [
  {
    id: "roasted-maple-board",
    image: featuredHorizontal,
    instrumentTypeIds: ["bass"],
    neckWoodIds: ["roasted-maple"],
  },
  {
    id: "ebony",
    image: featuredEngraved,
    instrumentTypeIds: ["electric-guitar"],
    neckWoodIds: ["mahogany", "mahogany-maple-laminate"],
  },
];

export const NECK_PROFILES = [
  {
    id: "asymmetric-c",
    instrumentTypeIds: ["bass"],
  },
  {
    id: "thin-c",
    instrumentTypeIds: ["electric-guitar"],
  },
];

export const FRET_SPECS = [
  {
    id: "nickel-medium-jumbo",
    instrumentTypeIds: ["bass"],
  },
  {
    id: "stainless-jumbo",
    instrumentTypeIds: ["electric-guitar"],
  },
];

export const INHERITED_FRET_COUNTS = {
  "electric-guitar": 24,
  bass: 24,
};

export const PICKUP_CONFIGS = [
  {
    id: "hh",
    positions: ["neck", "bridge"],
    instrumentTypeIds: ["electric-guitar", "bass"],
    stringCounts: [5, 6],
  },
];

export const PICKUP_TYPES = [
  {
    id: "soapbar-humbucker",
    instrumentTypeIds: ["bass"],
    pickupConfigIds: ["hh"],
    stringCounts: [5],
  },
  {
    id: "humbucker",
    instrumentTypeIds: ["electric-guitar"],
    pickupConfigIds: ["hh"],
    stringCounts: [6],
  },
];

export const BRIDGE_SYSTEMS = [
  {
    id: "single-saddle-bass",
    traditionalTuners: true,
    instrumentTypeIds: ["bass"],
    seriesIds: ["solid-body"],
    stringCounts: [5],
  },
  {
    id: "hardtail",
    traditionalTuners: true,
    instrumentTypeIds: ["electric-guitar"],
    seriesIds: ["solid-body"],
    stringCounts: [6],
  },
  {
    id: "individual-saddle-hardtail",
    traditionalTuners: false,
    instrumentTypeIds: ["electric-guitar"],
    seriesIds: ["headless"],
    stringCounts: [6],
  },
];

export const TUNERS = [
  {
    id: "hipshot-style-ultralight",
    instrumentTypeIds: ["bass"],
    seriesIds: ["solid-body"],
    stringCounts: [5],
  },
];

export const HARDWARE_FINISHES = [
  {
    id: "black",
    instrumentTypeIds: ["electric-guitar", "bass"],
  },
];

export const CONTROL_LAYOUTS = [
  {
    id: "vol-blend-tone-passive",
    instrumentTypeIds: ["bass"],
    pickupConfigIds: ["hh"],
    stringCounts: [5],
  },
  {
    id: "vol-tone-3way",
    instrumentTypeIds: ["electric-guitar"],
    pickupConfigIds: ["hh"],
    stringCounts: [6],
  },
];

export const FINISH_TYPES = [
  {
    id: "conversion-varnish",
    sheen: "gloss",
    instrumentTypeIds: ["bass"],
    bodyWoodIds: ["alder"],
  },
  {
    id: "oil-thin-varnish",
    sheen: "satin",
    instrumentTypeIds: ["electric-guitar"],
    bodyWoodIds: ["mahogany"],
  },
  {
    id: "thin-varnish",
    sheen: "satin",
    instrumentTypeIds: ["electric-guitar"],
    bodyWoodIds: ["mahogany"],
  },
];

export const FINISH_COLORS = [
  {
    id: "natural-amber-burst",
    swatch: "#c48a3a",
    finishTypeIds: ["conversion-varnish"],
    instrumentTypeIds: ["bass"],
    bodyWoodIds: ["alder"],
  },
  {
    id: "natural-wood",
    swatch: "#8b5a2b",
    finishTypeIds: ["oil-thin-varnish"],
    instrumentTypeIds: ["electric-guitar"],
    bodyWoodIds: ["mahogany"],
  },
  {
    id: "natural-dark-figure",
    swatch: "#3d2b1f",
    finishTypeIds: ["thin-varnish"],
    instrumentTypeIds: ["electric-guitar"],
    bodyWoodIds: ["mahogany"],
  },
];

export const INLAYS = [
  {
    id: "offset-dots",
    instrumentTypeIds: ["bass"],
    fingerboardWoodIds: ["roasted-maple-board"],
  },
  {
    id: "side-dots",
    instrumentTypeIds: ["electric-guitar"],
    fingerboardWoodIds: ["ebony"],
  },
];

export const ENGRAVING_OPTIONS = [
  {
    id: "optional-top",
    instrumentTypeIds: ["electric-guitar"],
    topWoodIds: ["exotic-figured"],
  },
];

export const CUSTOM_COLOR_MAX = 240;
export const SPECIAL_REQUEST_MAX = 800;
export const CONTACT_NAME_MAX = 80;
export const CONTACT_COUNTRY_MAX = 80;
export const CONTACT_PHONE_MAX = 24;
export const CONTACT_MESSAGE_MAX = 800;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^[+0-9()\s.-]{7,24}$/;

export const EMPTY_SELECTIONS = {
  instrumentTypeId: null,
  seriesId: null,
  shapeId: null,
  scaleId: null,
  stringCount: null,
  radiusId: null,
  bodyWoodId: null,
  topWoodId: null,
  neckWoodId: null,
  neckConstructionId: null,
  fingerboardWoodId: null,
  neckProfileId: null,
  fretSpecId: null,
  pickupConfigId: null,
  pickupTypeId: null,
  bridgeId: null,
  tunerId: null,
  hardwareFinishId: null,
  controlLayoutId: null,
  finishTypeId: null,
  finishColorId: null,
  customColorNote: "",
  inlayId: null,
  engravingId: null,
  specialRequests: "",
  contactName: "",
  contactEmail: "",
  contactCountry: "",
  contactPhone: "",
  contactMessage: "",
  acknowledgement: false,
};

function matchesConstraint(allowed, selected) {
  if (!allowed || allowed.length === 0) return true;
  if (selected == null || selected === "") return true;
  return allowed.includes(selected);
}

export function optionMatches(option, selections) {
  return (
    matchesConstraint(option.instrumentTypeIds, selections.instrumentTypeId) &&
    matchesConstraint(option.seriesIds, selections.seriesId) &&
    matchesConstraint(option.shapeIds, selections.shapeId) &&
    matchesConstraint(option.scaleIds, selections.scaleId) &&
    matchesConstraint(option.stringCounts, selections.stringCount) &&
    matchesConstraint(option.bodyWoodIds, selections.bodyWoodId) &&
    matchesConstraint(option.topWoodIds, selections.topWoodId) &&
    matchesConstraint(option.neckWoodIds, selections.neckWoodId) &&
    matchesConstraint(option.neckConstructionIds, selections.neckConstructionId) &&
    matchesConstraint(option.fingerboardWoodIds, selections.fingerboardWoodId) &&
    matchesConstraint(option.pickupConfigIds, selections.pickupConfigId) &&
    matchesConstraint(option.pickupTypeIds, selections.pickupTypeId) &&
    matchesConstraint(option.bridgeIds, selections.bridgeId) &&
    matchesConstraint(option.finishTypeIds, selections.finishTypeId)
  );
}

export function filterOptions(options, selections) {
  return options.filter((option) => optionMatches(option, selections));
}

export function getInstrumentTypeById(id) {
  return INSTRUMENT_TYPES.find((item) => item.id === id) ?? null;
}

export function getSeriesById(id) {
  return SERIES.find((item) => item.id === id) ?? null;
}

export function getShapeById(id) {
  return SHAPES.find((item) => item.id === id) ?? null;
}

export function getScaleById(id) {
  return SCALES.find((item) => item.id === id) ?? null;
}

export function getStringCountByValue(value, selections = EMPTY_SELECTIONS) {
  return (
    STRING_COUNTS.find(
      (item) => item.value === value && optionMatches(item, selections),
    ) ?? STRING_COUNTS.find((item) => item.value === value) ?? null
  );
}

export function getRadiusById(id) {
  return RADII.find((item) => item.id === id) ?? null;
}

export function getBodyWoodById(id) {
  return BODY_WOODS.find((item) => item.id === id) ?? null;
}

export function getTopWoodById(id) {
  if (id === NONE_TOP.id) return NONE_TOP;
  return TOP_WOODS.find((item) => item.id === id) ?? null;
}

export function getAvailableBodyWoods(selections) {
  return filterOptions(BODY_WOODS, selections);
}

export function isTopApplicable(selections) {
  const body = getBodyWoodById(selections.bodyWoodId);
  if (!body) return false;
  return body.allowsTop !== false;
}

export function getAvailableTopWoods(selections) {
  if (!isTopApplicable(selections)) return [];
  const matched = filterOptions(TOP_WOODS, selections);
  const body = getBodyWoodById(selections.bodyWoodId);
  if (body?.noneTopAllowed) {
    return [NONE_TOP, ...matched];
  }
  return matched;
}

export function getAvailableSeries(selections) {
  return filterOptions(SERIES, selections);
}

export function getAvailableShapes(selections) {
  return filterOptions(SHAPES, selections);
}

export function getAvailableScales(selections) {
  return filterOptions(SCALES, selections);
}

export function getAvailableStringCounts(selections) {
  return filterOptions(STRING_COUNTS, selections);
}

export function getAvailableRadii(selections) {
  return filterOptions(RADII, selections);
}

export function getNeckWoodById(id) {
  return NECK_WOODS.find((item) => item.id === id) ?? null;
}

export function getNeckConstructionById(id) {
  return NECK_CONSTRUCTIONS.find((item) => item.id === id) ?? null;
}

export function getFingerboardWoodById(id) {
  return FINGERBOARD_WOODS.find((item) => item.id === id) ?? null;
}

export function getNeckProfileById(id) {
  return NECK_PROFILES.find((item) => item.id === id) ?? null;
}

export function getFretSpecById(id) {
  return FRET_SPECS.find((item) => item.id === id) ?? null;
}

export function getAvailableNeckWoods(selections) {
  return filterOptions(NECK_WOODS, selections);
}

export function getAvailableNeckConstructions(selections) {
  return filterOptions(NECK_CONSTRUCTIONS, selections);
}

export function getAvailableFingerboardWoods(selections) {
  if (!selections.neckWoodId) return [];
  return filterOptions(FINGERBOARD_WOODS, selections);
}

export function getAvailableNeckProfiles(selections) {
  return filterOptions(NECK_PROFILES, selections);
}

export function getAvailableFretSpecs(selections) {
  return filterOptions(FRET_SPECS, selections);
}

export function getInheritedFretCount(selections) {
  return INHERITED_FRET_COUNTS[selections.instrumentTypeId] ?? null;
}

function clearNeckSelections(next) {
  next.neckWoodId = null;
  next.neckConstructionId = null;
  next.fingerboardWoodId = null;
  next.neckProfileId = null;
  next.fretSpecId = null;
  clearElectronicsSelections(next);
  clearFinishSelections(next);
}

function clearElectronicsSelections(next) {
  next.pickupConfigId = null;
  next.pickupTypeId = null;
  next.bridgeId = null;
  next.tunerId = null;
  next.hardwareFinishId = null;
  next.controlLayoutId = null;
}

function clearFinishSelections(next) {
  next.finishTypeId = null;
  next.finishColorId = null;
  next.inlayId = null;
  next.engravingId = null;
}

export function clampNote(value, max) {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

export function isHeadlessSeries(selections) {
  return selections.seriesId === "headless";
}

export function getPickupConfigById(id) {
  return PICKUP_CONFIGS.find((item) => item.id === id) ?? null;
}

export function getPickupTypeById(id) {
  return PICKUP_TYPES.find((item) => item.id === id) ?? null;
}

export function getBridgeById(id) {
  return BRIDGE_SYSTEMS.find((item) => item.id === id) ?? null;
}

export function getTunerById(id) {
  return TUNERS.find((item) => item.id === id) ?? null;
}

export function getHardwareFinishById(id) {
  return HARDWARE_FINISHES.find((item) => item.id === id) ?? null;
}

export function getControlLayoutById(id) {
  return CONTROL_LAYOUTS.find((item) => item.id === id) ?? null;
}

export function getFinishTypeById(id) {
  return FINISH_TYPES.find((item) => item.id === id) ?? null;
}

export function getFinishColorById(id) {
  return FINISH_COLORS.find((item) => item.id === id) ?? null;
}

export function getInlayById(id) {
  return INLAYS.find((item) => item.id === id) ?? null;
}

export function getEngravingById(id) {
  return ENGRAVING_OPTIONS.find((item) => item.id === id) ?? null;
}

export function getAvailablePickupConfigs(selections) {
  return filterOptions(PICKUP_CONFIGS, selections);
}

export function getAvailablePickupTypes(selections) {
  if (!selections.pickupConfigId) return [];
  return filterOptions(PICKUP_TYPES, selections);
}

export function getAvailableBridges(selections) {
  return filterOptions(BRIDGE_SYSTEMS, selections);
}

export function isTunersApplicable(selections) {
  if (isHeadlessSeries(selections)) return false;
  const bridge = getBridgeById(selections.bridgeId);
  if (bridge) return bridge.traditionalTuners === true;
  return true;
}

export function getAvailableTuners(selections) {
  if (!isTunersApplicable(selections)) return [];
  return filterOptions(TUNERS, selections);
}

export function getAvailableHardwareFinishes(selections) {
  return filterOptions(HARDWARE_FINISHES, selections);
}

export function getAvailableControlLayouts(selections) {
  if (!selections.pickupConfigId) return [];
  return filterOptions(CONTROL_LAYOUTS, selections);
}

export function getAvailableFinishTypes(selections) {
  return filterOptions(FINISH_TYPES, selections);
}

export function getAvailableFinishColors(selections) {
  if (!selections.finishTypeId) return [];
  return filterOptions(FINISH_COLORS, selections);
}

export function getAvailableInlays(selections) {
  if (!selections.fingerboardWoodId) return [];
  return filterOptions(INLAYS, selections);
}

export function getAvailableEngravings(selections) {
  return filterOptions(ENGRAVING_OPTIONS, selections);
}

export function pruneSelections(selections) {
  const next = { ...selections };

  if (
    next.seriesId &&
    !getAvailableSeries(next).some((item) => item.id === next.seriesId)
  ) {
    next.seriesId = null;
    next.shapeId = null;
    next.scaleId = null;
    next.stringCount = null;
    next.radiusId = null;
    next.bodyWoodId = null;
    next.topWoodId = null;
    clearNeckSelections(next);
  }

  if (
    next.shapeId &&
    !getAvailableShapes(next).some((item) => item.id === next.shapeId)
  ) {
    next.shapeId = null;
    next.scaleId = null;
    next.stringCount = null;
    next.radiusId = null;
    next.bodyWoodId = null;
    next.topWoodId = null;
    clearNeckSelections(next);
  }

  if (
    next.scaleId &&
    !getAvailableScales(next).some((item) => item.id === next.scaleId)
  ) {
    next.scaleId = null;
    next.stringCount = null;
    next.radiusId = null;
    next.bodyWoodId = null;
    next.topWoodId = null;
    clearNeckSelections(next);
  }

  if (
    next.stringCount != null &&
    !getAvailableStringCounts(next).some((item) => item.value === next.stringCount)
  ) {
    next.stringCount = null;
    next.radiusId = null;
    next.bodyWoodId = null;
    next.topWoodId = null;
    clearNeckSelections(next);
  }

  if (
    next.radiusId &&
    !getAvailableRadii(next).some((item) => item.id === next.radiusId)
  ) {
    next.radiusId = null;
    next.bodyWoodId = null;
    next.topWoodId = null;
    clearNeckSelections(next);
  }

  if (
    next.bodyWoodId &&
    !getAvailableBodyWoods(next).some((item) => item.id === next.bodyWoodId)
  ) {
    next.bodyWoodId = null;
    next.topWoodId = null;
    clearNeckSelections(next);
  }

  if (!isTopApplicable(next)) {
    next.topWoodId = null;
  } else if (next.topWoodId === NONE_TOP.id) {
    if (!getBodyWoodById(next.bodyWoodId)?.noneTopAllowed) {
      next.topWoodId = null;
    }
  } else if (
    next.topWoodId &&
    !getAvailableTopWoods(next).some((item) => item.id === next.topWoodId)
  ) {
    next.topWoodId = null;
  }

  if (
    next.neckWoodId &&
    !getAvailableNeckWoods(next).some((item) => item.id === next.neckWoodId)
  ) {
    next.neckWoodId = null;
    next.fingerboardWoodId = null;
  }

  if (
    next.neckConstructionId &&
    !getAvailableNeckConstructions(next).some(
      (item) => item.id === next.neckConstructionId,
    )
  ) {
    next.neckConstructionId = null;
  }

  if (
    next.fingerboardWoodId &&
    !getAvailableFingerboardWoods(next).some(
      (item) => item.id === next.fingerboardWoodId,
    )
  ) {
    next.fingerboardWoodId = null;
  }

  if (
    next.neckProfileId &&
    !getAvailableNeckProfiles(next).some((item) => item.id === next.neckProfileId)
  ) {
    next.neckProfileId = null;
  }

  if (
    next.fretSpecId &&
    !getAvailableFretSpecs(next).some((item) => item.id === next.fretSpecId)
  ) {
    next.fretSpecId = null;
  }

  if (
    next.pickupConfigId &&
    !getAvailablePickupConfigs(next).some((item) => item.id === next.pickupConfigId)
  ) {
    next.pickupConfigId = null;
    next.pickupTypeId = null;
    next.controlLayoutId = null;
  }

  if (
    next.pickupTypeId &&
    !getAvailablePickupTypes(next).some((item) => item.id === next.pickupTypeId)
  ) {
    next.pickupTypeId = null;
  }

  if (
    next.bridgeId &&
    !getAvailableBridges(next).some((item) => item.id === next.bridgeId)
  ) {
    next.bridgeId = null;
    next.tunerId = null;
  }

  if (!isTunersApplicable(next)) {
    next.tunerId = null;
  } else if (
    next.tunerId &&
    !getAvailableTuners(next).some((item) => item.id === next.tunerId)
  ) {
    next.tunerId = null;
  }

  if (
    next.hardwareFinishId &&
    !getAvailableHardwareFinishes(next).some(
      (item) => item.id === next.hardwareFinishId,
    )
  ) {
    next.hardwareFinishId = null;
  }

  if (
    next.controlLayoutId &&
    !getAvailableControlLayouts(next).some(
      (item) => item.id === next.controlLayoutId,
    )
  ) {
    next.controlLayoutId = null;
  }

  if (
    next.finishTypeId &&
    !getAvailableFinishTypes(next).some((item) => item.id === next.finishTypeId)
  ) {
    next.finishTypeId = null;
    next.finishColorId = null;
  }

  if (
    next.finishColorId &&
    !getAvailableFinishColors(next).some((item) => item.id === next.finishColorId)
  ) {
    next.finishColorId = null;
  }

  if (
    next.inlayId &&
    !getAvailableInlays(next).some((item) => item.id === next.inlayId)
  ) {
    next.inlayId = null;
  }

  if (
    next.engravingId &&
    !getAvailableEngravings(next).some((item) => item.id === next.engravingId)
  ) {
    next.engravingId = null;
  }

  next.customColorNote = clampNote(next.customColorNote, CUSTOM_COLOR_MAX);
  next.specialRequests = clampNote(next.specialRequests, SPECIAL_REQUEST_MAX);
  next.contactName = clampNote(next.contactName, CONTACT_NAME_MAX);
  next.contactEmail = clampNote(next.contactEmail, 120);
  next.contactCountry = clampNote(next.contactCountry, CONTACT_COUNTRY_MAX);
  next.contactPhone = clampNote(next.contactPhone, CONTACT_PHONE_MAX);
  next.contactMessage = clampNote(next.contactMessage, CONTACT_MESSAGE_MAX);
  next.acknowledgement = Boolean(next.acknowledgement);

  return next;
}

export function isStepOneComplete(selections) {
  if (!selections.instrumentTypeId || !selections.seriesId) return false;
  if (!selections.shapeId || !selections.scaleId) return false;
  if (selections.stringCount == null) return false;
  const radii = getAvailableRadii(selections);
  if (radii.length === 0) return true;
  return Boolean(selections.radiusId);
}

export function isStepTwoComplete(selections) {
  if (!isStepOneComplete(selections)) return false;
  const bodies = getAvailableBodyWoods(selections);
  if (bodies.length === 0) return false;
  if (!selections.bodyWoodId) return false;
  if (!isTopApplicable(selections)) return true;
  const tops = getAvailableTopWoods(selections);
  if (tops.length === 0) return true;
  return Boolean(selections.topWoodId);
}

function requiredIfOptions(options, selectedId) {
  if (options.length === 0) return true;
  return Boolean(selectedId);
}

export function isStepThreeComplete(selections) {
  if (!isStepTwoComplete(selections)) return false;
  return (
    requiredIfOptions(getAvailableNeckWoods(selections), selections.neckWoodId) &&
    requiredIfOptions(
      getAvailableNeckConstructions(selections),
      selections.neckConstructionId,
    ) &&
    requiredIfOptions(
      getAvailableFingerboardWoods(selections),
      selections.fingerboardWoodId,
    ) &&
    requiredIfOptions(
      getAvailableNeckProfiles(selections),
      selections.neckProfileId,
    ) &&
    requiredIfOptions(getAvailableFretSpecs(selections), selections.fretSpecId)
  );
}

export function isStepFourComplete(selections) {
  if (!isStepThreeComplete(selections)) return false;
  return (
    requiredIfOptions(
      getAvailablePickupConfigs(selections),
      selections.pickupConfigId,
    ) &&
    requiredIfOptions(getAvailablePickupTypes(selections), selections.pickupTypeId) &&
    requiredIfOptions(getAvailableBridges(selections), selections.bridgeId) &&
    requiredIfOptions(getAvailableTuners(selections), selections.tunerId) &&
    requiredIfOptions(
      getAvailableHardwareFinishes(selections),
      selections.hardwareFinishId,
    ) &&
    requiredIfOptions(
      getAvailableControlLayouts(selections),
      selections.controlLayoutId,
    )
  );
}

export function validateContact(selections) {
  const errors = {};
  const name = selections.contactName?.trim() ?? "";
  const email = selections.contactEmail?.trim() ?? "";
  const country = selections.contactCountry?.trim() ?? "";
  const phone = selections.contactPhone?.trim() ?? "";
  const message = selections.contactMessage ?? "";

  if (!name) errors.contactName = "required";
  else if (name.length < 2) errors.contactName = "nameShort";

  if (!email) errors.contactEmail = "required";
  else if (!EMAIL_PATTERN.test(email)) errors.contactEmail = "emailInvalid";

  if (!country) errors.contactCountry = "required";
  else if (country.length < 2) errors.contactCountry = "countryShort";

  if (phone && !PHONE_PATTERN.test(phone)) errors.contactPhone = "phoneInvalid";

  if (message.length > CONTACT_MESSAGE_MAX) {
    errors.contactMessage = "messageLong";
  }

  if (!selections.acknowledgement) errors.acknowledgement = "required";

  return errors;
}

export function getFirstIncompleteStep(selections) {
  if (!isStepOneComplete(selections)) return 1;
  if (!isStepTwoComplete(selections)) return 2;
  if (!isStepThreeComplete(selections)) return 3;
  if (!isStepFourComplete(selections)) return 4;
  if (!isStepFiveComplete(selections)) return 5;
  return null;
}

export function isContactComplete(selections) {
  return Object.keys(validateContact(selections)).length === 0;
}

export function isStepFiveComplete(selections) {
  if (!isStepFourComplete(selections)) return false;
  return (
    requiredIfOptions(getAvailableFinishTypes(selections), selections.finishTypeId) &&
    requiredIfOptions(
      getAvailableFinishColors(selections),
      selections.finishColorId,
    ) &&
    requiredIfOptions(getAvailableInlays(selections), selections.inlayId)
  );
}

export function getBuilderCatalog() {
  return {
    steps: BUILDER_STEPS,
    instrumentTypes: INSTRUMENT_TYPES,
    series: SERIES,
    shapes: SHAPES,
    scales: SCALES,
    stringCounts: STRING_COUNTS,
    radii: RADII,
    bodyWoods: BODY_WOODS,
    topWoods: TOP_WOODS,
    neckWoods: NECK_WOODS,
    neckConstructions: NECK_CONSTRUCTIONS,
    fingerboardWoods: FINGERBOARD_WOODS,
    neckProfiles: NECK_PROFILES,
    fretSpecs: FRET_SPECS,
    pickupConfigs: PICKUP_CONFIGS,
    pickupTypes: PICKUP_TYPES,
    bridges: BRIDGE_SYSTEMS,
    tuners: TUNERS,
    hardwareFinishes: HARDWARE_FINISHES,
    controlLayouts: CONTROL_LAYOUTS,
    finishTypes: FINISH_TYPES,
    finishColors: FINISH_COLORS,
    inlays: INLAYS,
    engravingOptions: ENGRAVING_OPTIONS,
  };
}
