# SetTimer

A mobile-first web app for gym-goers. Log a set, and a 90-second rest timer starts. When it hits zero it alerts you once and goes idle. It never restarts on its own.

The product spec is in [`PRD.md`](PRD.md) (source of truth). Working rules for contributors are in [`CLAUDE.md`](CLAUDE.md).

## Current status: P0 build in progress (spike passed for iPhone)

The timer feasibility spike passed for iPhone (details below). P0 is being built in slices: sign-in (username and password through Supabase Auth), choosing an exercise and logging a set, the rest timer, and the install-to-home-screen flow are done. history by date, and a date control are done. delete account, and the privacy note are done. That completes P0. See `PRD.md` and the plan in `CLAUDE.md`.

## The timer feasibility spike

The product's wedge depends on the rest timer alerting reliably during a real workout, when the phone is often locked or another app is open. Before building anything else, we are running a throwaway spike (PRD Section 12) to answer:

> Can a web-based 90-second timer reliably alert the user when the screen is locked or the app is backgrounded?

**What exists today:** one page with a **Log set** button, a **Stop** button, a live countdown, and an on-screen run log. There are no accounts, database, calendar, styling or analytics yet. Those wait for the spike result.

### What we found

1. **The in-page timer alone is not enough on iPhone.** iOS freezes a home-screen web app's JavaScript when the phone locks or another app opens. The page cannot fire the alert at 90 seconds, so it only appeared once the user came back to the app.
2. **A server-sent Web Push fixes it.** Something outside the phone has to send the alert. After the change below, an informal test on an iPhone (installed home-screen app, 20-second test timer) delivered a notification in all three cases: app in foreground, another app open, and screen locked.
3. **Official 90-second results (iPhone installed app):** every cell passed. Push arrived 0.7 to 2.2 seconds after the end: foreground 5 of 5, home screen 5 of 5, another app open 5 of 5, **screen locked 10 of 10** within the 3-second bar. Edge cases (cellular, reset, stop, tapping the notification, permission denied) behaved correctly.
4. **iPhone Safari tab does not work:** notifications cannot be enabled outside the installed app, so on iPhone the app must be added to the home screen. The PRD recommends moving PWA install from P1 to P0 (pending owner approval).
5. **Not yet done:** Android testing (deferred, no device available), and some edge cases (Low Power Mode, a force-quit app left closed past the end time, back-to-back sets, reload mid-run). See PRD Section 12.

## How it works

```
Log set tapped
  ├─ timer.ts:   state = running, endTime = now + 90s        (pure logic, unit tested)
  ├─ page:       sound + vibration + notification at endTime  (works when the app is open)
  └─ server push (works when the phone is locked or the app is in the background):
        browser ──POST /api/schedule──▶ our server ──▶ QStash (holds the message until endTime)
                                                          │
        phone ◀── push service (Apple/Google) ◀── /api/send (verifies QStash's signature, sends the push)
        service worker shows the "Rest over" notification
Log set again / Stop ──POST /api/cancel──▶ QStash message deleted
```

Key design rules (from `CLAUDE.md`):
- The timer stores the **end timestamp**, never a decrementing counter, so it stays correct after tab throttling or screen lock.
- `REST_SECONDS = 90` lives in exactly one place (`src/lib/timer/timer.ts`).
- Timer rules are pure functions with unit tests, separate from the UI.
- Notification permission is requested only from a user tap, never on page load.
- The Wake Lock API keeps the screen on while the timer runs, and is skipped where unsupported.

## Project layout

| Path | What it does |
|---|---|
| `src/lib/timer/timer.ts` + tests | Pure timer rules: `logSet`, `stop`, `tick`, `getRemainingMs`, `REST_SECONDS` |
| `src/lib/timer/useRestTimer.ts` | Connects the rules to the clock, Wake Lock, alerts and the server push |
| `src/lib/timer/{format,storage,alertsStatus}.ts` + tests | Pure helpers: "1:30" display, saved-timer validation, alert-setup status |
| `src/lib/alerts.ts`, `src/lib/wakeLock.ts` | Sound/vibration/notification and screen Wake Lock (both feature-detected) |
| `src/lib/push/*` | Server-scheduled push: browser helpers, request checks, QStash client, signature check |
| `src/app/api/{schedule,cancel,send}/route.ts` | Schedule and cancel the push (sign-in required) and send it (QStash only) |
| `src/lib/sets/*` + tests | Pure rules for sets: validation, grouping, same-day defaults, steppers, date math and labels, history summaries; plus server queries |
| `src/app/sets/actions.ts` | Server actions: load today, log a set, delete the last set |
| `src/components/{LogScreen,RestTimer,DaySets,DatePicker}.tsx` | The logging screen, the timer bar, the chosen day's sets and the date control |
| `src/app/history/page.tsx`, `src/components/HistoryList.tsx` | The History page: past workouts newest first, 30 at a time, tapping one opens that day |
| `src/lib/install/*` + tests | Install flow logic: device detection (iPhone, installed or not) and which setup card to show; `useAlertsSetup` turns alerts on and sends a test alert |
| `src/components/{SetupFlow,InstallGuide}.tsx` | The setup card and the full-screen "Add to Home Screen" guide (Req 10) |
| `scripts/generate-icons.mjs` | Regenerates the app icons into `public/` (`node scripts/generate-icons.mjs`) |
| `src/lib/auth/username.ts` + tests | Username and password rules; maps a username to Supabase's internal address |
| `src/app/account/*`, `src/components/DeleteAccount.tsx` | The Account page and delete-account flow (password re-checked on the server) |
| `src/lib/account/*` + tests | Delete-request checks, and browser cleanup after deletion (unsubscribe push, clear saved data) |
| `src/lib/supabase/admin.ts` | Server-only admin connection (service-role key), used only by delete account |
| `src/app/privacy/page.tsx` | The plain-language privacy note (public) |
| `src/lib/supabase/*`, `src/proxy.ts`, `src/app/login/*` | Supabase connections, the sign-in guard, and the login screen |
| `src/lib/analytics.ts` | PostHog wrapper (user id only, no autocapture) |
| `supabase/migrations/0001_init.sql` | Tables and Row Level Security (run once in the Supabase SQL editor) |
| `src/app/api/keepalive/route.ts`, `vercel.json` | Daily ping so the free Supabase project does not pause |
| `public/sw.js` | Service worker: shows push notifications, records arrival time |
| `public/manifest.webmanifest`, `public/*.png` | PWA install files and the app icons (initial design; edit the script above to change it) |

## Run it locally

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run lint
npm run build
```

On `localhost` you can try the countdown, reset, stop, sound and notifications. **Push alerts do not work locally**, because QStash must reach a public URL. Test push on the deployed site.

## Environment variables

Copy `.env.example` to `.env.local` for local development, and add the same names in Vercel (Settings, Environment Variables, tick Production). Never commit real values.

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Generate a pair with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | The other half of that pair (keep secret) |
| `VAPID_SUBJECT` | A contact URL, for example this repo's URL |
| `QSTASH_TOKEN` | Upstash console, QStash tab |
| `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | Upstash console, QStash tab |
| `QSTASH_URL` | Only if Upstash shows a regional URL instead of the default |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase, Project Settings, API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase, Project Settings, API (server-only secret; used for delete-account later) |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | PostHog project settings (host defaults to `https://us.i.posthog.com`) |

`NEXT_PUBLIC_` values are fixed into the build, so changing that one needs a redeploy **without the build cache**. The others take effect on any new deployment.

## Deploying (Vercel)

1. Import this GitHub repo in Vercel (Next.js defaults, no config needed).
2. Add the environment variables above.
3. Every push to `main` redeploys automatically. After changing variables, redeploy manually.
4. On an iPhone, open the production URL in Safari. The app shows an install guide: Share, **Add to Home Screen**, then open it from the icon (you sign in once more there, because the installed app keeps its own login) and tap **Turn on rest alerts**. iOS only allows push in the installed app (iOS 16.4+). **Send a test alert** confirms it works.

## Running the official test matrix (results below)

Use the real 90-second timer. For each cell run 5 times and record whether the alert fired, the delay versus the 90s mark, which channels worked, and any duplicates. Use **Copy log** on the page to export the results (the log includes how late the page alert and the push were).

| Device and mode | Screen on, app foreground | Screen on, other app open | Screen locked |
|---|---|---|---|
| iPhone, Safari tab | Not supported (cannot enable notifications) | Not supported | Not supported |
| iPhone, installed PWA | 5 of 5 within 3s | 5 of 5 within 3s | 10 of 10 within 3s |
| Android (deferred) | not tested | not tested | not tested |

Pass bar (PRD Section 12): alert within 3 seconds of the 90s mark in at least 9 of 10 locked-screen runs. The table above shows the results so far (details in PRD Section 12).

## Known limitations

- Sound and vibration come from the page, so they only happen while the page is running. When the phone is locked, the system plays the notification's own sound. iOS Safari has no vibration API.
- A scheduled push can only be cancelled if the page still knows its ID. If you reload mid-countdown and then press Stop, a stale push may still arrive.
- Push delivery time depends on Apple's and Google's push services, which is exactly what the spike measures.
- Placeholder icons only.

## History of the work so far

1. **Scaffold and timer core:** Next.js app, Vitest, pure timer rules with a unit test for every rule.
2. **Run log:** records start, expected end, alert time and delay for each run.
3. **Spike UI:** Log set / Stop, alerts, Wake Lock, saved log, PWA manifest and service worker.
4. **Web Push:** server-scheduled push through QStash so alerts arrive when the phone is locked or the app is in the background.
5. **Debugging the push path:** surfaced the real reason when scheduling or signature checks failed, fixed a signature check that rejected padded hashes, and removed duplicate notifications.
6. **Test timer:** shortened temporarily for quick testing, then restored to 90 seconds.
7. **P0 slices:** sign-in, exercise picker and set logging with Row Level Security, and the rest timer inside the real flow. The spike page and its run log were retired (they remain in git history).
8. **Install flow (Req 10):** a guided "Add to Home Screen" screen for iPhone, a one-tap "Turn on rest alerts" step in the installed app, help when notifications are blocked or iOS is too old, a test-alert button, and real app icons.
9. **Date and history (Req 2, 6):** a date control on the logging screen (previous/next day and the native picker, no future dates), logging and deleting the last set on past days (the rest timer starts only for today), and a History page of past workouts.
10. **Delete account and privacy note:** an Account page where the user re-enters their password to permanently delete their account, workouts and sets (any pending rest alert is cancelled), a public privacy note, and an Account link next to Sign out.

See `git log` for the full detail, and `PRD.md` Section 17 for the spec change log.
