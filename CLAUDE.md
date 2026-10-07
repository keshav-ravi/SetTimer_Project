# CLAUDE.md

## Product summary

SetTimer is a mobile-first web app for gym-goers. Users log sets (reps, weight) per exercise on a chosen date. Logging a set starts a 90-second rest timer that alerts at zero and then goes idle. It never restarts on its own. Full spec: `PRD.md` (source of truth).

## Scope rules (read first)

- The timer spike is complete and passed for iPhone (see "Current phase"). Build **P0 only** unless I explicitly say otherwise. P1 and P2 items in `PRD.md` are off limits until I approve them.
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

## Current phase: P0 build

The timer spike (`PRD.md` Section 12) passed for iPhone as an installed PWA with a server-scheduled push. Android is untested and is not a P0 gate. P0 is built as vertical slices, in the order agreed in the plan:

0. Housekeeping (Tailwind, `.gitignore`, this file)
1. Username and password sign-in (Supabase Auth) and PostHog
2. Choose an exercise and log a set (with Row Level Security)
3. The rest timer inside the real flow, including the server-scheduled push
4. Install-to-home-screen flow and notification setup (Req 10)
5. History by date
6. Delete account and privacy note

Build one slice at a time. Propose the slice's files and approach, wait for my approval, then build, run lint, tests and build, and summarize in plain English.

What carries over from the spike: `src/lib/timer/` (pure rules and tests), `src/lib/push/` and `src/app/api/{schedule,cancel,send}` (server-scheduled push through Upstash QStash and Web Push), `src/lib/alerts.ts`, `src/lib/wakeLock.ts`, and `public/sw.js`. The spike-only UI (`TimerSpike.tsx`, `runLog.ts`, `spikeStorage.ts`) is retired in slice 3.

Why a server push: iOS freezes a web app's JavaScript when the phone is locked or another app is open, so an in-page timer cannot alert on time. On iPhone, push only works in the installed home-screen app, which is why the install flow is P0.

## Timer rules (critical)

- State is `idle` or `running`.
- Store the **end timestamp**, never a decrementing counter. Compute remaining time from `endTime - Date.now()`.
- `Log set` while idle: state = running, end = now + REST_SECONDS.
- `Log set` while running: reset end = now + REST_SECONDS.
- End time reached: fire alert (sound, vibration, notification if permitted), set state = idle, do nothing else.
- Manual stop: state = idle.
- `REST_SECONDS = 90` is defined in exactly one place. The P1 adjustable-duration feature will replace this single value.
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
