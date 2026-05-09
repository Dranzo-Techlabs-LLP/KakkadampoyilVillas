# Kakkadampoyil Villas

Boutique website for three private villas in Kakkadampoyil, Kerala — Lux, Fortune, Munnas.
Next.js 16 (App Router) · React 19 · Tailwind v4 · Framer Motion · React-Three-Fiber.

Marketing site, villa pages with full photo lightbox, enquiry form that emails leads,
nature animation overlays (drifting leaves + wind streaks), responsive across devices.

---

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

Source layout:

```
src/
├── app/
│   ├── api/enquiry/route.ts    # nodemailer endpoint
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Hero, Navbar, AboutStrip, VillasSection, VillaCard,
│   ├── VillaDetailModal, ExperiencesSection, GallerySection,
│   ├── LocationSection, ContactSection, Footer, WhatsAppFloat,
│   └── NatureElements, NatureScene3D
└── lib/villas.ts               # villa data + image arrays
public/images/{lux,fortune,munnas}/   # villa photos (89 total)
```

### Environment

Copy `.env.local.example` → `.env.local` and fill SMTP credentials before
`npm run dev` if you want the enquiry form to actually send mail. Without
credentials, the API logs to console and returns success.

---

## Production build

```bash
npm run build
npm run start        # or use server.js + PM2
```

Next is configured with `output: "standalone"` — `.next/standalone/` is a
self-contained Node bundle (server.js + traced node_modules + .next).

---

## cPanel deployment (PM2 + Apache reverse proxy)

App runs as Node behind Apache. App code lives in `/home/<user>/app/`,
public_html holds only an `.htaccess` reverse proxy.

Build artifacts (zipped standalone bundle, deploy.sh, ecosystem.config.js,
.htaccess template, DEPLOY.md) are produced into `deploy_pkg/` (gitignored).
Generate a fresh deploy zip with the steps in `DEPLOY.md`.

### `.htaccess` reverse proxy at `public_html/.htaccess`

```apache
RewriteEngine On
DirectoryIndex disabled
Options -Indexes -ExecCGI

<FilesMatch ".*">
    SetHandler None
</FilesMatch>
RemoveHandler .php .phtml .phar .cgi
RemoveType .php .phtml .phar

RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^/?(.*) "ws://127.0.0.1:4002/$1" [P,L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ http://127.0.0.1:4002%{REQUEST_URI} [P,L]
```

App listens on `127.0.0.1:4002` (configurable via `PORT` in
`ecosystem.config.js` and `.env`).

### PM2 process

```bash
cd /home/<user>/app
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd      # run the printed sudo command
```

---

## Email (enquiry form → shinky777@gmail.com)

`POST /api/enquiry` validates with Zod and sends via nodemailer. Configure SMTP
through env vars on the server:

```
SMTP_HOST=mail.kakkadampoyilvillas.com
SMTP_PORT=465
SMTP_USER=enquiry@kakkadampoyilvillas.com
SMTP_PASS=<mailbox password>
SMTP_FROM=enquiry@kakkadampoyilvillas.com
ENQUIRY_TO_EMAIL=shinky777@gmail.com
```

Mailbox `enquiry@kakkadampoyilvillas.com` must exist in cPanel → Email Accounts.

---

## Brochure

A 6-page editorial PDF brochure for sharing with customers lives at
`brochure/Kakkadampoyil_Villas_Brochure.pdf`. Regenerate with:

```bash
python3 brochure/build.py
```

(Requires `pip3 install pillow reportlab`.)

---

## Tech notes

- Tailwind v4 with custom theme tokens in `globals.css`
- Image optimization disabled in `next.config.ts` (using local pre-compressed JPEGs)
- Villa photo gallery uses `yet-another-react-lightbox`
- Nature animations are CSS-driven (no Three.js runtime cost) via
  `NatureElements.tsx` + scoped CSS Module
- `download_images.py` re-pulls villa photos from the source Drive folders if
  needed
