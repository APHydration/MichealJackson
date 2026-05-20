# Weekly Creator Payout Portal

This project is a Next.js + TypeScript admin portal for subsidiary UGC campaigns where YouTube Shorts are the single source of truth for weekly creator payouts.

Creators may post on Instagram, TikTok, and YouTube, but payouts are calculated only from Shorts published on each creator's YouTube channel.

## What it does

- Uses Supabase Auth for admin login
- Stores creators, campaigns, synced YouTube videos, payout rows, and sync logs in Supabase
- Resolves channel URLs into stable YouTube channel IDs
- Syncs active creators automatically from YouTube Data API v3
- Detects Shorts by duration and counts videos under 60 seconds
- Recalculates weekly payouts after every sync
- Lets accounting export weekly CSVs and mark payouts as paid

## Pages

- `/login`
- `/dashboard`
- `/creators`
- `/campaigns`
- `/videos`
- `/weekly-payouts`
- `/settings`

## Tech stack

- Next.js App Router
- TypeScript
- Supabase database
- Supabase Auth
- YouTube Data API v3
- Cron-ready sync route

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
YOUTUBE_API_KEY=your_youtube_data_api_key
YOUTUBE_SYNC_LOOKBACK_DAYS=120
CRON_SECRET=replace-with-a-long-random-string
```

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run [`supabase/schema.sql`](/Users/aiden/Documents/New%20project%203/supabase/schema.sql).
4. In Supabase Auth, create the admin users who should access the portal.
5. Copy the project URL, anon key, and service role key into `.env.local`.

The schema includes:

- `campaigns`
- `creators`
- `videos`
- `weekly_payouts`
- `sync_runs`
- row level security policies for authenticated admins

## Local development

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000).
4. Sign in with a Supabase Auth admin account.

## YouTube sync flow

The app syncs all active creators by:

1. Resolving channel URL to channel ID when needed
2. Loading each creator's uploads playlist
3. Fetching recent video details and statistics
4. Marking videos under 60 seconds as Shorts
5. Upserting videos into Supabase
6. Rebuilding weekly payout rows for the rolling sync window

Manual sync:

- Use the `Sync Now` button in the dashboard or settings page

Programmatic sync:

- `POST /api/sync` for authenticated admins
- `GET` or `POST /api/cron/sync` with `Authorization: Bearer <CRON_SECRET>`

## Cron setup

This repo includes [`vercel.json`](/Users/aiden/Documents/New%20project%203/vercel.json) with a daily cron entry:

- `0 9 * * *` → `/api/cron/sync`

If you deploy somewhere other than Vercel, point any daily scheduler to:

```text
https://your-domain.com/api/cron/sync
```

and send:

```text
Authorization: Bearer your_cron_secret
```

## CSV export

Accounting can export the selected week from:

- Dashboard
- Weekly Payouts page

The export includes:

- Creator name
- YouTube channel
- Campaign
- Shorts posted
- Total views
- Rate per Short
- Total owed
- Payment status
- Paid date
- Notes

## Payout logic

- Only YouTube Shorts count
- A Short is any synced video with duration under 60 seconds
- Weekly payout = `shorts_count * rate_per_short`
- No approval workflow
- No creator submission flow
- Admins can mark payouts as `paid` or `unpaid`

## Deployment notes

- Deploy on Vercel or any platform that supports Next.js
- Add the environment variables from `.env.local`
- Make sure the cron job can call `/api/cron/sync`
- Create admin users in Supabase Auth before sharing access with accounting

## Recommended operating model

- Add campaigns first
- Add each creator once with a YouTube channel URL or direct channel ID
- Keep inactive creators in the system for history instead of deleting them unless you truly want to remove their data
- Prefer direct channel IDs or `@handle` URLs for the most reliable channel resolution

Deployment trigger
