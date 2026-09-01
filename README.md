# Aarika Fabric Care

Marketing site for Aarika Fabric Care — laundry, dry cleaning and steam ironing
in Daliganj, Lucknow.

Plain HTML, CSS and JavaScript. No build step, no framework, no dependencies:
the files in this repository are the files that get served. It will run on any
shared host that serves static files, and the contact form needs PHP `mail()`.

## Pages

| URL         | File            |
|-------------|-----------------|
| `/`         | `index.html`    |
| `/about`    | `about.html`    |
| `/services` | `services.html` |
| `/packages` | `packages.html` |
| `/contact`  | `contact.html`  |
| 404         | `404.html`      |

`.htaccess` serves each page without its `.html` extension and 301-redirects the
`.html` form to the clean one, so every page answers on exactly one URL.

## Running it locally

```bash
node serve.js
```

Then open <http://localhost:5174>. `serve.js` is a development convenience only —
it mirrors the `.htaccess` clean-URL and 404 behaviour so local and production
addresses match. It is never used in production.

## Layout

```
index.html  about.html  services.html  packages.html  contact.html  404.html
css/style.css     one stylesheet, 17 sections, custom-property design tokens
js/main.js        header state, mobile menu, scroll reveals, form validation
assets/img/       photography and the logo (see assets/img/README.txt)
send.php          contact form handler
.htaccess         clean URLs, HTTPS, compression, caching, hardening
sitemap.xml  robots.txt
source/           the original design-canvas files this site was rebuilt from,
                  kept for reference and blocked from the web by .htaccess
```

## Before this goes live

These are placeholders and need the real values:

- **Domain** — `aarikafabriccare.com` is assumed throughout. It drives every
  canonical URL, the Open Graph tags, `sitemap.xml` and `robots.txt`.
- **`send.php`** — `$TO` and `$FROM`. `$FROM` must be a real mailbox on the
  hosting domain or the host will refuse to send.
- **Social links** — the Facebook and Instagram links in the footer are `#`.
- **Street number** — the source posters disagree between 498/58 and 598/58.
  The site currently says **498/58**, in the footer, the contact page, the
  structured data and the map links.
- **Home page reviews** — these came with the original design and are not real
  customer quotes. Replace them with genuine ones, or remove the section.

## Accessibility and SEO notes

- Every page carries its own title, description, canonical, Open Graph and
  Twitter tags. The home page has `DryCleaningOrLaundry` structured data; the
  inner pages have `BreadcrumbList`, and `/services` adds `FAQPage`.
- All body text meets WCAG AA contrast (4.5:1) on the surface it sits on.
- Touch targets are at least 44px on coarse pointers.
- Scroll reveals animate only `opacity` and `transform`, so they stay off the
  layout path. `prefers-reduced-motion` turns them off entirely, and if
  `js/main.js` fails to load the page shows everything after 2.5 seconds rather
  than staying blank.
