# GWS Instant Quote

An instant landed-cost estimator that drops directly onto a wholesale product
(deal) page, plus an admin portal for the internal team to read incoming
pricing requests and control the pricing engine live.

Built for a B2B closeout / liquidation marketplace (styled after
gwsconnect24.com). It replaces the slow "leave your email, we reply in 24h"
flow: a buyer fills a short form on the deal page, instantly sees an itemized
landed-cost **range** and per-unit cost, and submits a fully-qualified request
that is saved and forwarded to the team's webhook.

---

## Tech stack

- **Next.js (App Router)** + **TypeScript** + **Tailwind CSS**
- **Prisma + SQLite** for persistence (a single local `dev.db` file — easy to
  self-host, and swappable to Postgres later)
- One API route accepts a quote request, persists it, and forwards it to an
  outbound webhook (`QUOTE_WEBHOOK_URL`)
- `/admin` is an open page (this is a demo — no auth)

---

## Quick start

```bash
# 1. install
npm install

# 2. configure env (copy the example and edit values)
cp .env.example .env

# 3. create the SQLite db + seed the deal, rates, and 3 example requests
npm run setup

# 4. run
npm run dev
```

Then open:

- Storefront / estimator → http://localhost:3000  (redirects to the seeded deal
  `/deals/GWS-DEAL-50`)
- Admin portal → http://localhost:3000/admin  (open page, no login)

### Handy scripts

| Script            | What it does                                             |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Start the dev server                                     |
| `npm run build`   | Production build (`prisma generate` + `next build`)      |
| `npm run start`   | Start the production server                              |
| `npm run setup`   | `prisma db push` + seed                                  |
| `npm run db:seed` | Seed / re-seed (resets requests to the 3 examples)       |
| `npm run db:reset`| Drop + recreate the db, then seed                        |
| `npm run lint`    | ESLint                                                   |

---

## Environment variables

See [`.env.example`](.env.example):

| Variable            | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`      | SQLite file path. Swap for a Postgres URL to migrate later.    |
| `QUOTE_WEBHOOK_URL` | Where each accepted quote request is POSTed (fire-and-forget). |

**Set the webhook:** grab a throwaway URL from https://webhook.site, paste it
into `QUOTE_WEBHOOK_URL`, and every submitted request will arrive there as JSON
(the exact team schema plus `ref`, `received_at`, `estimate`, and
`restricted_channels_hit`). If the webhook is down or unset, the buyer is never
blocked — the failure is only logged.

---

## The estimator engine

The math lives in one **pure function**, [`src/lib/estimator.ts`](src/lib/estimator.ts),
used by **both** the live product-page UI and the API on submit. The API always
recomputes server-side — client math is never trusted.

```
goods          = listedUnitPrice * quantity
weight         = unitWeightLb * quantity
zone           = isCanadianPostal(postal) ? zoneMultCA : 1.0
managedService = goods * managedServicePct            // always applies
if managed_by_gws:
  freight      = max(minFreight, weight * freightPerLb * zone)
  liftgate     = requires_liftgate ? liftgateSurcharge : 0
  handling     = (!dock && !forklift) ? noDockHandling : 0
  duty         = zone > 1 ? goods * dutyRatePct : 0    // cross-border only
  logisticsFee = (freight + liftgate + handling) * logisticsFeePct
else:
  freight = duty = liftgate = handling = logisticsFee = 0
insurance      = insurance ? goods * insurancePct : 0
total          = goods + freight + duty + liftgate + handling
                 + insurance + logisticsFee + managedService
low / high     = total * (1 ∓ rangeBandPct)
perUnit        = total / quantity
```

**Validation:** `quantity >= moq`, and `destination_postal_code` must match a US
ZIP (`12345`) or a CA postal code (`A1A 1A1`). The live estimate is blocked
until both pass, with inline field errors; the API re-validates on submit.

---

## Data model

Three Prisma models (see [`prisma/schema.prisma`](prisma/schema.prisma)):

- **Deal** — one product/lot; it is the page context that feeds the estimator.
- **Rates** — a single editable config row that drives all the estimator math.
- **QuoteRequest** — a saved lead. The stored `payload` mirrors the team's exact
  JSON schema, and the row also keeps the `ref`, timestamp, buyer display name,
  `estLow`/`estHigh`/`perUnit`, restricted channels hit, and `status`.

> SQLite has no array columns, so channel lists are stored as JSON strings and
> parsed in [`src/lib/data.ts`](src/lib/data.ts). Migrating to Postgres later,
> you can switch these to native `String[]` — the app boundary already hands you
> clean typed arrays.

---

## Adding another deal (embed the estimator on a new product page)

The estimator is deliberately **SKU-free** — it reads the deal from page
context, so it drops onto any product page by passing a `dealId`. To add a new
deal:

1. **Create the Deal row.** Either add it to the seed
   ([`prisma/seed.ts`](prisma/seed.ts)) alongside `GWS-DEAL-50`, or insert one
   directly, e.g.:

   ```ts
   await prisma.deal.create({
     data: {
       id: "GWS-DEAL-51",
       name: "Dyson V8 Vacuum — Refurb Pallet",
       category: "Home & Appliance",
       condition: "Refurbished — Grade A",
       listedUnitPrice: 129,
       retailRef: 279,
       unit: "unit",
       unitsPerPallet: 40,
       moq: 40,
       unitWeightLb: 5.8,
       restrictedChannels: JSON.stringify(["Walmart"]),
       imageEmoji: "🧹",
     },
   });
   ```

2. **Visit the page.** `/deals/GWS-DEAL-51` now renders the full hero + estimator
   with zero extra code — the route
   ([`src/app/deals/[id]/page.tsx`](src/app/deals/[id]/page.tsx)) fetches the
   deal and rates and renders `<Estimator deal={deal} rates={rates} />`.

To embed the estimator inside an existing page you already have, import the
component and pass a deal:

```tsx
import { Estimator } from "@/components/Estimator";
import { getDeal, getRates } from "@/lib/data";

const deal = await getDeal("GWS-DEAL-51");
const rates = await getRates();
// ...
<Estimator deal={deal!} rates={rates} />
```

---

## Deploy

### Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Set env vars in the Vercel project settings: `QUOTE_WEBHOOK_URL` and
   `DATABASE_URL`.
   - SQLite on Vercel's ephemeral filesystem does **not** persist between
     deploys/invocations. For a real deployment, switch the datasource to
     Postgres (e.g. Vercel Postgres / Neon): change `provider = "postgresql"` in
     `prisma/schema.prisma`, set `DATABASE_URL` to the Postgres URL, then run
     `prisma db push` and the seed once. No app code changes are required.
3. The build command (`prisma generate && next build`) is already wired via
   `npm run build`.

### Any Node host

```bash
npm install
npm run setup        # creates + seeds the db
npm run build
npm run start        # serves on $PORT (default 3000)
```

---

## What was verified

- `npm run build` — clean (no type or lint errors), all 7 routes compile.
- Full round trip: click **Generate me an instant Quote** on the product page →
  fill the form → the request appears in the admin portal → edit a rate → a
  fresh estimate reflects the new number immediately.
- Server-side recompute matches the spec math exactly (incl. CA duty, no-dock
  handling, liftgate, insurance, ±range band).
