# SetTimer

A mobile-first web app for gym-goers. Log a set, and a 90-second rest timer starts. When it hits zero it alerts you once and goes idle. It never restarts on its own.

The product spec is in [`PRD.md`](PRD.md) (source of truth). Working rules for contributors are in [`CLAUDE.md`](CLAUDE.md).

## Current status: timer feasibility spike

The product's wedge depends on the rest timer alerting reliably during a real workout, when the phone is often locked or another app is open. Before building anything else, we are running a throwaway spike (PRD Section 12) to answer:

> Can a web-based 90-second timer reliably alert the user when the screen is locked or the app is backgrounded?

**What exists today:** one page with a **Log set** button, a **Stop** button, a live countdown, and an on-screen run log. There are no accounts, database, calendar, styling or analytics yet. Those wait for the spike result.

### What we found

1. **The in-page timer alone is not enough on iPhone.** iOS freezes a home-screen web app's JavaScript when the phone locks or another app opens. The page cannot fire the alert at 90 seconds, so it only appeared once the user came back to the app.
2. **A server-sent Web Push fixes it.** Something outside the phone has to send the alert. After the change below, an informal test on an iPhone (installed home-screen app, 20-second test timer) delivered a notification in all three cases: app in foreground, another app open, and screen locked.
3. **Not yet done:** the official test matrix with the real 90-second timer (5 runs per cell), and Android testing (deferred, no device available).

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
| `src/lib/timer/timer.ts` | Pure timer rules: `logSet`, `stop`, `tick`, `getRemainingMs`, `REST_SECONDS` |
| `src/lib/runLog.ts` | Pure run-log helpers: alert delta, push delta, TSV export |
| `src/lib/alerts.ts` | Sound, vibration and notification (each feature-detected) |
| `src/lib/wakeLock.ts` | Screen Wake Lock, safe when unsupported |
| `src/lib/spikeStorage.ts` | Saves the log and running timer in `localStorage` |
| `src/lib/push/client.ts` | Browser side: subscribe to push, schedule/cancel, read push arrival time |
| `src/lib/push/validation.ts` | Checks requests; only known push-service hosts are accepted |
| `src/lib/push/qstash.ts` | Talks to QStash (delayed delivery) with plain `fetch` |
| `src/lib/push/qstashSignature.ts` | Verifies that `/api/send` calls really come from QStash |
| `src/app/api/{schedule,cancel,send}/route.ts` | The three server endpoints |
| `src/components/TimerSpike.tsx` | The spike page (UI only; rules live in `lib/`) |
| `public/sw.js` | Service worker: shows push notifications, records arrival time |
| `public/manifest.webmanifest`, `public/*.png` | PWA install files and placeholder icons |

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

`NEXT_PUBLIC_` values are fixed into the build, so changing that one needs a redeploy **without the build cache**. The others take effect on any new deployment.

## Deploying (Vercel)

1. Import this GitHub repo in Vercel (Next.js defaults, no config needed).
2. Add the environment variables above.
3. Every push to `main` redeploys automatically. After changing variables, redeploy manually.
4. On an iPhone, open the production URL in Safari, Share, **Add to Home Screen**, open from the icon, then tap **Enable notifications**. iOS only allows push in the installed app (iOS 16.4+).

## Running the official test matrix

Use the real 90-second timer. For each cell run 5 times and record whether the alert fired, the delay versus the 90s mark, which channels worked, and any duplicates. Use **Copy log** on the page to export the results (the log includes how late the page alert and the push were).

| Device and mode | Screen on, app foreground | Screen on, other app open | Screen locked |
|---|---|---|---|
| iPhone, Safari tab | | | |
| iPhone, installed PWA | | | |
| Android (deferred) | | | |

Pass bar (PRD Section 12): alert within 3 seconds of the 90s mark in at least 9 of 10 locked-screen runs.

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

See `git log` for the full detail, and `PRD.md` Section 17 for the spec change log.
