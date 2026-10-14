import {
  supabase,
} from "../services/supabase";

const API_URL =
  import.meta.env.VITE_API_URL;

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

  const response =
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

  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Request failed (${response.status})`
    );
  }

  return data;
}