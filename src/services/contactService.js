import { isCustomBuildApiConfigured } from "../config/api.js";
import { requestJson } from "./apiClient.js";
import { buildContactInquiryPayload } from "./contactInquiry.js";

export const CONTACT_INQUIRY_CODES = {
  UNAVAILABLE: "UNAVAILABLE",
  NETWORK: "NETWORK",
  VALIDATION: "VALIDATION",
  REJECTED: "REJECTED",
};

function detailsFrom(payload) {
  const details = payload?.error?.details;
  return Array.isArray(details) ? details : [];
}

function inquiryReference(payload) {
  const id = payload?.data?.id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function mapServerField(field) {
  if (field === "name" || field === "email" || field === "message" || field === "inquiryType" || field === "subject") {
    return field;
  }
  return null;
}

export async function submitContactInquiry(values) {
  if (!isCustomBuildApiConfigured()) {
    return {
      ok: false,
      confirmed: false,
      code: CONTACT_INQUIRY_CODES.UNAVAILABLE,
      reference: null,
      fieldErrors: {},
    };
  }

  const payload = buildContactInquiryPayload(values);
  const response = await requestJson("/api/contact", {
    method: "POST",
    body: payload,
  });

  if (response.network || response.status >= 500) {
    return {
      ok: false,
      confirmed: false,
      code: CONTACT_INQUIRY_CODES.NETWORK,
      reference: null,
      fieldErrors: {},
    };
  }

  const reference = inquiryReference(response.payload);
  if (
    response.status === 201 &&
    response.payload?.success === true &&
    response.payload?.data?.received === true &&
    reference
  ) {
    return {
      ok: true,
      confirmed: true,
      code: null,
      reference,
      fieldErrors: {},
    };
  }

  if (response.status === 422) {
    const fieldErrors = {};
    for (const issue of detailsFrom(response.payload)) {
      const field = mapServerField(issue.field);
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.code === "REQUIRED" ? "required" : "invalid";
      }
    }
    return {
      ok: false,
      confirmed: false,
      code: CONTACT_INQUIRY_CODES.VALIDATION,
      reference: null,
      fieldErrors,
    };
  }

  return {
    ok: false,
    confirmed: false,
    code: CONTACT_INQUIRY_CODES.REJECTED,
    reference: null,
    fieldErrors: {},
  };
}
