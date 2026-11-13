import {
  supabase,
} from "../services/auth/supabase";

// Keep browser requests same-origin in both development and production.
// Vite and the production host proxy /api to the backend, avoiding CORS and
// localhost/127.0.0.1 IPv4/IPv6 differences in browser sessions.
const API_URL = "/api";
const RETRYABLE_GET_STATUSES = new Set([502, 503, 504]);

function wait(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("The request was aborted.", "AbortError"));
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("The request was aborted.", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

let refreshing;
async function refreshAccessToken() {
  refreshing ??= supabase.auth.refreshSession().finally(() => { refreshing = null; });
  const { data, error } = await refreshing;
  if (error) return null;
  return data.session?.access_token || null;
}
async function getAccessToken() {
  const {
    data: { session },
  } =
    await supabase.auth.getSession();

  return (
    session?.access_token ||
    null
  );
}

export async function apiRequest(
  endpoint,
  options = {}
) {
  const token =
    await getAccessToken();

  const isFormData = options.body instanceof FormData;

  const requestUrl = `${API_URL}${endpoint}`;
  const requestOptions = {
        ...options,
        cache: options.cache || "no-store",

        headers: {
          ...(!isFormData
            ? { "Content-Type": "application/json" }
            : {}),

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),

          ...options.headers,
        },
      };
  let response;
  for (let attempt = 0; ; attempt += 1) {
    response = await fetch(requestUrl, requestOptions);
    if (options.method && options.method.toUpperCase() !== "GET") break;
    if (!RETRYABLE_GET_STATUSES.has(response.status) || attempt >= 2) break;
    await wait(300 * (2 ** attempt), options.signal);
  }

  if (response.status === 401 && token) {
    const renewed = await refreshAccessToken();
    if (renewed) response = await fetch(API_URL + endpoint, {
      ...options,
      cache: options.cache || "no-store",
      headers: { ...(!isFormData ? {"Content-Type":"application/json"} : {}), ...options.headers, Authorization: "Bearer " + renewed },
    });
  }
  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw Object.assign(new Error(data?.message || `Request failed (${response.status})`), { status: response.status });
  }

  return data;
}
