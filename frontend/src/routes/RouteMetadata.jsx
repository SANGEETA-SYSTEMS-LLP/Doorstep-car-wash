import { useEffect } from "react";

const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://doorstep-car-wash-gold.vercel.app").replace(/\/$/, "");

const publicPages = {
  "/": {
    title: "Doorstep Car Wash & Monthly Plans | WashNow",
    description: "Book a doorstep car wash with WashNow. Compare available exterior wash options and monthly plans for your vehicle, choose an appointment, and follow service updates online.",
  },
  "/terms": {
    title: "Terms of Service | WashNow",
    description: "Read the WashNow terms for doorstep car wash bookings, payments, service availability, cancellations, and washer partner applications.",
  },
  "/privacy": {
    title: "Privacy Policy | WashNow",
    description: "Learn how WashNow uses account, location, vehicle, booking, and payment information to operate its doorstep car wash service.",
  },
};

const utilityPages = {
  "/login": ["Sign In | WashNow", "Sign in to your WashNow account to manage car wash bookings and service updates."],
  "/register": ["Create an Account | WashNow", "Create a WashNow account to book doorstep car washes or apply as a washer partner."],
  "/forgot-password": ["Reset Your Password | WashNow", "Request a secure password reset for your WashNow account."],
  "/reset-password": ["Choose a New Password | WashNow", "Set a new password for your WashNow account."],
};

function setMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    const [key, name] = selector.match(/\[(name|property)="([^"]+)"\]/).slice(1);
    element.setAttribute(key, name);
    document.head.append(element);
  }
  element.setAttribute(attribute, value);
}

export default function RouteMetadata({ pathname }) {
  useEffect(() => {
    const publicPage = publicPages[pathname];
    const utilityPage = utilityPages[pathname];
    const title = publicPage?.title || utilityPage?.[0] || "WashNow";
    const description = publicPage?.description || utilityPage?.[1] || "Manage your WashNow account and doorstep car wash bookings.";
    const indexable = Boolean(publicPage);
    const canonicalUrl = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;

    document.title = "WashNow";
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[name="robots"]', "content", indexable ? "index, follow, max-image-preview:large" : "noindex, nofollow");
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[property="og:site_name"]', "content", "WashNow");
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", canonicalUrl);
    setMeta('meta[property="og:image"]', "content", `${SITE_URL}/og-washnow.png`);
    setMeta('meta[property="og:image:type"]', "content", "image/png");
    setMeta('meta[property="og:image:width"]', "content", "1200");
    setMeta('meta[property="og:image:height"]', "content", "630");
    setMeta('meta[property="og:image:alt"]', "content", "WashNow doorstep car wash, on your schedule");
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (indexable) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.append(canonical);
      }
      canonical.href = canonicalUrl;
    } else {
      canonical?.remove();
    }

    let structuredData = document.head.querySelector('script[data-washnow-schema="true"]');
    if (pathname === "/") {
      if (!structuredData) {
        structuredData = document.createElement("script");
        structuredData.type = "application/ld+json";
        structuredData.dataset.washnowSchema = "true";
        document.head.append(structuredData);
      }
      structuredData.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "WashNow", url: `${SITE_URL}/`, logo: `${SITE_URL}/favicon.svg` },
          { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "WashNow", url: `${SITE_URL}/`, publisher: { "@id": `${SITE_URL}/#organization` }, inLanguage: "en-IN" },
        ],
      });
    } else {
      structuredData?.remove();
    }
  }, [pathname]);

  return null;
}
