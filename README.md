# Apex Studios

The website for **Apex Studios**, a Nairobi studio that designs and builds websites, Google Business Profiles, payments and automation for hotels, lodges and restaurants in Kenya.

Live: <https://apex-studios-8xq.pages.dev>

## What is in it

- **Public site:** Home, Work (with a page per project), Services, eight service pages, Process, About, Contact, Articles, Privacy and Terms.
- **Service pages:** Website Design, Development, Automation, Branding, Google Business Profile, M-Pesa Payments, WhatsApp Automation and Care Plans.
- **Private dashboard at `/admin`:** an inbox for enquiries, editable site and contact details, a projects editor with image upload, a test alert button and a backup download.
- **Enquiry pipeline:** contact form, then `/api/contact`, then the dashboard inbox, with an optional Telegram alert for every new enquiry. The visitor's source (for example `instagram / bio`) is stored with the message when links are tagged with `?utm_source=`.
- **SEO at build time:** every page gets its own title, description, canonical link and share tags written into the HTML, plus `sitemap.xml`, `robots.txt`, `llms.txt`, business and breadcrumb structured data.

## Tech stack

| Area | Tools |
|---|---|
| App | React 19, Vite 8, React Router 7 |
| Styling | Tailwind CSS 4, Satoshi (Fontshare), Herr Von Muellerhoff (signature logo) |
| Motion and 3D | GSAP, Lenis smooth scroll, three.js with react-three-fiber |
| Hosting | Cloudflare Pages |
| Backend | Cloudflare Pages Functions and one KV namespace |

## Getting started

Requires Node 22.

```bash
npm install
npm run dev       # local site at http://localhost:5173
npm run lint      # ESLint
npm run build     # production build, then the SEO step (scripts/seo.mjs)
npm run preview   # serve the built site
```

`npm run dev` has no `/api`, so the site falls back to the content built into `src/data`. To try the API and dashboard locally, build first and run Pages with a throwaway KV store and throwaway secrets:

```bash
npm run build
npx wrangler pages dev dist --kv=DB \
  --binding ADMIN_PASSWORD=use-a-throwaway-value \
  --binding SESSION_SECRET=use-a-long-random-throwaway-value
```

## Project structure

```
functions/api/[[route]].js   All /api routes (public and dashboard)
scripts/seo.mjs              Build step: page meta, sitemap, robots, llms.txt, structured data
public/                      Static files, icons, share image, security headers (_headers)
src/
  main.jsx, App.jsx          Entry point and routes
  components/                Layout, Nav, Footer, Hero, Work, Services, ServiceLayout, ...
  pages/                     One file per route
  data/                      Content: site, contact, projects, articles, one file per service page
  lib/                       content.js (built-in plus dashboard content), crumbs.js, utm.js
  admin/Admin.jsx            The dashboard (loaded only on /admin)
```

## Where content lives

| To change | Edit |
|---|---|
| Name, role line, location, availability | `src/data/site.js`, or the dashboard's Site tab |
| Email, WhatsApp, Instagram, TikTok | `src/data/contact.js`, or the dashboard's Site tab |
| Projects | `src/data/projects.js`, or the dashboard's Projects tab |
| A service page | The matching file in `src/data/` |
| Articles | `src/data/articles.js` (an article shows once `published: true`) |

Dashboard changes are stored in KV and layered over the files above. After you first save the project list in the dashboard, the dashboard's list replaces the one in `projects.js`. Changes appear on the site within about 30 seconds.

## Deploying on Cloudflare Pages

Connect the repo, then use:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Environment variable:** `NODE_VERSION=22`

Set these in the Pages project (Settings). The site runs without them, but the dashboard, inbox and alerts do not.

| Name | Type | Required | Purpose |
|---|---|---|---|
| `DB` | KV namespace binding | Yes | Stores enquiries, dashboard content and uploaded images |
| `ADMIN_PASSWORD` | Secret | Yes | The dashboard password. Use a long passphrase |
| `SESSION_SECRET` | Secret | Yes | Signs the sign-in cookie. Generate with `openssl rand -hex 32` |
| `TELEGRAM_BOT_TOKEN` | Secret | Optional | Sends a Telegram alert for each new enquiry |
| `TELEGRAM_CHAT_ID` | Secret | Optional | Who receives those alerts |
| `SITE_URL` | Build variable | Optional | Your custom domain, for canonical links and the sitemap, e.g. `https://example.co.ke` |
| `GOOGLE_SITE_VERIFICATION` | Build variable | Optional | Adds the Google Search Console verification tag |

Bindings and secrets only apply to the next deployment, so redeploy after changing them. Never commit secrets to the repo.

## How the API and dashboard are protected

- The password lives only in Cloudflare. The sign-in cookie is `HttpOnly`, `Secure` and `SameSite=Strict`, and lasts 7 days.
- Five wrong passwords from one connection locks sign-in for 15 minutes.
- Write requests from other websites are refused.
- The contact form allows 5 messages an hour per connection and silently drops bots using a hidden field and a timing check.
- Everything the browser sends is cleaned and length-limited on the server, and links are limited to `/`, `http://` and `https://`.
- Uploaded images must be JPEG, PNG or WebP (checked by file contents) and under 2 MB.
- Security headers are set in `public/_headers`.

The dashboard backup contains your dashboard content and all messages. Uploaded images are not included.

## Adding a service page

1. Copy an existing file in `src/data/` (for example `branding.js`) and edit the text.
2. Add a page file in `src/pages/` that renders `<ServiceLayout page={...} />`.
3. Register it in `src/App.jsx`, `src/components/Services.jsx`, `src/components/Nav.jsx`, `src/components/Footer.jsx`, `src/lib/crumbs.js` and `scripts/seo.mjs`. Add it to the Contact form's "What you need" list and the dashboard's service dropdown if you want it there.

## Gotchas

- **Heading styles:** the `h1`, `h2` and `h3` rule in `src/index.css` sits outside Tailwind's layers, so it wins over utility classes such as `font-bold` or `tracking-*` on headings. Give a heading its own class in `index.css` when it needs a different weight or spacing.
- **Scroll reveals:** `Motion.jsx` fades in `h2`, `h3`, paragraphs, list items and pill-style links (`rounded-full` links) automatically. The header, footer, menu, marquee and the hero text are skipped (see its `SKIP` selector). Add `data-hero` to anything else that must not animate.
- **The 3D sphere** is a large chunk on purpose. It loads only when scrolled near.
- **Source maps** are disabled so the source is not published with the site.

## Copyright

Copyright (c) 2026 Apex Studios. All rights reserved.
