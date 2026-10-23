export const INQUIRY_STATUSES = [
  "new",
  "ready_to_build",
  "building",
  "completed",
  "cancelled",
];

export function buildInquiryListQuery({
  q,
  status,
  startDate,
  endDate,
  page,
  limit,
} = {}) {
  const params = new URLSearchParams();
  const search = typeof q === "string" ? q.trim() : "";
  if (search) params.set("q", search.slice(0, 80));
  if (status && INQUIRY_STATUSES.includes(status)) params.set("status", status);
  if (typeof startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    params.set("startDate", startDate);
  }
  if (typeof endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    params.set("endDate", endDate);
  }
  if (Number.isInteger(page) && page > 0) params.set("page", String(page));
  if (Number.isInteger(limit) && limit > 0) params.set("limit", String(limit));
  return params.toString();
}

export function summarizeConfiguration(configuration) {
  const selections = configuration?.selections;
  if (selections && typeof selections === "object") {
    const fromSelections = Object.entries(selections)
      .filter(([, value]) => value != null && String(value).trim() !== "")
      .map(([key, value]) => `${key}: ${value}`)
      .slice(0, 4)
      .join(" · ");
    if (fromSelections) return fromSelections;
  }
  const notes = typeof configuration?.notes === "string" ? configuration.notes : "";
  const parts = [];
  for (const key of ["inquiryType", "productRef", "productId", "subject", "draftId"]) {
    const match = notes.match(new RegExp(`(?:^|\\n)${key}=([^\\n]*)`));
    const value = match?.[1]?.trim();
    if (value) parts.push(value);
  }
  return parts.slice(0, 4).join(" · ");
}
