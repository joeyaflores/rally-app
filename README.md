# Rally

The operating system for communities that show up.

Rally is a single-tenant community operations platform for IRL groups — run clubs, volunteer orgs, book clubs, meetups, youth sports, or any community that gathers in person and needs to organize, grow, and prove impact.

## What It Does

- **Dashboard** — hero stats, growth tracking, content planning, pinned notes, all in one view
- **Social analytics** — automated Instagram + TikTok scraping via Apify, Strava manual entry, MoM trends
- **Check-in system** — branded event check-in with QR codes, attendance tracking, new vs returning members
- **Event reports** — auto-generated proof-of-impact reports with attendance, social reach, and post engagement — shareable with sponsors via a single link
- **Content calendar** — multi-platform planning, drag-to-reschedule, creator assignment
- **Boards** — visual moodboarding and campaign planning
- **Partner directory** — CRM for sponsors, venues, and collaborations
- **Notes & tasks** — quick-add with due dates and pinned previews
- **Public landing page** — `/join` page with schedule, email capture, and social links
- **Member management** — merged view of check-in attendees and email subscribers, CSV export

## Stack

- **Next.js 16** (App Router, React 19)
- **SQLite** (better-sqlite3)
- **shadcn/ui** + **Tailwind CSS 4**
- **Better Auth** (Google OAuth + email allowlist)
- **Apify** (Instagram + TikTok scraping)
- **Sentry** (error tracking)
- **Recharts** (data visualization)
- **Bun** (package manager)

## Getting Started

```bash
# 1. Install dependencies
bun install

# 2. Create your environment file
cp .env.example .env.local
# Fill in your credentials (see below)

# 3. Configure your community
# Edit rally.config.ts — this is the only file you need to change
# to make the app yours.

# 4. Replace brand assets
# Drop your logo into public/logo-icon.svg, public/logo-full.svg, public/favicon.svg
# Drop your hero images into public/ (referenced in rally.config.ts)

# 5. Update theme colors in src/app/globals.css
# Match the values in rally.config.ts → theme

# 6. Run
bunx next dev
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
BETTER_AUTH_SECRET=          # generate: openssl rand -base64 32
BETTER_AUTH_URL=             # http://localhost:3000 for dev
ALLOWED_EMAILS=              # comma-separated Google accounts with dashboard access

GOOGLE_CLIENT_ID=            # Google OAuth (console.cloud.google.com)
GOOGLE_CLIENT_SECRET=

APIFY_TOKEN=                 # apify.com — for social media scraping (optional)

SENTRY_DSN=                  # sentry.io — for error tracking (optional)
NEXT_PUBLIC_SENTRY_DSN=
```

## Configuration

Everything brand-specific lives in **`rally.config.ts`** at the project root. This single file controls:

| Section | What it configures |
|---------|-------------------|
| Identity | Name, tagline, location, email |
| Terminology | How you refer to members and community ("neighbors", "the crew", etc.) |
| Team | Founders and content creators |
| Events | Your recurring meetup schedule |
| Socials | Instagram, TikTok, Strava handles and URLs |
| Theme | Primary and accent colors |
| Page copy | Join page text, check-in messages, error messages |

After editing the config, the only manual steps are:
1. Replace logo/hero image files in `public/`
2. Update CSS custom properties in `src/app/globals.css` to match your theme colors
3. Update fonts in `src/fonts/` and `src/app/layout.tsx` if desired

## Deployment

Designed for **Fly.io** (config in `fly.toml`), but works anywhere that runs Node.js.

```bash
fly launch    # first time
fly deploy    # subsequent deploys
```

Set your `NEXT_PUBLIC_URL` env var to your production URL.

## Architecture

```
rally.config.ts          ← single source of truth for brand/config
src/
  app/                   ← Next.js App Router pages
    join/                ← public landing page
    checkin/             ← public check-in + live dashboard
    report/[token]/      ← public shareable event reports
    calendar/            ← content calendar
    analytics/           ← social analytics dashboard
    admin/               ← data entry + report builder
    partners/            ← member + partner management
    notes/               ← notes and tasks
    boards/              ← moodboards and campaigns
  components/            ← React components
  lib/                   ← data layer, auth, server actions
    data.ts              ← reads from rally.config.ts
    socials.ts           ← reads from rally.config.ts
    apify.ts             ← social media scraping
    db.ts                ← SQLite schema and migrations
    auth.ts              ← Better Auth configuration
```

## License

MIT
