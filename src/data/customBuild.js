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
import {
  CONTACT_MESSAGE_MAX,
  EMAIL_PATTERN,
  PHONE_PATTERN,
  validateContact,
} from "./customBuildContact.js";
import { pickDefaultOption } from "./wizardDefaults.js";
import {
  filterOptions as filterListedOptions,
  findSelectedOption,
  isHeadlessOption,
  isNoneTopOption,
  listedTuners,
  isCustomerSuppliedParts,
  optionMatches as optionMatchesListed,
  pruneSelections as pruneListedSelections,
} from "./wizardSelection.js";
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

/** Historical local option rows. Not used by the live wizard. */
const FALLBACK_LISTS = {
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
  engravings: ENGRAVING_OPTIONS,
};

let wizardLists = null;

export function setWizardLists(lists) {
  wizardLists = lists;
}

export function getWizardLists() {
  return wizardLists;
}

function list(key) {
  return wizardLists?.[key] || [];
}

export const CUSTOM_COLOR_MAX = 240;
export const SPECIAL_REQUEST_MAX = 800;
export const CONTACT_NAME_MAX = 80;
export const CONTACT_COUNTRY_MAX = 80;
export const CONTACT_PHONE_MAX = 24;
export { CONTACT_MESSAGE_MAX, EMAIL_PATTERN, PHONE_PATTERN, validateContact };

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
  customerSuppliedParts: false,
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
  referenceImages: [],
};

function listsOrEmpty() {
  return getWizardLists() || null;
}

export function optionMatches(option, selections) {
  const raw = String(option?.optionId || "");
  const dot = raw.indexOf(".");
  return optionMatchesListed(option, selections, getWizardLists() || {}, dot > 0 ? raw.slice(0, dot) : "");
}

export function filterOptions(options, selections) {
  return filterListedOptions(options, selections, getWizardLists() || {});
}

export function getInstrumentTypeById(id) {
  return findSelectedOption(list("instrumentTypes"), id);
}

export function getSeriesById(id) {
  return findSelectedOption(list("series"), id);
}

export function getShapeById(id) {
  return findSelectedOption(list("shapes"), id);
}

export function getScaleById(id) {
  return findSelectedOption(list("scales"), id);
}

export function getStringCountByValue(value, selections = EMPTY_SELECTIONS) {
  const counts = list("stringCounts");
  return (
    counts.find((item) => item.value === value && optionMatches(item, selections)) ??
    findSelectedOption(counts, value)
  );
}

export function getRadiusById(id) {
  return findSelectedOption(list("radii"), id);
}

export function getBodyWoodById(id) {
  return findSelectedOption(list("bodyWoods"), id);
}

export function getTopWoodById(id) {
  return findSelectedOption(list("topWoods"), id);
}

export function getAvailableBodyWoods(selections) {
  return filterOptions(list("bodyWoods"), selections);
}

export function isTopApplicable(selections) {
  const body = getBodyWoodById(selections.bodyWoodId);
  if (!body) return false;
  return body.allowsTop !== false;
}

export function getAvailableTopWoods(selections) {
  if (!isTopApplicable(selections)) return [];
  const matched = filterOptions(
    list("topWoods").filter((item) => !isNoneTopOption(item)),
    selections,
  );
  const body = getBodyWoodById(selections.bodyWoodId);
  if (body?.noneTopAllowed) {
    const none = list("topWoods").filter(isNoneTopOption);
    return [...none, ...matched];
  }
  return matched;
}

export function getAvailableSeries(selections) {
  return filterOptions(list("series"), selections);
}

export function applySeriesDefault(selections) {
  if (selections.seriesId || !selections.instrumentTypeId) return selections;
  const picked = pickDefaultOption(getAvailableSeries(selections), selections.instrumentTypeId);
  if (!picked) return selections;
  return pruneSelections({ ...selections, seriesId: picked.id });
}

export function getAvailableShapes(selections) {
  return filterOptions(list("shapes"), selections);
}

export function getAvailableScales(selections) {
  return filterOptions(list("scales"), selections);
}

export function getAvailableStringCounts(selections) {
  return filterOptions(list("stringCounts"), selections);
}

export function getAvailableRadii(selections) {
  return filterOptions(list("radii"), selections);
}

export function getNeckWoodById(id) {
  return findSelectedOption(list("neckWoods"), id);
}

export function getNeckConstructionById(id) {
  return findSelectedOption(list("neckConstructions"), id);
}

export function getFingerboardWoodById(id) {
  return findSelectedOption(list("fingerboardWoods"), id);
}

export function getNeckProfileById(id) {
  return findSelectedOption(list("neckProfiles"), id);
}

export function getFretSpecById(id) {
  return findSelectedOption(list("fretSpecs"), id);
}

export function getAvailableNeckWoods(selections) {
  return filterOptions(list("neckWoods"), selections);
}

export function getAvailableNeckConstructions(selections) {
  return filterOptions(list("neckConstructions"), selections);
}

export function getAvailableFingerboardWoods(selections) {
  if (!selections.neckWoodId) return [];
  return filterOptions(list("fingerboardWoods"), selections);
}

export function getAvailableNeckProfiles(selections) {
  return filterOptions(list("neckProfiles"), selections);
}

export function getAvailableFretSpecs(selections) {
  return filterOptions(list("fretSpecs"), selections);
}

export function getInheritedFretCount(selections) {
  const type = getInstrumentTypeById(selections.instrumentTypeId);
  const configured = type?.fretCount ?? type?.attributes?.fretCount;
  if (configured != null && Number.isFinite(Number(configured))) return Number(configured);
  return INHERITED_FRET_COUNTS[selections.instrumentTypeId] ?? null;
}

function clampSelectionNotes(next) {
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

export function clampNote(value, max) {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

export function isHeadlessSeries(selections) {
  const series = getSeriesById(selections.seriesId);
  if (series) return isHeadlessOption(series);
  const id = String(selections.seriesId || "");
  return id === "headless" || id.endsWith(".headless");
}

export function getPickupConfigById(id) {
  return findSelectedOption(list("pickupConfigs"), id);
}

export function getPickupTypeById(id) {
  return findSelectedOption(list("pickupTypes"), id);
}

export function getBridgeById(id) {
  return findSelectedOption(list("bridges"), id);
}

export function getTunerById(id) {
  return findSelectedOption(list("tuners"), id);
}

export function getHardwareFinishById(id) {
  return findSelectedOption(list("hardwareFinishes"), id);
}

export function getControlLayoutById(id) {
  return findSelectedOption(list("controlLayouts"), id);
}

export function getFinishTypeById(id) {
  return findSelectedOption(list("finishTypes"), id);
}

export function getFinishColorById(id) {
  return findSelectedOption(list("finishColors"), id);
}

export function getInlayById(id) {
  return findSelectedOption(list("inlays"), id);
}

export function getEngravingById(id) {
  return findSelectedOption(list("engravings"), id);
}

export function getAvailablePickupConfigs(selections) {
  return filterOptions(list("pickupConfigs"), selections);
}

export function getAvailablePickupTypes(selections) {
  if (!selections.pickupConfigId) return [];
  return filterOptions(list("pickupTypes"), selections);
}

export function getAvailableBridges(selections) {
  return filterOptions(list("bridges"), selections);
}

export function isTunersApplicable(selections) {
  if (isHeadlessSeries(selections)) return false;
  const bridge = getBridgeById(selections.bridgeId);
  if (bridge) return bridge.traditionalTuners === true;
  return true;
}

export function getAvailableTuners(selections) {
  return listedTuners(getWizardLists() || {}, selections);
}

export function getAvailableHardwareFinishes(selections) {
  return filterOptions(list("hardwareFinishes"), selections);
}

export function getAvailableControlLayouts(selections) {
  if (!selections.pickupConfigId) return [];
  return filterOptions(list("controlLayouts"), selections);
}

export function getAvailableFinishTypes(selections) {
  return filterOptions(list("finishTypes"), selections);
}

export function getAvailableFinishColors(selections) {
  if (!selections.finishTypeId) return [];
  return filterOptions(list("finishColors"), selections);
}

export function getAvailableInlays(selections) {
  return filterOptions(list("inlays"), selections);
}

export function getAvailableEngravings(selections) {
  return filterOptions(list("engravings"), selections);
}

export function pruneSelections(selections) {
  const lists = listsOrEmpty();
  const pruned = pruneListedSelections(selections, lists);
  const next = pruned && typeof pruned === "object" ? { ...pruned } : { ...(selections || {}) };
  return clampSelectionNotes(next);
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
  if (isCustomerSuppliedParts(selections)) return true;
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
    instrumentTypes: list("instrumentTypes"),
    series: list("series"),
    shapes: list("shapes"),
    scales: list("scales"),
    stringCounts: list("stringCounts"),
    radii: list("radii"),
    bodyWoods: list("bodyWoods"),
    topWoods: list("topWoods"),
    neckWoods: list("neckWoods"),
    neckConstructions: list("neckConstructions"),
    fingerboardWoods: list("fingerboardWoods"),
    neckProfiles: list("neckProfiles"),
    fretSpecs: list("fretSpecs"),
    pickupConfigs: list("pickupConfigs"),
    pickupTypes: list("pickupTypes"),
    bridges: list("bridges"),
    tuners: list("tuners"),
    hardwareFinishes: list("hardwareFinishes"),
    controlLayouts: list("controlLayouts"),
    finishTypes: list("finishTypes"),
    finishColors: list("finishColors"),
    inlays: list("inlays"),
    engravingOptions: list("engravings"),
  };
}
