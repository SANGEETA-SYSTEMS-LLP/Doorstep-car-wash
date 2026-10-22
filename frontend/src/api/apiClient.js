import {
  supabase,
} from "../services/auth/supabase";

const API_URL =
  import.meta.env.PROD
    ? "/api"
    : import.meta.env.VITE_API_URL || "/api";

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

  let response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

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
      }
    );

  if (response.status === 401 && token) {
    const renewed = await refreshAccessToken();
    if (renewed) response = await fetch(API_URL + endpoint, {
      ...options,
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
