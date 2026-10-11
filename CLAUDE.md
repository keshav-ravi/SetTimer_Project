# CLAUDE.md

## Product summary

SetTimer is a mobile-first web app for gym-goers. Users log sets (reps, weight) per exercise on a chosen date. Logging a set starts a 90-second rest timer that alerts at zero and then goes idle. It never restarts on its own. Full spec: `PRD.md` (source of truth).

## Scope rules (read first)

- The timer spike passed for iPhone and **P0 is complete**: the MVP is built and deployed (see "Current phase"). P1 and P2 items in `PRD.md` are off limits until I approve specific ones. P1 Req 7 (adjustable rest duration) is done; we choose the next backlog item together (see `PRD.md` Section 18).
- If a request is not in `PRD.md`, ask before building it.
- Do not add dependencies without telling me why.
- Non-goals: workout recommendations, calorie tracking, social features, native apps, auto-looping timers.

## Tech stack

- Next.js (App Router) with TypeScript
- Tailwind CSS
- Supabase (auth via username and password, Postgres). The username is mapped to an internal address behind the scenes; no real email is collected.
- Vercel for deployment
- PostHog for analytics
- Vitest for unit tests

## Commands

(Update these after scaffolding if they differ.)

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npm test`

## Current phase: MVP built; iterating

The timer spike (`PRD.md` Section 12) passed for iPhone as an installed PWA with a server-scheduled push, and every P0 requirement is built, deployed and tested: username and password sign-in, exercise picker and set logging (with Row Level Security), the rest timer with the locked-screen push, the install-to-home-screen flow, the date control and History, and delete account with a privacy note. Android is untested and deferred.

`PRD.md` Section 18 is the source of truth for what is done, the known gaps (including the tabled security items: sign-up behind a server action, a per-user limit on scheduling alerts, a strict script policy) and the backlog. Check it before proposing work.

Iterating: work in small vertical slices, one approved item at a time. Propose the files and approach, wait for my approval, then build, run lint, tests and build, and summarize in plain English. Update `PRD.md` (requirement, Section 18 and the change log) whenever behavior changes.

The spike's reusable pieces now live in the app: `src/lib/timer/` (pure rules and tests), `src/lib/push/` and `src/app/api/{schedule,cancel,send}` (server-scheduled push through Upstash QStash and Web Push), `src/lib/alerts.ts`, `src/lib/wakeLock.ts`, and `public/sw.js`. The spike-only UI (`TimerSpike.tsx`, `runLog.ts`, `spikeStorage.ts`) was retired in slice 3; it remains in git history.

Why a server push: iOS freezes a web app's JavaScript when the phone is locked or another app is open, so an in-page timer cannot alert on time. On iPhone, push only works in the installed home-screen app, which is why the install flow is P0.

## Timer rules (critical)

- State is `idle` or `running`.
- Store the **end timestamp**, never a decrementing counter. Compute remaining time from `endTime - Date.now()`.
- `Log set` while idle: state = running, end = now + the user's rest length (default 90 seconds).
- `Log set` while running: reset end = now + the user's rest length.
- End time reached: fire alert (sound, vibration, notification if permitted), set state = idle, do nothing else.
- Manual stop: state = idle.
- `DEFAULT_REST_SECONDS = 90` is defined in exactly one place. The user's chosen rest length (Req 7, 15 seconds to 10 minutes, saved per user) is passed into the pure timer rules as `logSet(now, durationSeconds)`; the rules never assume 90.
- Keep timer logic in a pure, testable module separate from UI components. Write unit tests for every rule above.
- Request notification permission only on a user action, never on page load.
- Use the Wake Lock API while the timer is running, and handle the case where it is unsupported.

## Data and privacy

- Every table with user data must have Row Level Security so users can read and write only their own rows.
- Never commit secrets. Use `.env.local` and keep `.env*` in `.gitignore`.
- Collect the minimum data needed: username, workouts, sets.
- Include a delete-account path before launch.

## Analytics events (PostHog)

Track these from the start: `sign_up`, `workout_started`, `set_logged`, `timer_started`, `timer_completed`, `timer_dismissed`, `timer_reset`. Do not send personal data in event properties beyond the user id.

## Workflow

1. For any non-trivial task, propose a plan first (files to touch, approach) and wait for my approval.
2. Build in **vertical slices**: one working end-to-end flow at a time (e.g., "log a set and see it in history"), not layer by layer.
3. Touch only the files needed for the current task.
4. After each change, run lint, tests, and the build. Tell me the results honestly, including failures.
5. After each working slice, summarize in plain English what changed and why, so I can explain it in an interview.
6. I commit to git after each working slice. Suggest a commit message.

## Code conventions

- TypeScript strict mode; no `any` unless justified in a comment.
- Small components, one responsibility each.
- Mobile-first layouts; primary actions reachable with one thumb; tap targets at least 44px.
- Prefer simple, readable code over clever code. I read Python and am less familiar with TypeScript, so add brief comments on non-obvious logic.
- Logging a set should take under 5 seconds: preselect the last-used exercise and sensible input defaults where it does not conflict with P0 scope.

## Definition of done (per slice)

- Works on a mobile viewport in the browser
- Lint, tests, and build pass
- Matches the relevant requirement number in `PRD.md`
- No out-of-scope features added
