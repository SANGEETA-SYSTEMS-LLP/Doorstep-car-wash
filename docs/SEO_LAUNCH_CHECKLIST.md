# WashNow SEO launch checklist

The public production URL is `https://doorstep-car-wash-gold.vercel.app/`.

## Implemented in the project

- `frontend/public/robots.txt` allows public pages, keeps account workspaces and sign-in flows out of crawling, and points to the sitemap.
- `frontend/public/sitemap.xml` lists the homepage, Terms of Service, and Privacy Policy. These are the site's current indexable pages.
- The homepage, Terms, and Privacy have route-specific titles, descriptions, canonicals, and Open Graph tags in their initial HTML; client-side navigation keeps these in sync. Account, authentication, and unknown routes are marked `noindex` after the app loads.
- The homepage emits Organization and WebSite JSON-LD.
- The homepage and legal pages use a single H1 with nested section headings. The homepage navigation links point to existing section IDs and legal routes.
- The compressed Open Graph artwork is `frontend/public/og-washnow.png` at 1200 × 630. Existing customer and operations photos have descriptive alt text and use lazy loading.
- Vercel's deployment already sends HSTS with `Strict-Transport-Security`; Vercel provides HTTPS for the deployment domain.

The public pages are responsive and already use a viewport declaration and responsive layout classes. The homepage has no large raster content images, and below-the-fold service photos load lazily. Performance scores still need measurement against the deployed site and real-user data.

## After deployment: Search Console

1. Sign in to Google Search Console with an account that can manage the site.
2. Add the URL-prefix property `https://doorstep-car-wash-gold.vercel.app/` and complete one of Google's offered ownership checks. The repository does not have Search Console account access, so ownership cannot be verified from code.
3. Submit `https://doorstep-car-wash-gold.vercel.app/sitemap.xml`.
4. Use URL Inspection on the homepage, Terms, and Privacy pages. Check Google's rendered page and request indexing where appropriate.
5. Review Page Indexing, HTTPS, and Core Web Vitals reports after Google has collected enough data.

## Backlink plan

- Complete accurate business profiles on relevant local directories and map services for the actual operating locations; use consistent business name, phone, and website details.
- Ask existing service partners, residential communities, and local automotive businesses to link to the WashNow homepage or a useful service guide when there is a real partnership or customer benefit.
- Publish practical, original car-care guides and link them from the homepage; share them with local motoring groups and publishers who may find them useful.
- Track referring domains and referral traffic. Avoid paid link schemes, bulk directory submissions, and automated link exchanges.

Search Console verification and off-site link acquisition need the site owner's accounts and business relationships; they are not actions a repository change can complete.
