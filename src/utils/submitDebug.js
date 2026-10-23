const PREFIX = "[custom-build submit]";

function canLog() {
  return import.meta.env.DEV;
}

export function debugSubmit(phase, detail = {}) {
  if (!canLog()) return;
  const safe = {};
  for (const [key, value] of Object.entries(detail)) {
    if (value == null || value === "") continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    } else if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      safe[key] = value;
    }
  }
  console.info(PREFIX, phase, safe);
}
