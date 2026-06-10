# Kakkadampoyil Villas — Admin Panel

A private, login-only admin console bolted onto the same Next.js app at **`/admin`**.
Nothing is exposed on the public site; every `/admin` page and `/api/admin/*` route is
gated by an auth proxy + per-permission checks.

## Features

- **Dashboard** — today's arrivals/departures, month-to-date revenue & profit, upcoming bookings, per-villa snapshot.
- **Calendar** — month grid, colour-coded bookings per villa, click through to a booking.
- **Bookings** — list with search/filter, create, edit, change status (enquiry → confirmed → checked-in → completed), cancel with reason. Overlap detection per villa.
- **Payments & refunds** — per-booking ledger; record payments and refunds with method/reference; live balance.
- **Expenses** — log operating expenses by villa + category; delete.
- **Accounting** — collected, refunded, net revenue, expenses, profit, contracted value, outstanding; per-villa breakdown; date + villa filters.
- **Reports** — preview + CSV export for bookings, payments, and expenses (date + villa filtered).
- **Villas** — edit capacity, bedrooms, base rate, calendar colour, active flag.
- **Users** — add/edit users, assign roles, enable/disable.
- **Roles & rights** — permission matrix per role; create custom roles; toggle exactly which features each role can see/use.

## Roles seeded

| Role | Access |
|------|--------|
| Administrator | Everything (all 15 permissions) |
| Manager | Bookings, calendar, payments, expenses, accounting, reports, villa view |
| Front Desk | Bookings + calendar only |

Permissions are fully editable in **Roles & Rights**. The sidebar auto-hides features a
user's role can't access, and every API double-checks the permission server-side.

## One-time setup

### 1. Environment

`.env.local` (gitignored — never committed) holds the DB + auth config:

```
DB_HOST=<mysql host>
DB_PORT=3306
DB_USER=<remote-capable mysql user>   # e.g. an app user granted on the villas db
DB_PASS=<password>                    # quote it if it contains a # character
DB_NAME=villas
AUTH_SECRET=<random 32+ char secret>
```

> The app connects to MySQL over direct TCP, so `DB_USER` must be allowed from
> the app host (a `user@'%'` grant or the specific IP). `root@localhost` will
> not work from a remote machine.

### 2. Migrate schema + create first admin

```bash
node scripts/admin-setup.mjs "Your Name" admin@kakkadampoyilvillas.com 'ChooseAStrongPassword'
```

This creates all tables, seeds roles/permissions/villas, and creates the
Administrator login. Re-running is safe (idempotent; the admin row upserts).

### 3. Run

```bash
npm run dev          # http://localhost:3000/admin
```

Visit `/admin` → redirected to `/admin/login` → sign in.

## Production (cPanel / PM2)

Set the same env vars in the server's `.env` (or the cPanel Node-app env UI),
rebuild the standalone bundle, and the `/admin` routes ship with the rest of the
app — no separate deploy. The DB pool reuses one connection set; the auth cookie
is httpOnly + secure in production.

## Security model

- `src/proxy.ts` (Next 16 middleware) verifies the JWT cookie at the edge for all
  `/admin` and `/api/admin` requests; unauthenticated → redirect/401.
- `getSessionUser()` (Node runtime) loads the user + role permissions from MySQL.
- Every API handler wraps logic in `guard("<permission>", …)` — 403 if the role
  lacks it. Client UI hides controls but the server is the source of truth.
- Passwords hashed with bcrypt. All sensitive actions written to `audit_log`.
- `robots: noindex` on the admin section; nothing linked from the public site.

## Schema

See `src/admin-schema.sql` — tables: `roles`, `permissions`, `role_permissions`,
`users`, `villas`, `bookings`, `payments`, `expenses`, `audit_log`.
