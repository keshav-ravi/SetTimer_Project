# CLAUDE.md

## Product summary

SetTimer is a mobile-first web app for gym-goers. Users log sets (reps, weight) per exercise on a chosen date. Logging a set starts a 90-second rest timer that alerts at zero and then goes idle. It never restarts on its own. Full spec: `PRD.md` (source of truth).

## Scope rules (read first)

- Complete the timer spike first (see "Current phase"). Then build **P0 only** unless I explicitly say otherwise. P1 and P2 items in `PRD.md` are off limits until I approve them.
- If a request is not in `PRD.md`, ask before building it.
- Do not add dependencies without telling me why.
- Non-goals: workout recommendations, calorie tracking, social features, native apps, auto-looping timers.

## Tech stack

- Next.js (App Router) with TypeScript
- Tailwind CSS
- Supabase (auth via magic link or Google, Postgres)
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

## Current phase: timer spike (do this first)

Until I say the spike is complete, build **only** the throwaway spike described in `PRD.md` Section 12:

- One page, one "Log set" button, the timer rules below, and a visible state/remaining-time display.
- No auth, database, calendar, styling, or analytics.
- Add a simple on-screen run log (timestamp started, timestamp alert fired, delta in seconds) so I can fill in the test matrix.
- Alert via sound, vibration, and notification where supported; Wake Lock while running.
- Add a PWA manifest and service worker only if I ask, so I can test browser tab vs. installed PWA.
- Keep the timer logic in a separate pure module so it can be reused if the spike passes.
- Do not start any P0 feature until I report the spike result and we update `PRD.md`.

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
- Collect the minimum data needed: email, workouts, sets.
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
