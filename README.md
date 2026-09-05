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
| `/services` | `services.html` — what we clean |
| `/packages` | `packages.html` — the full rate card and the offers |
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
straight from the file system shows the design — asset paths are relative — but
the page links are absolute (`/about`), so navigation needs the server.

## Deploying to Hostinger

This is the intended host. PHP and Apache both work here, so every file in the
repository is used as-is — nothing to change, nothing to exclude.

1. **hPanel → Websites → your domain → Advanced → GIT.**
2. Create a repository:
   - Repository: `https://github.com/adityayadav30561-rgb/laundry.git`
   - Branch: `main`
   - Directory: `public_html`
3. **Deploy.** Hostinger clones the repo into `public_html`.
4. Copy the webhook URL it offers and add it in GitHub under
   **Settings → Webhooks**, so a `git push` redeploys automatically. Without
   it, press **Deploy** in hPanel after each push.

### SSL and HTTPS

`.htaccess` forces HTTPS. Issue the certificate **before** the first deploy, or
the site will redirect to an address that does not answer yet:
**hPanel → Security → SSL → install**, then wait for it to go active. If you
deploy first and the site becomes unreachable, comment out the three
`RewriteCond`/`RewriteRule` lines under "Force HTTPS" until the certificate is
live.

### The email the form sends from

`send.php` needs two values at the top of the file:

- `$TO` — where enquiries land. Any mailbox, including Gmail.
- `$FROM` — the address the mail is sent *from*. This must be a real mailbox on
  the hosting domain, created under **hPanel → Emails**. Shared hosts reject
  mail claiming to be from a domain they do not host, so a Gmail address here
  will cause silent failures.

Both are set: enquiries go to `info@aarikafabriccare.com`, sent from
`support@aarikafabriccare.com`. Create that second mailbox under
**hPanel → Emails** before the first deploy, or the host will refuse the
message. The form posts to `/send.php` and comes back to `/contact?sent=1` or
`/contact?error=1`, which `js/main.js` turns into a message.

**No password belongs in this repository.** `mail()` hands the message to the
server's own mail transport, already authenticated as the hosting account, so
there is no SMTP login to store. The mailbox password is only ever typed into
hPanel or a mail client.

## Deploying to Vercel instead

The repo also carries `vercel.json` (clean URLs, cache and security headers) and
`.vercelignore`, so it deploys there without edits: import the repository,
framework preset **Other**, leave the build command and output directory empty.

One catch, and it is the reason Hostinger is the better fit here: **Vercel has
no PHP runtime**, so `send.php` cannot run. `.vercelignore` excludes it, because
Vercel would otherwise serve it as plain text and publish the recipient address
in its source. On Vercel the form would need a form service such as Formspree,
or a serverless function in `api/` backed by an email provider. The phone
numbers and the WhatsApp link still work either way.

## Before this goes live

- **Domain.** `aarikafabriccare.com` is assumed throughout and drives every
  canonical URL, the Open Graph tags, `sitemap.xml` and `robots.txt`. If the
  site goes live on any other address, those canonicals point at a domain that
  does not resolve, which tells search engines to index somewhere that does not
  exist. Replace it everywhere before the first deploy:

  ```bash
  grep -rl aarikafabriccare.com --include=*.html --include=*.xml --include=*.txt . | xargs sed -i 's|https://aarikafabriccare.com|https://your-real-domain|g'
  ```

- **The `support@` mailbox** must exist on the hosting domain before the form
  can send. See above.
- **Social links** were removed and are to be added back with real profile URLs.
- **Blankets and quilts** read "starts from ₹69" on the service card, while the
  rate card lists Blanket Single at ₹249 and nothing blanket-related under
  ₹119. One of the two is wrong.
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
