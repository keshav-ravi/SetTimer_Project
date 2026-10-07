# PRD: SetTimer (working name)

**Author:** [Your name] | **Status:** Draft v10 | **Last updated:** Oct 6, 2026
**Target:** MVP live in ~6 weeks at 5 hrs/week | **Platform:** Mobile-first web app (PWA)

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
2. **Calendar:** Select the workout date. Defaults to today.
3. **Exercise selection:** Choose from a preset exercise list.
4. **Set logging:** Record reps and weight per set, per exercise.
5. **Rest timer (fixed at 90 seconds):**
   - 5a. Logging a set starts the timer immediately.
   - 5b. At zero, the timer alerts the user (sound, vibration, notification where supported) and returns to idle.
   - 5c. The timer does not restart on its own. It starts again only when the next set is logged.
   - 5d. If a set is logged while the timer is running, the timer resets to 90 seconds. No stacked timers.
   - 5e. The user can stop or dismiss the timer at any point.
   - 5f. *(Added v9, from the spike.)* The alert must reach the user while the phone is locked or another app is open. On iPhone this requires a server-scheduled Web Push to the installed app: logging a set schedules the push, and reset or stop cancels it. The page's own alert covers the foreground. See Section 12.
6. **History:** View past workouts by date.
10. **Install-to-home-screen (PWA) flow.** *(Moved from P1 to P0 in v9 because of the spike: on iPhone, alerts only work in the installed app.)* Guide iPhone users through "Add to Home Screen" before the timer is relied on, ask for notification permission from inside the installed app on a user tap, and explain clearly when notifications are blocked. Number kept as 10 so references stay valid.

### P1

7. **Adjustable rest duration:** User-selected value, persisted per user, applied to the next timer start.
8. **Custom exercises:** Add a new exercise type.
9. **Edit/delete logged sets.**

### P2

11. **Prefill from last session,** then a rule-based next-weight suggestion based on the user's own history (e.g., +5 lb if all target reps were hit). No ML required. This is not workout programming.

## 9. User Stories

- As a lifter, I want my rest timer to start when I log a set so I don't touch my clock app.
- As a lifter, I want the timer to stop after it alerts me so it never runs without my input.
- As a lifter, I want my workouts saved to my account so I don't lose my history.
- As a lifter, I want to pick a date and see what I did on it.
- As an iPhone lifter, I want clear steps to add the app to my home screen and turn on notifications, so the rest alert still reaches me when my phone is locked.
- *(P1)* As a lifter, I want to change my rest duration because heavy compound lifts need more than 90 seconds.
- *(P2)* As a lifter, I want to see what I lifted last time so I know what to attempt today.

## 10. Core Flow

First visit on iPhone: sign in -> install prompt (Add to Home Screen) -> open the installed app -> turn on notifications. Then, every session: open app -> today's date preselected -> pick exercise -> enter weight and reps -> tap "Log set" -> 90-second timer starts -> alarm fires and timer goes idle -> perform next set -> log it -> timer starts again.

**Aha moment:** the second set, when the timer started from the log tap alone.

## 11. Timer Specification

| Event | Result |
|---|---|
| Log set (idle) | State = running; end time = now + 90s |
| Log set (running) | End time reset to now + 90s |
| End time reached | Alert fires; state = idle; no further action |
| Manual stop | State = idle |

Implementation note: store the end timestamp, not a decrementing counter, so the timer survives tab throttling and screen lock. Duration lives in one constant so P1 replaces a single value.

## 12. Timer Feasibility Spike (Week 1, gating)

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
- **Privacy:** Supabase Row Level Security so users only access their own rows; collect minimum data; include delete-account and a plain-language privacy note.

## 14. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Timer unreliable when screen is locked or app is backgrounded | Timestamp-based timer, Wake Lock, PWA install, gating week-1 spike with explicit pass criteria and decision rules (Section 12). Spike showed the in-page alert fails on locked iPhone; server-scheduled Web Push is under test. |
| iPhone users who skip the home-screen install get no alerts | P0 install flow (Req 10): prompt after sign-in, clear steps, and a visible warning when notifications are off |
| Server-sent push adds infrastructure and a third-party service (Upstash QStash) | Keep it minimal and stateless; no user data stored; verify request signatures; accept only known push-service hosts |
| Privacy of workout and account data | RLS, minimal data, delete-account, privacy note |
| Low retention | Track W4 retention; interview drop-offs; prefill (P2) |
| Weak differentiation vs. Hevy/Strong | Measure wedge metrics; write direct comparison in learnings doc |
| Fixed 90s does not fit all lifts | Ship P1 duration control early; monitor dismiss/reset rates |
| Users forget to log, so timer never starts | Track sets logged vs. timer starts per session |
| Scope creep at 5 hrs/week | P0 only until live |

## 15. Launch and Learning Plan

| When | Activity |
|---|---|
| Week 1 | **Timer feasibility spike** (Section 12) on real iPhone and Android devices; decision logged before any other build work |
| Weeks 1-2 | 5 user interviews with gym-going friends (in parallel with spike) |
| Weeks 2-6 | Build P0 in vertical slices, starting from the spike's timer logic if it passed; commit after each working slice |
| Week 6 | Launch to 10-15 gym users (friends, campus gym, club groups) |
| Weeks 7-10 | Observe usage; ship P1 duration control; interview 5 users |
| Week 10 | Decision checkpoint |

**Decision rules at week 10:**
- **Double down** if W4 retention >= 40% and timer completion >= 60%.
- **Pivot** to a narrower wedge if logging is used but the timer is not.
- **Stop** if neither is true.

## 16. Open Questions

- Is 90s acceptable for P0, and how soon do users ask for adjustment?
- Does the log-triggered timer reduce app-switching, or do users still open the Clock app out of habit?
- Is locked-screen alarm reliability on iOS good enough to ship as P0? **Answered (Oct 6, 2026): yes, but only as an installed PWA with server-scheduled push.** The in-page alert alone fails when the phone is locked or another app is open. With the push, 10 of 10 locked-screen runs arrived within 3 seconds (0.7 to 2.2s), and the Safari tab does not work. Android is untested.
- If server-sent push is required, is the added infrastructure acceptable for P0, and is QStash the right long-term scheduler?
- Should the exercise preset list be organized by muscle group or alphabetical?

## 17. Change Log

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
