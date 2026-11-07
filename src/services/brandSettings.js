import { isCustomBuildApiConfigured } from "../config/api.js";
import { requestJson } from "./apiClient.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+0-9()\s.-]{6,40}$/;

export function emptyWorkshop() {
  return {
    name: "",
    address: "",
    mapsUrl: "",
    note: "",
    enabled: true,
  };
}

export const DEFAULT_SOCIAL_CONTACT = {
  facebookUrl: "https://www.facebook.com/phan.quan.353",
  facebookMessengerUrl: "https://m.me/phan.quan.353",
  zaloPhone: "0903083489",
  zaloUrl: "https://zalo.me/0903083489",
  facebookEnabled: true,
  zaloEnabled: true,
};

export function emptySocialContact() {
  return { ...DEFAULT_SOCIAL_CONTACT };
}

export function emptyAdminBrandSettings() {
  return {
    contact: {
      email: "",
      phone: "",
      whatsapp: "",
      facebook: "",
      instagram: "",
      youtube: "",
      other: "",
    },
    workshops: {
      workshop1: emptyWorkshop(),
      workshop2: emptyWorkshop(),
    },
    display: {
      email: true,
      phone: true,
      whatsapp: true,
      facebook: true,
      instagram: true,
      youtube: true,
      other: true,
      hours: false,
    },
    hours: { en: "", vi: "" },
    socialContact: emptySocialContact(),
    updatedAt: null,
    updatedBy: null,
  };
}

export function emptyPublicBrandSettings() {
  return {
    email: null,
    phone: null,
    whatsapp: null,
    facebook: null,
    instagram: null,
    youtube: null,
    other: null,
    hours: null,
    workshops: [],
    socialContact: {
      facebookUrl: null,
      facebookMessengerUrl: null,
      zaloPhone: null,
      zaloUrl: null,
    },
  };
}

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function mergeWorkshop(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    name: asText(source.name),
    address: asText(source.address),
    mapsUrl: asText(source.mapsUrl),
    note: asText(source.note),
    enabled: source.enabled !== false,
  };
}

export function normalizeAdminBrandSettings(data) {
  const fallback = emptyAdminBrandSettings();
  const source = data && typeof data === "object" ? data : {};
  const contact = source.contact && typeof source.contact === "object" ? source.contact : {};
  const workshops = source.workshops && typeof source.workshops === "object" ? source.workshops : {};
  const display = source.display && typeof source.display === "object" ? source.display : {};
  const hours = source.hours && typeof source.hours === "object" ? source.hours : {};
  return {
    contact: {
      email: asText(contact.email),
      phone: asText(contact.phone),
      whatsapp: asText(contact.whatsapp),
      facebook: asText(contact.facebook),
      instagram: asText(contact.instagram),
      youtube: asText(contact.youtube),
      other: asText(contact.other),
    },
    workshops: {
      workshop1: mergeWorkshop(workshops.workshop1),
      workshop2: mergeWorkshop(workshops.workshop2),
    },
    display: {
      email: display.email !== false,
      phone: display.phone !== false,
      whatsapp: display.whatsapp !== false,
      facebook: display.facebook !== false,
      instagram: display.instagram !== false,
      youtube: display.youtube !== false,
      other: display.other !== false,
      hours: display.hours === true,
    },
    hours: {
      en: asText(hours.en),
      vi: asText(hours.vi),
    },
    socialContact: mergeSocialContact(source.socialContact),
    updatedAt: source.updatedAt || fallback.updatedAt,
    updatedBy: source.updatedBy || fallback.updatedBy,
  };
}

function mergeSocialContact(value) {
  const defaults = emptySocialContact();
  if (!value || typeof value !== "object") return defaults;
  const zaloPhone = asText(value.zaloPhone);
  return {
    facebookUrl: asText(value.facebookUrl),
    facebookMessengerUrl:
      value.facebookMessengerUrl === undefined ? defaults.facebookMessengerUrl : asText(value.facebookMessengerUrl),
    zaloPhone,
    zaloUrl: value.zaloUrl === undefined ? zaloHref(zaloPhone) || defaults.zaloUrl : asText(value.zaloUrl),
    facebookEnabled: value.facebookEnabled !== false,
    zaloEnabled: value.zaloEnabled !== false,
  };
}

export function normalizePublicBrandSettings(data) {
  const fallback = emptyPublicBrandSettings();
  if (!data || typeof data !== "object") return fallback;
  const workshops = Array.isArray(data.workshops)
    ? data.workshops
        .map((workshop) => ({
          name: asText(workshop?.name) || null,
          address: asText(workshop?.address) || null,
          mapsUrl: asText(workshop?.mapsUrl) || null,
          note: asText(workshop?.note) || null,
        }))
        .filter((workshop) => workshop.name || workshop.address)
    : [];
  const hours =
    data.hours && typeof data.hours === "object" && (asText(data.hours.en) || asText(data.hours.vi))
      ? { en: asText(data.hours.en) || null, vi: asText(data.hours.vi) || null }
      : null;
  return {
    email: asText(data.email) || null,
    phone: asText(data.phone) || null,
    whatsapp: asText(data.whatsapp) || null,
    facebook: asText(data.facebook) || null,
    instagram: asText(data.instagram) || null,
    youtube: asText(data.youtube) || null,
    other: asText(data.other) || null,
    hours,
    workshops,
    socialContact: normalizePublicSocial(data.socialContact),
  };
}

function normalizePublicSocial(value) {
  if (!value || typeof value !== "object") {
    return {
      facebookUrl: DEFAULT_SOCIAL_CONTACT.facebookUrl,
      facebookMessengerUrl: DEFAULT_SOCIAL_CONTACT.facebookMessengerUrl,
      zaloPhone: DEFAULT_SOCIAL_CONTACT.zaloPhone,
      zaloUrl: DEFAULT_SOCIAL_CONTACT.zaloUrl,
    };
  }
  const facebookUrl = asText(value.facebookUrl) || null;
  const facebookMessengerUrl = asText(value.facebookMessengerUrl) || null;
  const zaloPhone = asText(value.zaloPhone) || null;
  return {
    facebookUrl,
    facebookMessengerUrl,
    zaloPhone,
    zaloUrl: asText(value.zaloUrl) || zaloHref(zaloPhone) || null,
  };
}

export function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function whatsappHref(value) {
  const trimmed = asText(value);
  if (!trimmed) return "";
  if (isHttpUrl(trimmed)) return trimmed;
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export function telHref(value) {
  const trimmed = asText(value);
  if (!trimmed) return "";
  const target = trimmed.replace(/[^\d+]/g, "");
  return target ? `tel:${target}` : "";
}

export function zaloHref(value) {
  const digits = asText(value).replace(/[^\d]/g, "");
  return digits ? `https://zalo.me/${digits}` : "";
}

export function publicSocialLinks(settings) {
  const social = settings?.socialContact || emptyPublicBrandSettings().socialContact;
  return {
    facebookProfileUrl: social.facebookUrl || "",
    facebookChatUrl: social.facebookMessengerUrl || "",
    zaloUrl: social.zaloUrl || zaloHref(social.zaloPhone),
  };
}

export function hoursForLanguage(hours, language) {
  if (!hours || typeof hours !== "object") return "";
  const primary = language === "vi" ? hours.vi : hours.en;
  const fallback = language === "vi" ? hours.en : hours.vi;
  return asText(primary) || asText(fallback);
}

export function hasPublicBrandContact(settings) {
  if (!settings) return false;
  return Boolean(
    settings.email ||
      settings.phone ||
      settings.whatsapp ||
      settings.facebook ||
      settings.instagram ||
      settings.youtube ||
      settings.other ||
      hoursForLanguage(settings.hours, "en") ||
      hoursForLanguage(settings.hours, "vi") ||
      (settings.workshops && settings.workshops.length),
  );
}

function failure(result, fallback = "failure") {
  if (result.network) return { ok: false, code: "NETWORK", status: result.status };
  if (result.status === 401) return { ok: false, code: "UNAUTHORIZED", status: 401 };
  if (result.status === 403) return { ok: false, code: "FORBIDDEN", status: 403 };
  return { ok: false, code: result.payload?.error?.code || fallback, status: result.status, details: result.payload?.error?.details };
}

export async function fetchPublicBrandSettings() {
  if (!isCustomBuildApiConfigured()) {
    return { ok: false, code: "UNAVAILABLE", settings: emptyPublicBrandSettings() };
  }
  const result = await requestJson("/api/brand-settings/public");
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return { ...failure(result), settings: emptyPublicBrandSettings() };
  }
  return { ok: true, code: null, settings: normalizePublicBrandSettings(result.payload.data) };
}

export async function getAdminBrandSettings(request) {
  const result = await request("/api/brand-settings/admin");
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return { ...failure(result), settings: emptyAdminBrandSettings() };
  }
  return { ok: true, code: null, settings: normalizeAdminBrandSettings(result.payload.data) };
}

export async function saveAdminBrandSettings(request, payload) {
  const result = await request("/api/brand-settings/admin", { method: "PUT", body: payload });
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return { ...failure(result), settings: null };
  }
  return { ok: true, code: null, settings: normalizeAdminBrandSettings(result.payload.data) };
}

export function validateAdminBrandSettings(form) {
  const errors = {};
  const contact = form.contact || {};
  if (asText(contact.email) && !EMAIL_PATTERN.test(asText(contact.email))) {
    errors["contact.email"] = "invalid";
  }
  if (asText(contact.phone) && !PHONE_PATTERN.test(asText(contact.phone))) {
    errors["contact.phone"] = "invalid";
  }
  if (asText(contact.whatsapp)) {
    const value = asText(contact.whatsapp);
    if (!isHttpUrl(value) && !PHONE_PATTERN.test(value)) {
      errors["contact.whatsapp"] = "invalid";
    }
  }
  ["facebook", "instagram", "youtube", "other"].forEach((key) => {
    if (asText(contact[key]) && !isHttpUrl(asText(contact[key]))) {
      errors[`contact.${key}`] = "invalid";
    }
  });
  const social = form.socialContact || {};
  if (asText(social.facebookUrl) && !isHttpUrl(asText(social.facebookUrl))) {
    errors["socialContact.facebookUrl"] = "invalid";
  }
  if (asText(social.facebookMessengerUrl) && !isHttpUrl(asText(social.facebookMessengerUrl))) {
    errors["socialContact.facebookMessengerUrl"] = "invalid";
  }
  if (asText(social.zaloPhone) && !PHONE_PATTERN.test(asText(social.zaloPhone))) {
    errors["socialContact.zaloPhone"] = "invalid";
  }
  if (asText(social.zaloUrl) && !isHttpUrl(asText(social.zaloUrl))) {
    errors["socialContact.zaloUrl"] = "invalid";
  }
  ["workshop1", "workshop2"].forEach((slot) => {
    const mapsUrl = asText(form.workshops?.[slot]?.mapsUrl);
    if (mapsUrl && !isHttpUrl(mapsUrl)) {
      errors[`workshops.${slot}.mapsUrl`] = "invalid";
    }
  });
  return errors;
}

export function buildAdminBrandPayload(form) {
  const normalized = normalizeAdminBrandSettings(form);
  return {
    contact: normalized.contact,
    workshops: normalized.workshops,
    display: normalized.display,
    hours: normalized.hours,
    socialContact: normalized.socialContact,
  };
}
