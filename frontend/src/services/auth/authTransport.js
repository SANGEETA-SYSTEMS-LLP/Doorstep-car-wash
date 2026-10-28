// Keep the real Supabase URL for session storage; proxy only Auth HTTP traffic.
export function createAuthFetch(supabaseUrl, fetchImpl, useProxy, onAuthRequest) {
  const authBase = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/`;
  return (input, options) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith(authBase)) onAuthRequest?.(url, options || {});
    if (!useProxy || !url.startsWith(authBase)) return fetchImpl(input, options);
    const target = `/supabase-auth/${url.slice(authBase.length)}`;
    return fetchImpl(input instanceof Request ? new Request(new URL(target, globalThis.location.origin), input) : target, options);
  };
}

export function loginErrorMessage(error) {
  if (error?.name === "AuthRateLimitError") return error.message;
  if (error?.name === "AuthRetryableFetchError" || /failed to fetch|fetch failed|networkerror|network request failed/i.test(error?.message || "")) {
    return "Cannot reach the sign-in service. Check your internet connection and try again. If this continues locally, restart the frontend server.";
  }
  return error?.message || "Unable to sign in. Please try again.";
}
