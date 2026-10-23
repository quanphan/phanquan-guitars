import { apiUrl } from "../config/api.js";

const REQUEST_TIMEOUT_MS = 15000;

async function send(path, { method, headers, body }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl(path), {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }
    return {
      ok: response.ok,
      status: response.status,
      payload,
      network: false,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      payload: null,
      network: true,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function requestJson(path, { method = "GET", body, token } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return send(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function requestForm(path, { method = "POST", formData, token } = {}) {
  const headers = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return send(path, { method, headers, body: formData });
}
