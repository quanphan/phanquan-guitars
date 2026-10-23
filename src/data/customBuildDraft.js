import {
  BUILDER_STEPS,
  EMPTY_SELECTIONS,
  pruneSelections,
} from "./customBuild.js";

export const DRAFT_STORAGE_KEY = "phanquan-guitars-custom-build-draft-v1";
export const DRAFT_SCHEMA_VERSION = 1;
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

const SUBMIT_STATUSES = new Set([
  "idle",
  "invalid",
  "invalid-config",
  "unavailable",
  "failure",
  "success",
]);

export function createDraftId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyDraft(now = Date.now()) {
  return {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    draftId: createDraftId(),
    createdAt: now,
    updatedAt: now,
    expiresAt: now + DRAFT_TTL_MS,
    currentStep: 1,
    selections: { ...EMPTY_SELECTIONS },
    submitStatus: "idle",
    inquiryReference: null,
  };
}

function sanitizeSelections(raw) {
  const next = { ...EMPTY_SELECTIONS };
  if (!raw || typeof raw !== "object") return pruneSelections(next);
  for (const key of Object.keys(EMPTY_SELECTIONS)) {
    if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;
    if (key === "stringCount") {
      if (raw[key] == null || raw[key] === "") {
        next[key] = null;
      } else {
        const count = Number(raw[key]);
        next[key] = Number.isFinite(count) ? count : null;
      }
    } else if (key === "acknowledgement") {
      next[key] = Boolean(raw[key]);
    } else {
      next[key] = raw[key];
    }
  }
  return pruneSelections(next);
}

function sanitizeStep(value) {
  const step = Number(value);
  if (!Number.isInteger(step)) return 1;
  return Math.min(Math.max(step, 1), BUILDER_STEPS.length);
}

function sanitizeSubmitStatus(value) {
  if (value === "submitting") return "idle";
  return SUBMIT_STATUSES.has(value) ? value : "idle";
}

export function parseDraft(raw, now = Date.now()) {
  if (raw == null || raw === "") return null;
  let parsed;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.schemaVersion !== DRAFT_SCHEMA_VERSION) return null;
  if (typeof parsed.draftId !== "string" || !parsed.draftId.trim()) return null;
  if (
    typeof parsed.createdAt !== "number" ||
    typeof parsed.updatedAt !== "number" ||
    typeof parsed.expiresAt !== "number"
  ) {
    return null;
  }
  if (parsed.expiresAt <= now) return null;

  const submitStatus = sanitizeSubmitStatus(parsed.submitStatus);
  return {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    draftId: parsed.draftId.trim(),
    createdAt: parsed.createdAt,
    updatedAt: parsed.updatedAt,
    expiresAt: parsed.expiresAt,
    currentStep: sanitizeStep(parsed.currentStep),
    selections: sanitizeSelections(parsed.selections),
    submitStatus,
    inquiryReference:
      submitStatus === "success" && typeof parsed.inquiryReference === "string"
        ? parsed.inquiryReference
        : null,
  };
}

export function readCustomBuildDraft(
  storage = globalThis.localStorage,
  now = Date.now(),
) {
  try {
    const raw = storage?.getItem(DRAFT_STORAGE_KEY);
    const draft = parseDraft(raw, now);
    if (draft) return draft;
    if (raw) storage?.removeItem(DRAFT_STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

export function writeCustomBuildDraft(
  draft,
  storage = globalThis.localStorage,
) {
  try {
    storage?.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearCustomBuildDraft(storage = globalThis.localStorage) {
  try {
    storage?.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function buildPersistedDraft({
  previous,
  currentStep,
  selections,
  submitStatus,
  inquiryReference,
  now = Date.now(),
  refreshExpiry = true,
}) {
  const createdAt = previous?.createdAt ?? now;
  const draftId = previous?.draftId || createDraftId();
  const status = sanitizeSubmitStatus(submitStatus);
  return {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    draftId,
    createdAt,
    updatedAt: refreshExpiry ? now : (previous?.updatedAt ?? now),
    expiresAt: refreshExpiry ? now + DRAFT_TTL_MS : (previous?.expiresAt ?? now + DRAFT_TTL_MS),
    currentStep: sanitizeStep(currentStep),
    selections: sanitizeSelections(selections),
    submitStatus: status,
    inquiryReference:
      status === "success" && inquiryReference ? String(inquiryReference) : null,
  };
}
