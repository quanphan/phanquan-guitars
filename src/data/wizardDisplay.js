export function hasConfiguredOptions(options) {
  return Array.isArray(options) && options.some((option) => option && option.active !== false);
}

export function visibleSummaryRows(rows) {
  return (rows || []).filter((row) => {
    if (!row || row.value == null) return false;
    const text = String(row.value).trim();
    return text.length > 0;
  });
}

export function visibleReviewRows(rows) {
  return visibleSummaryRows(rows);
}
