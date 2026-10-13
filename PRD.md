# PRD: SetTimer (working name)

**Author:** [Your name] | **Status:** v18, P0 MVP built and deployed; iterating | **Last updated:** Oct 11, 2026
**Target:** MVP live in ~6 weeks at 5 hrs/week | **Platform:** Mobile-first web app (PWA)

**Where things stand:** The timer spike passed for iPhone, and every P0 requirement is built, deployed and covered by automated tests. The product is now an MVP that will be iterated on. See Section 18 for what is done, what is known to be missing, and the backlog.

---

## 1. Overview

SetTimer is a mobile-first web app for gym-goers that combines workout logging and rest timing in one flow. Logging a set immediately starts a 90-second rest timer. When the timer ends it alerts the user and goes idle. It starts again only when the next set is logged. Users never need to leave the app mid-workout.

## 2. Problem

Frequent lifters (3-4 sessions/week) log workouts on paper or in notes, then switch to the Clock app to time rests. Each switch costs attention, interrupts logging, and leads to skipped logs or inconsistent rest periods.

*Assumption to validate:* roughly 15-20 timer switches per session (4-6 exercises x 3-4 sets).

## 3. Target Users

**Primary:** Intermediate lifters, ages 18-30, training 3+ days/week on a loose routine, who care about progressive overload and want a simple, free tool.

**Not designed for:** Beginners seeking guidance; athletes working with coaches or structured programs.

## 4. Competitive Landscape and Wedge

| Alternative | Strength | Gap |
|---|---|---|
| Hevy / Strong / JEFIT | Full-featured logging, timers | Feature-heavy; some features paywalled; timer often started manually |
| Notes app / paper | Zero friction to start | No timer, no history analysis |
| Native Clock app | Reliable alarms | No logging; forces app switching |

**Wedge:** The rest timer is triggered by the act of logging a set. No separate timer interaction, no app switching, minimal UI, no paywall.

## 5. Goals

- A user can log a full session without leaving the app.
- A user can review past workouts by date.
- Logging one set takes under 5 seconds.

## 6. Non-Goals

- Workout programming or "what should I do today" recommendations.
- Calorie or health-metric tracking.
- Social features, feeds, or sharing.
- Native iOS/Android apps.
- Auto-looping or continuous timers. The timer never starts without a set being logged.

## 7. Success Metrics

| Type | Metric | Target (initial guess) |
|---|---|---|
| North Star | Workouts logged per active user per week | >= 2 |
| Primary | % of timers that run to completion (vs. dismissed or reset) | >= 60% |
| Retention | Week-4 retention among first 10-15 users | >= 40% |
| Guardrail | Median time to log one set | < 5 sec |
| Guardrail | User-reported missed alarms | < 10% of sessions |

Supporting signals: sets logged per session; timer dismiss rate; timer reset rate (set logged while timer running). High dismiss or reset rates suggest 90s is a poor fit.

## 8. Requirements

### P0 (must ship)

1. **Auth:** Sign up and log in with a username and password only. No email, magic link, or social login. Passwords are never stored in plain text; the auth system keeps only a salted hash. *(Changed in v10 from email magic link or Google.)* **P0 limitation:** with no email there is no password reset, so a forgotten password means the account cannot be recovered. Recovery is a candidate for P1.
2. **Calendar:** Select the workout date. Defaults to today. *(v13)* A date control on the logging screen (previous and next day buttons, plus the phone's native date picker). Future dates are not allowed. Sets can be logged, and the last set deleted, for any past date.
3. **Exercise selection:** Choose from a preset exercise list.
4. **Set logging:** Record reps and weight per set, per exercise.
5. **Rest timer (90 seconds by default; adjustable, Req 7):**
   - 5a. Logging a set starts the timer immediately. *(v13)* Only when the set is logged for today: logging a set for a past date does not start or reset the timer.
   - 5b. At zero, the timer alerts the user (sound, vibration, notification where supported) and returns to idle.
   - 5c. The timer does not restart on its own. It starts again only when the next set is logged.
   - 5d. If a set is logged while the timer is running, the timer resets to the chosen rest length (90 seconds unless the user changed it). No stacked timers.
   - 5e. The user can stop or dismiss the timer at any point.
   - 5f. *(Added v9, from the spike.)* The alert must reach the user while the phone is locked or another app is open. On iPhone this requires a server-scheduled Web Push to the installed app: logging a set schedules the push, and reset or stop cancels it. The page's own alert covers the foreground. See Section 12.
6. **History:** View past workouts by date. *(v13)* A History page lists past workouts, newest first (the latest 30, with a Show more button), each with its exercises and set count; tapping a day opens it on the logging screen.
9a. **Delete the last set** *(minimal part of Req 9, pulled into P0 in v11)*. A logged set cannot otherwise be corrected in P0, so the user can delete their most recent set from today's list. General editing and deleting of any set stays P1 (Req 9). Deleting a set does not start, stop or reset the timer.
10. **Install-to-home-screen (PWA) flow.** *(Moved from P1 to P0 in v9 because of the spike: on iPhone, alerts only work in the installed app.)* Guide iPhone users through "Add to Home Screen" before the timer is relied on, ask for notification permission from inside the installed app on a user tap, and explain clearly when notifications are blocked. Number kept as 10 so references stay valid. *(v12)* The flow includes a guided install screen shown once after sign-in on iPhone Safari (dismissible, with a card that stays until the app is installed), a one-tap "Turn on rest alerts" step inside the installed app, plain-language help when notifications are blocked or iOS is too old (16.4 or later is needed), and a "Send test alert" button that sends a notification about 5 seconds later so users can confirm setup works before their first workout.

### P1

7. **Adjustable rest duration:** User-selected value, persisted per user, applied to the next timer start. **Done (v16).** A "Rest: 1:30" button in the timer bar opens a panel with presets (1:00, 1:30, 2:00, 2:30, 3:00) and -/+ 15 second buttons, from 15 seconds to 10 minutes. It is saved to the user's account (with a copy on the device, so it works offline) and applies from the next start or reset; a running timer is never changed. Default 90 seconds.
8. **Custom exercises:** Add a new exercise type. *(v18)* Each user's own exercises are private to them; other users never see them. The 34 built-in exercises are the shared list and cannot be changed from the app. Users can rename (not delete) their own exercises. **Done (v18).** The exercise picker has a "+ Add new exercise" row (and a no-match search offers Add "what you typed"); a small form takes the name (1 to 40 characters; letters, numbers, spaces and - ' ( ) & . , /); typing a name that already exists, a built-in one or your own, just selects that exercise. Your exercises appear under "My exercises" with a Rename button, and a rename updates the names on logged sets. Up to 50 per user; they work in the logging form, the Edit set panel and History; they are removed when the account is deleted.
9. **Edit/delete logged sets** (any set, and editing values). The delete-last-set part is P0 (Req 9a). **Done (v17).** Tapping a set row opens an Edit set panel: change the exercise, weight or reps, or delete the set (confirmed inside the panel). Save is only offered when something changed, set numbering stays stable (by time logged), it works on any day, and it never touches the rest timer. Deleting a day's last set also removes the empty workout from History.
13. **Exercise search:** a search box in the exercise picker. P0 uses a plain dropdown of the preset list. *(Added v11.)* **Done (v18).** The Exercise field is a button that opens a full-screen "Choose exercise" panel with a search box that is ready to type in. Matching ignores capitals, accents and punctuation ("chin up" and "chinup" find Chin-Up), every typed word must match, and names that start with the search come first. Enter picks the best match. The same picker is used on the logging screen and in the Edit set panel; Escape closes only the top panel.

### P2

11. **Prefill from last session,** then a rule-based next-weight suggestion based on the user's own history (e.g., +5 lb if all target reps were hit). No ML required. This is not workout programming.

## 9. User Stories

- As a lifter, I want my rest timer to start when I log a set so I don't touch my clock app.
- As a lifter, I want the timer to stop after it alerts me so it never runs without my input.
- As a lifter, I want my workouts saved to my account so I don't lose my history.
- As a lifter, I want to pick a date and see what I did on it.
- As an iPhone lifter, I want clear steps to add the app to my home screen and turn on notifications, so the rest alert still reaches me when my phone is locked.
- As a lifter, I want to change my rest duration because heavy compound lifts need more than 90 seconds. *(Req 7, done)*
- *(P2)* As a lifter, I want to see what I lifted last time so I know what to attempt today.

## 10. Core Flow

First visit on iPhone: sign in -> install prompt (Add to Home Screen) -> open the installed app -> turn on notifications. Then, every session: open app -> today's date preselected -> pick exercise -> enter weight and reps -> tap "Log set" -> 90-second timer starts -> alarm fires and timer goes idle -> perform next set -> log it -> timer starts again.

**Aha moment:** the second set, when the timer started from the log tap alone.

## 11. Timer Specification

| Event | Result |
|---|---|
| Log set (idle) | State = running; end time = now + the user's rest length (default 90s) |
| Log set (running) | End time reset to now + the user's rest length |
| End time reached | Alert fires; state = idle; no further action |
| Manual stop | State = idle |

Implementation note: store the end timestamp, not a decrementing counter, so the timer survives tab throttling and screen lock. The default (90 seconds) lives in one constant; the user's chosen length (Req 7) is passed into the timer rules.

## 12. Timer Feasibility Spike (Week 1, gating)

**Status: complete. Passed for iPhone (installed PWA with server-scheduled push) on Oct 6, 2026. Android untested.**

**Why:** The product's wedge depends on the rest timer alerting reliably during a real workout, when the phone is often locked or another app is in the foreground. Web apps are throttled in the background, and iOS web push requires home-screen install (iOS 16.4+). This is the riskiest technical assumption in the PRD, so it is tested before any other feature is built.

**Question:** Can a web-based 90-second timer reliably alert the user when the screen is locked or the app is backgrounded?

**Scope (throwaway build):** One page with a "Log set" button that implements the Timer Specification (Section 11) using an end timestamp. Alert = sound, vibration, and notification where supported. Wake Lock enabled while running. No auth, database, calendar, or styling. Optional: PWA manifest to test the installed case.

**Time-box:** 5 hours (one week at planned pace). If the spike is not resolved in that time, treat it as a fail and escalate to the decision below.

**Test matrix** (run each cell 5 times with a real 90s timer):

| Device and mode | Screen on, app foreground | Screen on, other app open | Screen locked |
|---|---|---|---|
| iPhone, Safari tab | | | |
| iPhone, installed PWA | | | |
| Android, Chrome tab | | | |
| Android, installed PWA | | | |

Record per run: alert fired (Y/N), delay vs. expected time (seconds), which channels worked (sound / vibration / notification), and notes.

**Pass criteria** (initial thresholds, adjust after seeing results):
- Alert fires within 3 seconds of the 90s mark in at least 9 of 10 runs for the locked-screen case in the target mode.
- At least one channel (sound, vibration, or notification) is perceptible with the phone in a pocket or on a bench.
- On timer end the app returns to idle and does not restart.

**Decision rules:**

| Result | Action |
|---|---|
| Passes in browser tab and installed PWA on both platforms | Keep P1 PWA install as P1; proceed to build P0 |
| Passes only as installed PWA | Move PWA install flow (Req 10) from P1 to P0; add an install prompt to the core flow |
| Passes on Android but not iOS | Decide on launch platform focus (recruit Android users first) or evaluate a native wrapper; update Non-goals if native becomes necessary |
| Fails on both | Pause the build; reassess the alert mechanism (e.g., native wrapper, or in-app-only timer with a reduced wedge) and revise this PRD |

**Out of scope for the spike:** accounts, data storage, UI polish, analytics.

**Scope amendment (v4):** The first test round showed the in-page alert fails when the screen is locked or another app is open (see below). To test the only known fix, the spike now also includes a minimal server component: a scheduled Web Push (QStash delays a call to our `/api/send` route, which sends the push). It stores no user data and has no accounts or database. This is still throwaway spike scope. Whether it carries into P0 depends on the result.

### Spike progress (as of Oct 6, 2026)

**Round 1: in-page alert only, iPhone installed PWA** (few runs per cell; the target is 5):

| Screen state | Result |
|---|---|
| Screen on, app in foreground | Alert on time (0s lag) |
| Screen on, other app open | Notification appeared only after returning to the app. (Two early runs seemed to alert on time or 3.2s late, but a later retest showed the alert only appeared after re-entering the app; treat this cell as failing.) |
| Screen locked | Alert did not appear until the phone was unlocked and the app reopened |

**Diagnosis:** iOS freezes a home-screen web app's JavaScript when the phone locks or the user leaves the app. The in-page timer cannot fire, so the alert runs late, when the user comes back. The service worker cannot fix this either: it has no reliable timer, and scheduled notifications are not supported on iOS. Something outside the phone must send the alert at the end time.

**Fix under test (Round 2):** Server-scheduled Web Push. At "Log set" the app asks the server to push at `endTime`; reset or stop cancels it; at `endTime` the server sends the push, which wakes the service worker to show the notification. The run log records when the push actually arrived. Pass criteria are unchanged (within 3 seconds in 9 of 10 locked-screen runs).

**Android:** Testing is deferred (no Android device available; owner decision, Oct 6, 2026). Until Android is tested, the decision rules are applied to iPhone results only, and Android is treated as P1/P2 verification.

**Round 2 results (informal, Oct 6, 2026):** iPhone installed PWA, with the server-scheduled push and a temporary 20-second test timer. A notification was delivered in all three cases: app in foreground, another app open, and screen locked. The first version showed duplicate notifications (the page and the push both alerted); this was fixed by letting the push show the notification when one is scheduled, and a later retest of all three cases passed with no duplicates. Along the way, debugging found and fixed a signature check that could reject real QStash requests.

**Round 3: official timer (90s), iPhone (Oct 6, 2026).** Delay is measured from the push arrival time recorded by the service worker. All runs below were on Wi-Fi unless noted.

**Installed PWA matrix**

| Screen state | Runs | Push delay after end | Within 3s | Duplicates |
|---|---|---|---|---|
| Screen on, app foreground | 5 | 0.7s to 2.1s | 5 of 5 | none |
| Screen on, home screen (app backgrounded) | 5 | 0.8s to 2.0s | 5 of 5 | none |
| Screen on, other app open | 5 | 1.0s to 2.0s | 5 of 5 | none |
| **Screen locked (side button)** | **10** | **0.7s to 2.2s (mean about 1.0s)** | **10 of 10** | none |

**Safari tab (not installed):** Failed as expected. The user could not enable notifications, and tapping Log set produced no notification. iOS only allows web push for an installed home-screen app.

**Locked-screen conditions tested:** locked immediately after Log set (4 runs), and locked with about 60s, 45s and 30s remaining (2 or 3 runs each).

**Channels perceived:** a banner and the phone's haptic vibration in every installed-PWA run, including with the phone on silent. Sound was heard only when the phone was not on silent (2 runs). The web Vibration API does not exist on iOS; the haptic comes from the system with the notification.

**Edge cases (iPhone installed PWA):**

| Case | Result |
|---|---|
| Cellular instead of Wi-Fi | Pass. Push arrived 1.5s after end (banner, haptic, sound), no duplicate. |
| Reset (Log set again while running) | Pass. Exactly one notification. |
| Stop before the end | Pass. No notification. |
| Tap the notification | Pass. Opens the app, state idle, log line present. |
| App force-quit (swiped away) | Partial. On reopening, the timer was still running and finished, and the push arrived. The run does not show whether a push is delivered while the app is fully quit, because the app was reopened before the end. To retest. |
| Notification permission denied in iOS Settings | Behaves acceptably. No banner. Sound still played with the app in the foreground. The page shows "Notifications: denied" but the Push line still says "push scheduled", which is misleading; the server schedules a push the phone then cannot show. |

**Not yet tested:** Low Power Mode, charging state, a long idle period before a run, back-to-back sets, several sets while locked, reload mid-run followed by Stop (known limitation: a stale push may still arrive), and a force-quit app left closed until after the end time. Android is deferred.

**Pass criteria check (locked screen, iPhone installed PWA):**
- Alert within 3 seconds in at least 9 of 10 runs: **met (10 of 10).**
- At least one channel perceptible with the phone on a bench or in a pocket: **met** (haptic and banner, even on silent).
- Returns to idle and does not restart: **met** (unit tests, a browser check, and the tap-notification test showing state idle).

**Decision (owner, Oct 6, 2026): the spike PASSES for iPhone.** The installed home-screen app, with a server-scheduled Web Push, met every pass criterion, and the Safari tab does not work. The decision rule "Passes only as installed PWA" applies on iPhone, so:
- **PWA install (Req 10) moves from P1 to P0**, and an install step is added to the core flow (Section 10).
- **Server-scheduled push (Req 5f) is part of the P0 timer.** It uses Upstash QStash plus Web Push, as built in the spike.
- Build of P0 may start, with the spike's timer logic and push code as the starting point.

**Not covered by this decision:** Android is untested, so the "both platforms" rows are not evaluated. Android is treated as a later check, not a P0 gate. Edge cases still to retest: a force-quit app left closed past the end time, Low Power Mode, back-to-back sets, and reload mid-run followed by Stop.

**Deliverable:** A completed test matrix and a short write-up (what was tested, what happened, the decision taken). This feeds the learnings doc.

## 13. Technical Considerations

- **Stack:** Next.js, Supabase (auth and Postgres), Vercel, PostHog for analytics.
- **PWA:** manifest and service worker for home-screen install. Required (P0) on iPhone, where push alerts only work in the installed app.
- **Timer reliability:** Web apps are throttled in the background, and iOS web push requires home-screen install (iOS 16.4+). Use end-timestamp logic, the Wake Lock API while the timer runs, and test on a real iPhone in week 1.
- **Locked-screen alerts (spike finding):** The page's own JavaScript is frozen when an iPhone is locked, so alerts at the end time must come from a server-sent Web Push. Current design: the app subscribes to push (VAPID keys), the server schedules a delayed call through Upstash QStash, and `/api/send` (signature-verified) sends the push with the `web-push` library. Required environment variables: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` (see `.env.example`). The push subscription is held only inside the scheduled message, not stored by us. Delivery time depends on Apple's push service and is what the spike measures.
- **Privacy:** Supabase Row Level Security so users only access their own rows; collect minimum data; include delete-account and a plain-language privacy note. *(v14)* Delete account is on an Account page: the user re-enters their password, then their user, workouts and sets are deleted and any scheduled rest-timer push is cancelled. The privacy note is a public page with no contact line for now. PostHog events carry only a random user id; deleting them from PostHog is not automated in P0, and the privacy note says so.

## 14. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Timer unreliable when screen is locked or app is backgrounded | Timestamp-based timer, Wake Lock, PWA install, gating week-1 spike with explicit pass criteria and decision rules (Section 12). Spike showed the in-page alert fails on locked iPhone; server-scheduled Web Push fixed it (10 of 10 locked-screen runs within 3 seconds). |
| iPhone users who skip the home-screen install get no alerts | P0 install flow (Req 10): prompt after sign-in, clear steps, and a visible warning when notifications are off |
| Server-sent push adds infrastructure and a third-party service (Upstash QStash) | Keep it minimal and stateless; no user data stored; verify request signatures; accept only known push-service hosts |
| Privacy of workout and account data | RLS, minimal data, delete-account, privacy note |
| Low retention | Track W4 retention; interview drop-offs; prefill (P2) |
| Weak differentiation vs. Hevy/Strong | Measure wedge metrics; write direct comparison in learnings doc |
| Fixed 90s does not fit all lifts | Ship P1 duration control early; monitor dismiss/reset rates |
| Users forget to log, so timer never starts | Track sets logged vs. timer starts per session |
| Scope creep at 5 hrs/week | P0 only until live. P0 is now live, so each P1/P2 item needs explicit approval before it is built. |
| Anyone can create accounts directly against the auth service, bypassing the app's username rules and rate limits (security review finding, tabled) | Move sign-up behind a server action with rate limiting; confirm Supabase rate limits are on. Fine for friends-and-family testing; revisit before wider launch. |
| No password recovery, so a forgotten password loses the account | Stated in the sign-up screen and privacy note; add a recovery option (for example a recovery code) when users ask for it |
| No limit on how many rest alerts one user can schedule, so one account could use up the free push quota | Add a per-user limit; low risk with a small invited group |

## 15. Launch and Learning Plan

| When | Activity |
|---|---|
| Week 1 | **Timer feasibility spike** (Section 12) on real iPhone and Android devices; decision logged before any other build work. **Done for iPhone (passed); Android deferred.** |
| Weeks 1-2 | 5 user interviews with gym-going friends (in parallel with spike) |
| Weeks 2-6 | Build P0 in vertical slices, starting from the spike's timer logic if it passed; commit after each working slice. **Done (Oct 11, 2026): all P0 requirements built, deployed and tested.** |
| Week 6 | Launch to 10-15 gym users (friends, campus gym, club groups). **Next.** Before inviting people: an iPhone launch pass and the dashboard checks in Section 18. The tabled security items can follow. |
| Weeks 7-10 | Observe usage; ship P1 duration control; interview 5 users |
| Week 10 | Decision checkpoint |

**Decision rules at week 10:**
- **Double down** if W4 retention >= 40% and timer completion >= 60%.
- **Pivot** to a narrower wedge if logging is used but the timer is not.
- **Stop** if neither is true.

## 16. Open Questions

- Is 90s acceptable as the default, and which rest lengths do users actually pick? (Req 7 is built; `timer_started` and `timer_reset` events carry `rest_seconds` to answer this.)
- Does the log-triggered timer reduce app-switching, or do users still open the Clock app out of habit?
- Is locked-screen alarm reliability on iOS good enough to ship as P0? **Answered (Oct 6, 2026): yes, but only as an installed PWA with server-scheduled push.** The in-page alert alone fails when the phone is locked or another app is open. With the push, 10 of 10 locked-screen runs arrived within 3 seconds (0.7 to 2.2s), and the Safari tab does not work. Android is untested.
- If server-sent push is required, is the added infrastructure acceptable for P0, and is QStash the right long-term scheduler?
- ~~Should the exercise preset list be organized by muscle group or alphabetical?~~ **Answered (v15):** alphabetical in P0, with a plain dropdown; search is P1 (Req 13). Revisit if users find the list hard to scan.
- Is the invite-only audience small enough that open sign-up (Section 18, tabled) is acceptable, or should it be closed before the first users arrive?
- Is iPhone-first enough for launch, or are there Android users who need the app early? (Android is untested.)

## 17. Change Log

- **v18:** P1 Req 13 (exercise search) and P1 Req 8 (custom exercises) built and verified. Owner decisions for both: Req 13: the exercise dropdown becomes a button that opens a full-screen search panel (matching ignores capitals and punctuation, all words must match, names that start with the search come first); the same picker is used on the logging screen and in the Edit set panel; Escape closes only the top panel. Also shipped with it: the idle timer clock no longer redraws the screen when no timer is running (measured: 12 redraws in 3 seconds when idle before, 0 after; a running timer still redraws about 4 times a second so the countdown stays smooth). Req 8: users can add their own exercises from the picker (private to the user who adds them, so no other user ever sees them and nobody can pollute anybody else's list; the 34 built-in exercises stay the shared list, curated by the owner, who can also see what users add through the database, 1-40 characters, no duplicates of presets or their own, at most 50), and rename them (typo fixes); delete is not included. `exercise_created` is tracked without the name. Migration 0003 adds an owner column to `exercises`, replaces the global unique name with per-owner uniqueness, adds a trigger (no copying a preset's name, 50 per user), splits Row Level Security so users see presets plus their own, allows renaming only the name, and stops a set from using an exercise its owner cannot see. A security test with 25 new attack cases passes (67 of 67) and existing data was unchanged. Typing a name that already exists selects that exercise instead of failing. No database changes in Req 13.
- **v17:** P1 Req 9 (edit and delete any logged set) built and verified. Owner decisions: tapping a set row opens an Edit set panel where the exercise, weight and reps can be changed or the set deleted; Save stays disabled until something changes; delete is confirmed inline; the one-tap Delete last set button stays as the fastest undo; edits and deletes never touch the rest timer; two new events, `set_edited` and `set_deleted`, are tracked (user id only, no values). No database changes: the existing Row Level Security already allowed users to update and delete only their own sets. Sections 8, 18 and the backlog updated.
- **v16:** P1 Req 7 (adjustable rest duration) built and verified. Owner decisions: the control lives in the timer bar on the logging screen; presets are 1:00, 1:30, 2:00, 2:30 and 3:00 plus a +/- 15 second control (range 15 seconds to 10 minutes); the value is saved per user in the database (new `user_settings` table with Row Level Security, plus a copy on the device so it works offline); a running timer is never changed, the new length applies to the next start or reset; `timer_started` and `timer_reset` events carry a `rest_seconds` number. 90 seconds remains the default. The push scheduling window grew from 10 to 15 minutes so a 10-minute rest is never rejected over a small clock difference. Section 5, 11, 16 and 18 updated.
- **v15:** Status update. The timer spike passed for iPhone and all P0 requirements are built, deployed and tested; the product is now an MVP that will be iterated on. Added Section 18 (build status, quality and security notes, known gaps and backlog); marked the spike section complete; updated the launch plan, risks and open questions (exercise list order answered; open sign-up and Android launch scope added). No requirements changed.
- **v14:** Owner decisions for P0 slice 6 (delete account and privacy note): deleting an account requires re-entering the password; PostHog data is disclosed in the privacy note rather than deleted automatically; the privacy note shows no contact line for now (deletion is self-service in the app); the Account link sits next to Sign out.
- **v13:** Owner decisions for P0 slice 5 (date and history, Req 2 and 6): the rest timer starts only for today's sets (an exception to 5a), future dates are blocked, the logging screen gets a date control and there is a History page listing the latest 30 workouts with Show more. Past dates can be logged to and the last set deleted.
- **v12:** Owner decisions for P0 slice 4 (install flow, Req 10): auto-open the install guide once after sign-in on iPhone Safari; add a "Send test alert" button so users can verify alerts before relying on them; start with an initial app icon and iterate later. Android install prompts stay out of scope (Android is deferred).
- **v11:** Owner decisions for P0 slice 2 (choose an exercise and log a set): pulled a minimal "delete last set" into P0 as Req 9a, because mistakes could not otherwise be fixed. The exercise picker is a native dropdown in P0; search is added as P1 Req 13. Prefill is limited to the latest set logged *today* for the same exercise (reps default 10, weight blank otherwise), so the P2 "prefill from last session" feature stays out. Weight is in pounds. A daily keep-alive request prevents the free Supabase project from pausing.
- **v10:** Owner decision: replaced magic link / Google sign-in (Req 1) with username and password. No email is collected, which also reduces data held. P0 has no password recovery, recorded as a limitation. Implementation choice (Supabase Auth with a username mapped to an internal address) is in the P0 plan, not the PRD.
- **v9:** Owner decision: the timer spike is **passed for iPhone**. Moved PWA install (Req 10) from P1 to P0. Added Req 5f (server-scheduled push alert, part of the P0 timer) and removed the spike-finding note from 5b. Added an install step to the core flow, a user story, a risk row, and a PWA technical note. Answered the iOS open question. Android remains untested and is not a P0 gate. P0 build may start after the owner approves the plan.
- **v8:** Recorded the remaining iPhone results. Other app open: 5 of 5 within 3 seconds (1.0 to 2.0s). Safari tab: failed as expected (notifications cannot be enabled outside the installed app). Edge cases: cellular, reset, stop, tap notification and permission denied behave correctly; force-quit is a partial result. The decision-rule row "Passes only as installed PWA" now applies on iPhone, which would move Req 10 (PWA install) from P1 to P0. That change is recommended but not applied; it needs owner approval. No requirements changed.
- **v7:** Recorded 90-second iPhone results (installed PWA): foreground 5 of 5, home screen 5 of 5, locked screen 10 of 10 within 3 seconds (0.7 to 2.2s), other app open 1 of 1, with no duplicate notifications. The locked-screen pass criterion is met. The Safari-tab row, edge cases and Android remain untested. No requirements changed; a possible move of PWA install (Req 10) to P0 is pending the Safari-tab result and owner approval.
- **v6:** Recorded the first official 90-second run on iPhone (installed PWA): foreground, home screen, other app open, and locked screen all passed, with the push arriving 1.1 to 1.8 seconds after the end. These are single runs, so the formal pass criteria (5 runs per cell; 9 of 10 locked) are not yet met and the decision is still open.
- **v5:** Recorded informal Round 2 results (iPhone installed PWA, 20-second test timer): server-scheduled push delivered notifications when the app was in the foreground, in the background, and locked, after fixing duplicate notifications. The timer was restored to 90 seconds for the official matrix, which is still to be run. No requirements changed.
- **v4:** Recorded Round 1 spike results (iPhone installed PWA): alerts work in the foreground but fail when the phone is locked or another app is open, because iOS freezes the page. Amended the spike scope to include a minimal scheduled Web Push (Upstash QStash + `web-push`). Deferred Android testing. Added a note to Req 5b, a technical consideration for push, a risk row, and an interim answer to the iOS open question. No P0 requirements were removed or reprioritized.
- **v3:** Added Section 12 (Timer Feasibility Spike) with test matrix, pass criteria, time-box, and decision rules. Updated launch plan, risks, and open questions. Renumbered later sections.
- **v2:** Timer fixed at 90s for P0; adjustable duration moved to P1. Timer starts only on set log and never auto-restarts. Added non-goal against auto-looping timers. Accounts moved to P0 (required for persistence). Non-goal reworded to allow history-based next-weight suggestion (P2).
- **v1:** Initial draft.

## 18. Build Status and Backlog (as of Oct 11, 2026)

### P0 status

| Req | What | Status |
|---|---|---|
| 1 | Auth: username and password | Done. No email; no password recovery (known limitation). |
| 2 | Calendar: select the workout date | Done. Previous/next day buttons and the native picker; no future dates. |
| 3 | Exercise selection | Done. 34 preset exercises, alphabetical dropdown. |
| 4 | Set logging (reps, weight in lb) | Done. |
| 5a-5e | Rest timer: start, alert, idle, reset, stop | Done. Starts only for today's sets. |
| 5f | Alert reaches a locked phone | Done. Server-scheduled push; verified on iPhone. |
| 6 | History by date | Done. Latest 30 workouts with Show more. |
| 9a | Delete the last set | Done. |
| 10 | Install-to-home-screen flow | Done for iPhone: guided install, one-tap alerts setup, test alert, blocked and old-iOS help, real icons. |
| 7 (P1) | Adjustable rest duration | Done (v16). Saved per user; applies to the next start or reset. |
| 9 (P1) | Edit and delete any logged set | Done (v17). Exercise, weight and reps can be edited; any set can be deleted. |
| 13 (P1) | Exercise search | Done (v18). Search panel on the logging screen and in the Edit set panel. |
| 8 (P1) | Custom exercises | Done (v18). Private per user; add and rename (no delete); up to 50. |
| (Sec 13) | Delete account and privacy note | Done. Password re-check; privacy note has no contact line for now. |
| (CLAUDE.md) | Analytics events | All seven are sent (user id only). Please confirm they appear in PostHog. |

### Quality and security
- Automated tests cover every timer rule, the date, set, history, install and account logic, and the push request and signature checks.
- Row Level Security passed a 25-check attack test (cross-user reads, edits, deletes, ownership spoofing, admin API).
- A security review was done and the quick fixes shipped (HttpOnly cookies, security headers, PostHog privacy, pinned callback address). No secret appears in the browser code or in any commit.

### Known gaps and tabled work
- **Sign-up bypass (security review finding 1):** account creation goes straight to the auth service. Move it behind a server action with our own rules and rate limiting. Tabled; not critical for a small invited group.
- **No per-user limit on scheduling rest alerts** (finding 2). Tabled.
- **No strict script policy (CSP `script-src`)** yet. Needs careful testing with Next.js and PostHog.
- **Dashboard settings to confirm (owner):** Supabase password minimum 8 and auth rate limits; PostHog session replay off and client IP discarded.
- **Android:** untested and deferred. Android has no install prompt in the app yet.
- **iPhone edge cases not yet retested:** a force-quit app left closed past the end time, Low Power Mode, back-to-back sets, a long idle period, and reload mid-run followed by Stop (fixed in code; not re-verified on a phone).
- **Spike matrix:** Safari tab on iPhone is unsupported by design (alerts need the installed app).
- **Analytics data:** PostHog events are not deleted when an account is deleted (disclosed in the privacy note).
- **Icon:** an initial design; iterate later.

### Backlog (each item needs explicit approval before it is built)
- **P1:** none left. All of Req 7, 8, 9 and 13 are done.
- **P2:** Req 11 prefill from the last session and a rule-based next-weight suggestion. P0 only copies the latest set from the same day.
- **Candidates raised during the build (not yet in the PRD as requirements):** password recovery; Android install prompt and testing; account recovery code; open-sign-up hardening.

### How it is checked
Learning plan unchanged (Section 15): launch to 10-15 gym users, watch W4 retention and timer completion, and decide at week 10.
