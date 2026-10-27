import { isCustomBuildApiConfigured } from "../config/api.js";
import { requestForm, requestJson } from "./apiClient.js";
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

export async function uploadCustomBuildReferenceImage(file) {
  if (!(file instanceof File)) {
    return { ok: false, code: "BAD_REQUEST", path: null };
  }
  const formData = new FormData();
  formData.append("file", file);
  const result = await requestForm("/api/custom-build/uploads", { method: "POST", formData });
  const path = result.payload?.data?.path || result.payload?.data?.url;
  if (!result.ok || result.payload?.success !== true || typeof path !== "string") {
    return {
      ok: false,
      code: result.payload?.error?.code || (result.network ? INQUIRY_CODES.NETWORK : "REJECTED"),
      path: null,
    };
  }
  return { ok: true, code: null, path };
}

export async function deleteCustomBuildReferenceImage(path) {
  if (typeof path !== "string" || !path.trim()) {
    return { ok: false, code: "BAD_REQUEST" };
  }
  const result = await requestJson(
    `/api/custom-build/uploads?path=${encodeURIComponent(path.trim())}`,
    { method: "DELETE" },
  );
  if (!result.ok || result.payload?.success !== true) {
    return { ok: false, code: result.payload?.error?.code || "REJECTED" };
  }
  return { ok: true, code: null };
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
        if (issue.code === "REQUIRED") {
          contactErrors[field] = field === "contactPhone" ? "phoneRequired" : "required";
        } else if (field === "contactPhone") {
          contactErrors[field] = "phoneInvalid";
        } else {
          contactErrors[field] = "invalid";
        }
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
