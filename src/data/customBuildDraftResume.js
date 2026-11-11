export function draftHasProgress(draft) {
  if (!draft || typeof draft !== "object") return false;
  const step = Number(draft.currentStep);
  if (Number.isInteger(step) && step > 1) return true;
  const selections = draft.selections && typeof draft.selections === "object" ? draft.selections : {};
  for (const [key, value] of Object.entries(selections)) {
    if (key === "fretCount") continue;
    if (value == null || value === false || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    return true;
  }
  return false;
}

export function isResumableCustomBuildDraft(draft) {
  if (!draft) return false;
  if (draft.submitStatus === "success") return false;
  return draftHasProgress(draft);
}

export function storedDraftShouldStartFresh(stored, sessionSnapshot) {
  if (sessionSnapshot?.submitStatus === "success") return false;
  return stored?.submitStatus === "success";
}

export function isCustomBuildPath(href) {
  const value = String(href || "").trim();
  if (!value || value.startsWith("#")) return false;
  try {
    const url = new URL(value, "https://phanquan.invalid");
    return url.pathname === "/custom-build";
  } catch {
    return false;
  }
}
