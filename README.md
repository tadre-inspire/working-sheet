# Marketcap · Working Sheet

A Notion-style workspace for creatives. Write pages, plan on a **working sheet** (an infinite canvas with images,
notes, shapes, text, drawing and comment pins), follow creative news, and track what you pay for tools.

Built with Next.js 16, React 19, Tailwind 4, TipTap, Supabase and Paystack. Installable as an app on desktop,
Android and iPhone (PWA).

## What's inside

- **Workspace**: nested pages, templates, slash menu (`/`), and the **working sheet** block.
- **Working sheet**: select, hand, pen, brush, eraser, shapes, text, crop, comments, colour picker with eyedropper,
  zoom and pan, full screen. Works with mouse, finger and stylus. Shortcuts: `V H P B E R T C M`.
- **News**: live film, motion, animation, design and photography stories from free publisher feeds. No API key.
- **Accounts and sync**: Supabase auth, pages sync across devices, row-level security on every table.
- **Billing**: Free, Pro and Business plans in naira and US dollars through Paystack subscriptions.
- **PWA**: install button on the home page, offline fallback, update prompt.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev -- -p 3100
```

Open http://localhost:3100. Without Supabase keys the app still works locally: pages are saved in your browser.

Production build (also how to test the installable app, since the service worker only runs in production):

```bash
npm run build
npx next start -p 3200
```

## Environment variables

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase, Project Settings, API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase, Project Settings, API |
| `NEXT_PUBLIC_SITE_URL` | Where the app is served (Paystack return link) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key. Server only. |
| `PAYSTACK_SECRET_KEY` | Paystack, Settings, API Keys. Use the test key first. |

Never commit `.env.local`.

## Billing setup

Prices live in `lib/pricing.ts` (USD). Naira prices are fixed amounts you choose from the current rate:

```bash
npm run billing:sync -- --rate 1550            # dry run: prints the price table
npm run billing:sync -- --rate 1550 --apply    # creates or updates the Paystack plans
```

Then point a Paystack webhook at `https://<your-domain>/api/paystack/webhook`. Existing subscribers keep the price
they signed up at.

## Sign-ups

Sign-ups are invite-only. Allowed emails live in a private database table; the lock is enforced by a trigger on
`auth.users`, so it can't be bypassed from the browser.

## Project layout

```
app/                    routes: dashboard, workspace, news, billing, API routes, manifest, offline page
components/workspace/   page editor and the working-sheet/ canvas
lib/                    data stores, sync, pricing, Supabase and Paystack helpers
public/sw.js            service worker (offline + caching)
scripts/                billing plan sync
```

## Roadmap

Team workspaces, publishable portfolio pages, an AI palette and shot-list helper, and App Store and Google Play
builds. Features marked "Soon" in the app are not built yet.
