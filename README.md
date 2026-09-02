# Aarika Fabric Care

Marketing site for Aarika Fabric Care — laundry, dry cleaning and steam ironing
in Daliganj, Lucknow.

Plain HTML, CSS and JavaScript. No build step, no framework, no dependencies:
the files in this repository are the files that get served.

## Pages

| URL         | File            |
|-------------|-----------------|
| `/`         | `index.html`    |
| `/about`    | `about.html`    |
| `/services` | `services.html` |
| `/packages` | `packages.html` |
| `/contact`  | `contact.html`  |
| 404         | `404.html`      |

Every page answers on one URL only, without the `.html` extension. Vercel does
this from `vercel.json` (`cleanUrls`); Apache does it from `.htaccess`. Both are
in the repo, so the same files deploy to either.

## Layout

```
index.html  about.html  services.html  packages.html  contact.html  404.html
css/style.css     one stylesheet, design tokens at the top
js/main.js        header, mobile menu, scroll reveals, form validation
assets/img/       photography and the logo (see assets/img/README.txt)
robots.txt  sitemap.xml
vercel.json       clean URLs, cache and security headers for Vercel
.htaccess         the same rules for Apache hosting, plus HTTPS forcing
.vercelignore     files that stay in the repo but out of the deployment
send.php          contact form handler — Apache only, see below
serve.js          local preview server, never deployed
```

`source/` holds the original design mockups. It is gitignored: 8.7MB that would
be cloned and redeployed on every change without ever being served.

## Running it locally

```bash
node serve.js
```

Then open <http://localhost:5174>. `serve.js` mirrors the clean-URL and 404
behaviour of both hosts so local and live addresses match. Opening `index.html`
directly from the file system will not work — the pages use absolute paths
(`/css/style.css`, `/about`), which need a server.

## Deploying to Vercel

1. Create an empty repository on GitHub, then:

   ```bash
   git remote set-url origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

2. In Vercel, **Add New → Project**, import the repository.
3. Framework preset **Other**. Leave the build command and output directory
   empty — there is nothing to build, and the site lives at the repository root.
4. Deploy.

`vercel.json` is picked up automatically. `404.html` is served for unknown
paths. No environment variables are needed for the site itself.

To attach the real domain: **Project → Settings → Domains**, add it, and point
the registrar at Vercel with the records it shows you.

## The contact form

**`send.php` does not run on Vercel.** Vercel has no PHP runtime, so the form on
`/contact` will not send there. `.vercelignore` keeps the file out of the
deployment, because Vercel would otherwise serve it as plain text and publish
the recipient address in its source.

Three ways forward, in order of least work:

1. **Host on Apache instead** (Hostinger, cPanel, most shared hosts). Everything
   in this repo works as-is, including `send.php` and `.htaccess`. Set `$TO` and
   `$FROM` at the top of `send.php` first; `$FROM` must be a real mailbox on the
   hosting domain or the host will refuse to send.
2. **Keep Vercel and use a form service.** Point the form's `action` at a
   provider such as Formspree and delete `send.php`. No server code needed.
3. **Keep Vercel and add a serverless function.** Add `api/contact.js` that
   posts to an email API, and change the form's `action` to `/api/contact`.
   This needs an account and an API key stored as a Vercel environment variable.

Until one of these is done, the phone numbers and the WhatsApp link on
`/contact` still work — only the form is inert.

## Before this goes live

- **Domain.** `aarikafabriccare.com` is assumed throughout and drives every
  canonical URL, the Open Graph tags, `sitemap.xml` and `robots.txt`. On a
  `.vercel.app` URL those canonicals point at a domain that does not resolve,
  which tells search engines to index an address that does not exist. Either
  attach the real domain, or replace it everywhere first:

  ```bash
  grep -rl aarikafabriccare.com --include=*.html --include=*.xml --include=*.txt . | xargs sed -i 's|https://aarikafabriccare.com|https://your-real-domain|g'
  ```

- **`send.php`** — `$TO` and `$FROM` are placeholders. See above.
- **Social links** — the Facebook and Instagram links in the footer are `#`.
- **Street number** — the source posters disagree between 498/58 and 598/58.
  The site says **498/58**, in the footer, the contact page, the structured data
  and the map links.
- **Home page reviews** — these came with the original design and are not real
  customer quotes. Replace them with genuine ones, or remove the section.

## Design and accessibility notes

- Sections are rounded tinted panels inset from the page edge, alternating blue
  `#EAF5F9` and sand `#F3EFE7` on a cream `#FDF8F3` page, matching the original
  mockups. Soap bubbles drift behind the content and the offer badge hangs from
  a string and sways.
- All body text meets WCAG AA contrast (4.5:1) on the surface it sits on, and
  touch targets are at least 44px on coarse pointers.
- Scroll reveals animate only `opacity` and `transform`, so they stay off the
  layout path. `prefers-reduced-motion` turns them off. If `js/main.js` fails to
  load, or the observer never fires, everything on screen is shown anyway rather
  than staying blank.
- Per-page title, description, canonical, Open Graph and Twitter tags.
  `DryCleaningOrLaundry` structured data on the home page, `BreadcrumbList` on
  the inner pages, `FAQPage` on `/services`.
