import { isCustomBuildApiConfigured } from "../config/api.js";
import { requestJson } from "./apiClient.js";
import {
  buildInquiryPayload,
  mapServerFieldToContact,
} from "./customBuildPayload.js";

export const INQUIRY_CODES = {
  UNAVAILABLE: "UNAVAILABLE",
  NETWORK: "NETWORK",
  VALIDATION: "VALIDATION",
  REJECTED: "REJECTED",
};

export function isCustomBuildInquiryConfigured() {
  return isCustomBuildApiConfigured();
}

function detailsFrom(payload) {
  const details = payload?.error?.details;
  return Array.isArray(details) ? details : [];
}

function parseCatalog(response) {
  if (!response.ok || !response.payload?.success || !response.payload.data) {
    return null;
  }
  const catalog = response.payload.data;
  if (!Array.isArray(catalog.categories)) return null;
  return catalog;
}

function inquiryReference(payload) {
  const id = payload?.data?.id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

export async function submitCustomBuildInquiry({
  selections,
  language,
  draftId,
  finishSheen,
}) {
  if (!isCustomBuildInquiryConfigured()) {
    return {
      ok: false,
      confirmed: false,
      code: INQUIRY_CODES.UNAVAILABLE,
      reference: null,
      details: [],
      contactErrors: {},
    };
  }

  const optionsResponse = await requestJson("/api/custom-build/options");
  if (optionsResponse.network || optionsResponse.status >= 500) {
    return {
      ok: false,
      confirmed: false,
      code: INQUIRY_CODES.NETWORK,
      reference: null,
      details: [],
      contactErrors: {},
    };
  }

  const catalog = parseCatalog(optionsResponse);
  if (!catalog) {
    return {
      ok: false,
      confirmed: false,
      code: INQUIRY_CODES.REJECTED,
      reference: null,
      details: [],
      contactErrors: {},
    };
  }

  const payload = buildInquiryPayload({
    selections,
    language,
    draftId,
    catalog,
    finishSheen,
  });

  const validateResponse = await requestJson("/api/custom-build/validate", {
    method: "POST",
    body: payload.configuration,
  });
  if (validateResponse.network || validateResponse.status >= 500) {
    return {
      ok: false,
      confirmed: false,
      code: INQUIRY_CODES.NETWORK,
      reference: null,
      details: [],
      contactErrors: {},
    };
  }
  if (
    !validateResponse.ok ||
    validateResponse.payload?.success !== true ||
    validateResponse.payload?.data?.valid !== true
  ) {
    return {
      ok: false,
      confirmed: false,
      code:
        validateResponse.status === 422
          ? INQUIRY_CODES.VALIDATION
          : INQUIRY_CODES.REJECTED,
      reference: null,
      details: detailsFrom(validateResponse.payload),
      contactErrors: {},
    };
  }

  const inquiryResponse = await requestJson("/api/custom-build/inquiries", {
    method: "POST",
    body: payload,
  });
  if (inquiryResponse.network || inquiryResponse.status >= 500) {
    return {
      ok: false,
      confirmed: false,
      code: INQUIRY_CODES.NETWORK,
      reference: null,
      details: [],
      contactErrors: {},
    };
  }

  const reference = inquiryReference(inquiryResponse.payload);
  if (
    inquiryResponse.status === 201 &&
    inquiryResponse.payload?.success === true &&
    reference
  ) {
    return {
      ok: true,
      confirmed: true,
      code: null,
      reference,
      details: [],
      contactErrors: {},
    };
  }

  if (inquiryResponse.status === 422) {
    const details = detailsFrom(inquiryResponse.payload);
    const contactErrors = {};
    for (const issue of details) {
      const field = mapServerFieldToContact(issue.field);
      if (field && !contactErrors[field]) {
        contactErrors[field] = issue.code === "REQUIRED" ? "required" : "invalid";
      }
    }
    return {
      ok: false,
      confirmed: false,
      code: INQUIRY_CODES.VALIDATION,
      reference: null,
      details,
      contactErrors,
    };
  }

  return {
    ok: false,
    confirmed: false,
    code: INQUIRY_CODES.REJECTED,
    reference: null,
    details: detailsFrom(inquiryResponse.payload),
    contactErrors: {},
  };
}
