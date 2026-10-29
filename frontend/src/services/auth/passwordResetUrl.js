const PRODUCTION_SITE_URL = "https://doorstep-car-wash-gold.vercel.app";

export function getPasswordResetRedirectUrl() {
  const siteUrl = import.meta.env.VITE_SITE_URL ||
    (import.meta.env.PROD ? PRODUCTION_SITE_URL : window.location.origin);
  return new URL("/reset-password", siteUrl).toString();
}
