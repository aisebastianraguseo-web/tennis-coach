# Spec: Tennis Coach

**ID:** tennis-coach
**Type:** web-saas
**Version:** 1.0
**Status:** draft
**Created:** 2026-03-22T00:00:00Z

---

## 1. Product Overview

### 1.1 Description

Tennis Coach is a mobile-first, single-user Progressive Web App for club-level tennis players who want to build structured, data-driven knowledge about their recurring opponents and their own playing goals. The app stores growing opponent profiles based on a 3-Cluster analysis framework (Raum / Höhe / Mental), guides pre-match preparation with AI-powered tactical briefings, tracks real-time cluster signals during changeovers, and captures post-match retrospectives. All data lives in the browser (localStorage / IndexedDB). The only external service is the Anthropic Claude API, called through a proxied Next.js API route to protect the API key.

### 1.2 Problem Statement

Club tennis beginners have no system to retain observations between matches. Every match starts at zero — patterns noticed about opponents are forgotten, tactical insights from losses are never revisited, and personal improvement goals are never tracked against actual match behaviour. They need a lightweight mobile tool that stores growing opponent profiles, guides pre-match preparation, delivers AI tactical recommendations during changeovers (30 seconds), and captures post-match retrospectives — all without requiring a printer, notebook or desktop.

### 1.3 Success Criteria

1. User can view the full player list, tap a player, and open their profile within 3 taps and under 5 seconds on a mobile device.
2. User can complete the pre-match preparation flow (goal selection + AI briefing) in under 2 minutes.
3. User can tap a cluster state in match-view and receive an AI recommendation within 3 seconds.
4. User can complete the post-match retrospective and have the player profile auto-updated in a single submit action.
5. All match history, player profiles, and goals persist across browser sessions without any user account or login.

---

## 2. User Personas

### Persona: Club Player

- **Role:** Club tennis beginner (Dorfverein), plays matches against a known pool of ~16 recurring opponents
- **Goals:** Win more matches by exploiting opponent weaknesses systematically; track personal playing goal adherence over a season
- **Pain Points:** Forgets opponent patterns between matches; has no structured pre-match routine; doesn't know which of his own goals to prioritise
- **Technical Level:** low — uses the app on a phone, one-handed, often under time pressure during changeovers

### Persona: Self-Coaching Player

- **Role:** Self-coaching player who wants structured improvement without a human coach
- **Goals:** Build a personal knowledge base of opponent tendencies; correlate own goal selection to match outcomes over time
- **Pain Points:** No feedback loop between tactical decisions and results; no system to detect patterns in own goal adherence
- **Technical Level:** medium — comfortable with apps, interested in data but does not want complex dashboards

---

## 3. Features

## Feature: player-list

**Priority:** P1

### Description

The entry screen of the app. Displays all players (predefined + user-added) in a scrollable list. Each row shows: player name, number of matches played, last match date, and a colour indicator reflecting profile completeness. The user can add a new player via a minimal form. Tapping a player opens a context modal offering two entry modes: "Play" (triggers pre-match flow) or "Observe" (opens match-view in observation mode).

### User Stories

- As a Club Player, I want to see all my opponents in one scrollable list so I can quickly find the person I'm about to play.
- As a Club Player, I want a visual indicator (colour) on each player so I know at a glance how well I know their game.
- As a Self-Coaching Player, I want to add a new opponent quickly so I can start capturing data immediately after meeting someone new.

### Acceptance Criteria

- [ ] AC-player-list-1: On first launch, exactly 16 predefined players are displayed in the list (names as specified in intake), each with 0 matches played and grey indicator.
- [ ] AC-player-list-2: Each player row displays: name, match count (e.g. "3 Matches"), last match date (e.g. "12. März 2026" or "–" if none), and colour indicator (grey = no profile, yellow = partial, green = full levers known).
- [ ] AC-player-list-3: Tapping a player opens a bottom-sheet or modal with two large buttons: "Spielen" and "Beobachten".
- [ ] AC-player-list-4: Tapping "+ Spieler hinzufügen" opens a form with a single required field (name). Submitting adds the player to the bottom of the list with grey indicator.
- [ ] AC-player-list-5: Colour indicator logic: grey = 0 matches; yellow = ≥1 match but not all 3 clusters resolved; green = all 3 clusters (Raum, Höhe, Mental) have a status other than "unknown".
- [ ] AC-player-list-6: List persists across page refreshes (data in localStorage/IndexedDB).

### Data Requirements

- Players table: id, name, is_predefined, created_at
- Derived fields (computed at render): match_count, last_match_date, profile_completeness

### API Surface

No HTTP API for this feature — all data is read/written from browser storage directly via a storage service module.

---

## Feature: player-profile

**Priority:** P1

### Description

Per-player profile screen showing three sections: Cluster Stability (Raum / Höhe / Mental with sub-levers), Match History (chronological, tappable), and AI Summary (generated on demand by Claude). The profile accumulates data automatically after each match or observation session.

### User Stories

- As a Club Player, I want to see a player's cluster profile at a glance so I know their weaknesses before I enter the pre-match flow.
- As a Self-Coaching Player, I want a Claude-generated summary of what a specific opponent demands from me so I get a coaching insight I couldn't derive myself.

### Acceptance Criteria

- [ ] AC-player-profile-1: Cluster Stability section shows three rows: RAUM, HÖHE, MENTAL. Each row displays the current status (Stabil / Instabil / ?) and last-updated date. RAUM shows sub-levers Cross and Drop; HÖHE shows Tief and Hoch; each sub-lever is independently togglable.
- [ ] AC-player-profile-2: Match History section lists all matches for this player in reverse-chronological order. Each entry shows: date, result (W/L or score), one-line key observation. Tapping expands the full match notes.
- [ ] AC-player-profile-3: AI Summary section shows either a placeholder ("Noch keine KI-Zusammenfassung") or the last generated summary with its generation timestamp. A "Aktualisieren" button triggers a new Claude API call.
- [ ] AC-player-profile-4: "Aktualisieren" button is disabled and shows a loading state while the API call is in-flight. On error, shows an inline error message.
- [ ] AC-player-profile-5: The AI Summary is persisted to storage after generation and shown on subsequent visits without re-fetching.
- [ ] AC-player-profile-6: Profile screen is reachable from the player list by tapping the player row (separate from the Play/Observe modal — a dedicated "Profil ansehen" option or by swiping/long-press, see Open Questions).

### Data Requirements

- Profile: player_id, raum_status, raum_sublever (cross|drop|both|none), höhe_status, höhe_sublever (tief|hoch|both|none), mental_status, mental_pattern, ai_summary, updated_at
- Match: id, player_id, date, mode, result, score, started_at, ended_at
- MatchObservation: match_id, set_number, cluster, status, note, created_at

### API Surface

- `POST /api/ai/player-summary`
  - Request: `{ playerId: string }`
  - Response: `{ summary: string }`
  - Auth: public (API key held server-side)
  - Errors: 400 (missing playerId), 500 (Claude API error), 429 (rate limited)

---

## Feature: goal-library

**Priority:** P1

### Description

A persistent library of personal playing goals grouped into 6 categories. 17 predefined goals are seeded on first launch. Users can add new goals via free-text input. Goals can be archived but never deleted. Goals are used in pre-match selection and retrospective evaluation.

### User Stories

- As a Club Player, I want to see all my goals organised by category so I can quickly find and select relevant ones before a match.
- As a Self-Coaching Player, I want to add a new goal I just thought of during pre-match preparation so it's immediately saved to my library.

### Acceptance Criteria

- [ ] AC-goal-library-1: On first launch, 17 predefined goals are seeded across 6 categories: Bewegung & Position (6), Schlagtechnik (4), Taktik & Strategie (4), Aufschlag (2), Körper & Ausrichtung (1), Sonstige (0 predefined). Goal text must match intake verbatim.
- [ ] AC-goal-library-2: Each goal entry stores: id, full text, short_label (max 40 chars, derived automatically as first 40 chars of text), category, is_predefined, is_archived, created_at.
- [ ] AC-goal-library-3: Goals can be archived via a long-press or swipe action. Archived goals are hidden from the default view but accessible via a toggle ("Archivierte anzeigen").
- [ ] AC-goal-library-4: "Neues Ziel hinzufügen" text input at the bottom of the goal library screen accepts free text. Submitting prompts category selection (dropdown). Saves immediately to storage.
- [ ] AC-goal-library-5: The goal library screen is accessible from the main navigation (not only from pre-match).
- [ ] AC-goal-library-6: Goal library persists across browser sessions.

### Data Requirements

- Goal: id, text, short_label, category (bewegung|technik|taktik|aufschlag|koerper|sonstige), is_predefined, is_archived, created_at

### API Surface

No API — all reads/writes to browser storage.

---

## Feature: pre-match

**Priority:** P1

### Description

Pre-match preparation screen triggered when the user selects "Spielen" for a player. Shows the player's current profile summary, allows selection of exactly 3 goals from the goal library, optionally adds a new goal, calls Claude for a one-sentence tactical entry hypothesis, and records match start.

### User Stories

- As a Club Player, I want to quickly review what I know about my opponent and select 3 goals before a match so I enter the court with a clear plan.
- As a Club Player, I want a one-sentence AI briefing tailored to this specific opponent so I have a concrete tactical hypothesis to test.

### Acceptance Criteria

- [ ] AC-pre-match-1: Screen opens with a compact summary of the player's profile: last known cluster statuses + AI one-liner (if available).
- [ ] AC-pre-match-2: Goal selection shows the full goal library grouped by category (collapsible sections). Each goal is a large tappable card (min 48px tall). Selected goals are highlighted. Exactly 3 goals must be selected — tapping a 4th deselects the oldest. Cannot proceed with fewer than 3.
- [ ] AC-pre-match-3: "Neues Ziel hinzufügen" text field at the bottom of the goal list. On submit: saves goal to library (category = Sonstige by default, editable), adds it to the selection if fewer than 3 are selected.
- [ ] AC-pre-match-4: "KI-Briefing" button calls `POST /api/ai/pre-match`. While loading, shows spinner. Response is displayed in a visually distinct card (blue background, white text, bold, ≥20px font). On error: inline error message, button re-enabled.
- [ ] AC-pre-match-5: "Match starten" button is enabled after 3 goals are selected (AI briefing is optional). Tapping it records match start timestamp and navigates to match-view.
- [ ] AC-pre-match-6: Entire flow (goal selection + AI briefing) completes in under 2 minutes under normal conditions (AI call ≤3s).

### Data Requirements

- Match: id, player_id, mode=play, started_at
- Requires reading: player profile, goal library

### API Surface

- `POST /api/ai/pre-match`
  - Request: `{ playerId: string; selectedGoalIds: string[] }`
  - Response: `{ briefing: string }`
  - Auth: public (API key server-side)
  - Errors: 400 (validation), 429 (rate limit), 500 (Claude error)

---

## Feature: match-view

**Priority:** P1

### Description

In-match screen optimised for 30-second changeover interaction. Shows 3 cluster toggle groups (Raum / Höhe / Mental), an optional observation input, a live AI recommendation that updates on each cluster tap, a collapsible dynamic retest block, a collapsed goals reminder, and optional score input. Supports both Play mode and Observe mode (two-player switcher tab).

### User Stories

- As a Club Player, I want to tap a cluster state during a changeover and immediately see a one-sentence AI recommendation so I can adjust my tactic within 30 seconds.
- As a Self-Coaching Player, I want to observe two players in a match and attribute each cluster observation to the correct player so both profiles are updated.

### Acceptance Criteria

- [ ] AC-match-view-1: Screen shows 3 cluster groups. Each group has 3 buttons: [Stabil] [Instabil] [?]. Buttons are min 80px tall. Active state is visually distinct. Default: all clusters at "?".
- [ ] AC-match-view-2: Tapping any cluster button triggers `POST /api/ai/changeover` and displays the response in the AI recommendation card. Loading state shown on card. Card style: blue background, white text, bold, ≥20px font.
- [ ] AC-match-view-3: Observation text field: single-line, max 100 characters, placeholder "Beobachtung (optional)…". Submitting/blurring the field also triggers AI refresh.
- [ ] AC-match-view-4: Dynamic Retest block is collapsed by default. Expanding shows 3 trigger rows: Satzwechsel / Break gegen mich / 3 Games in Folge. Each trigger row has checkboxes for Raum / Höhe / Mental ("verändert?") and a one-line note field. Submitting a retest saves a RetestEntry.
- [ ] AC-match-view-5: "Meine Ziele" section is collapsed by default. Expanding shows the 3 selected goals as read-only large text.
- [ ] AC-match-view-6: Score input: two optional fields (own games, opponent games). No validation beyond numeric.
- [ ] AC-match-view-7: "Match beenden" button navigates to retrospective (Play mode) or saves and returns to player list (Observe mode).
- [ ] AC-match-view-8: Observe mode: tab switcher at top showing both selected players' names. All cluster taps and observations are attributed to the currently selected tab's player. Both players' profiles are updated on save.
- [ ] AC-match-view-9: Each cluster tap persists a MatchObservation record to storage immediately (not only on match end).

### Data Requirements

- MatchObservation: match_id, set_number, cluster, status, note, created_at
- RetestEntry: match_id, trigger, raum_changed, höhe_changed, mental_changed, note, created_at

### API Surface

- `POST /api/ai/changeover`
  - Request: `{ playerId: string; matchId: string; clusterState: { raum: string; höhe: string; mental: string }; observation?: string; selectedGoalIds: string[] }`
  - Response: `{ recommendation: string }`
  - Auth: public (API key server-side)
  - Errors: 400, 429, 500

---

## Feature: retrospective

**Priority:** P1

### Description

Post-match reflection screen shown after "Match beenden" in Play mode. Two blocks: Block 1 evaluates adherence to the 3 selected goals (Ja/Teilweise/Nein + optional note per goal); Block 2 asks 3 analysis quality questions. On submit, Claude generates a 2–3 sentence synergy feedback, the player profile is updated, and the match is saved.

### User Stories

- As a Club Player, I want to quickly rate how well I executed my 3 goals after a match so I build a habit of self-evaluation.
- As a Self-Coaching Player, I want Claude to tell me which goal had synergy with the match lever so I can refine my goal selection next time.

### Acceptance Criteria

- [ ] AC-retro-1: Block 1 shows 3 goal rows (one per selected goal). Each row: goal short label, 3 answer buttons (Ja / Teilweise / Nein), optional single-line note. All 3 goals must be answered before submit is enabled.
- [ ] AC-retro-2: Block 2 shows 3 questions: (Q1) "Welcher Cluster war der stärkste Hebel?" — radio buttons (Raum / Höhe / Mental / Keiner); (Q2) free-text optional; (Q3) free-text optional. Q1 is required.
- [ ] AC-retro-3: Submit button calls `POST /api/ai/retrospective`. While loading, shows spinner. On success, displays AI synergy feedback in a distinct card (blue background, 2–3 sentences). On error: inline message, submit re-enabled.
- [ ] AC-retro-4: After AI response received: (a) RetroEntry is saved to storage; (b) player Profile is updated with the latest cluster statuses from the match; (c) player ai_summary is updated with the new retrospective data available flag (re-generated on next profile view).
- [ ] AC-retro-5: "Fertig" button after synergy feedback navigates to player profile screen.
- [ ] AC-retro-6: Retrospective is not shown in Observe mode — only analysis quality block (questions Q1–Q3) is shown, and no goal evaluation.

### Data Requirements

- RetroEntry: match_id, goal_1_id, goal_1_result, goal_1_note, goal_2_id, goal_2_result, goal_2_note, goal_3_id, goal_3_result, goal_3_note, strongest_lever, missed_signal_note, next_test_note, ai_synergy_feedback

### API Surface

- `POST /api/ai/retrospective`
  - Request: `{ playerId: string; matchId: string; goalResults: Array<{ goalId: string; result: 'ja'|'teilweise'|'nein'; note?: string }>; strongestLever: string; missedSignal?: string; nextTest?: string }`
  - Response: `{ feedback: string }`
  - Auth: public (API key server-side)
  - Errors: 400, 429, 500

---

## Feature: progress-view

**Priority:** P2

### Description

Season overview screen with three sections: (1) own goal adherence rates per category across all matches; (2) cluster lever frequency across all matches; (3) scrollable full match history. No complex statistics — mobile-readable at a glance.

### User Stories

- As a Self-Coaching Player, I want to see which goal categories I consistently achieve vs. drop under pressure so I can focus my training.
- As a Club Player, I want a list of all my matches with outcome and main lever so I can review my season at a glance.

### Acceptance Criteria

- [ ] AC-progress-1: Goal adherence section shows one row per goal category. Each row displays category name and a percentage bar split into Ja / Teilweise / Nein proportions across all retrospectives. Minimum: Ja% label visible.
- [ ] AC-progress-2: Cluster lever section shows a simple bar chart or ranked list of which cluster was most frequently identified as the strongest lever across all matches. Values: Raum / Höhe / Mental / Keiner.
- [ ] AC-progress-3: Match history section shows all matches (across all players) in reverse-chronological order. Each entry: date, opponent name, W/L, strongest lever. Tapping opens the full retrospective view for that match (read-only).
- [ ] AC-progress-4: Section renders correctly with 0 matches (shows empty-state message per section).
- [ ] AC-progress-5: All data is read from browser storage — no API call required for this screen.

### Data Requirements

- Reads: Match, RetroEntry, Goal, Player

### API Surface

None.

---

## 4. Data Model

### 4.1 Entity Relationship Overview

All data is stored in the browser via IndexedDB (accessed through a thin storage service). There is no server-side database. The key entities are:

- **Player** — one per opponent (predefined or user-added)
- **Profile** — one-to-one with Player; stores cluster states and AI summary
- **Match** — many-to-one with Player; one per play/observe session
- **MatchObservation** — many-to-one with Match; one per cluster tap
- **RetestEntry** — many-to-one with Match; one per retest trigger
- **RetroEntry** — one-to-one with Match (Play mode only)
- **Goal** — global library; many-to-many with Match (via selected goals stored in RetroEntry)

### 4.2 Storage Schema (IndexedDB / localStorage)

Since v1 uses browser storage, the schema is defined as TypeScript interfaces. All data is serialised as JSON.

```typescript
// lib/storage/types.ts

export type ClusterStatus = 'stabil' | 'instabil' | 'unknown';
export type GoalResult = 'ja' | 'teilweise' | 'nein';
export type MatchMode = 'play' | 'observe';
export type GoalCategory =
  | 'bewegung'
  | 'technik'
  | 'taktik'
  | 'aufschlag'
  | 'koerper'
  | 'sonstige';
export type Lever = 'raum' | 'höhe' | 'mental' | 'keiner';
export type RetestTrigger = 'satzwechsel' | 'break' | 'drei_games';

export interface Player {
  id: string;           // uuid
  name: string;
  isPredefined: boolean;
  createdAt: string;    // ISO 8601
}

export interface Profile {
  playerId: string;
  raumStatus: ClusterStatus;
  raumSublever: 'cross' | 'drop' | 'both' | 'none';
  höheStatus: ClusterStatus;
  höheSublever: 'tief' | 'hoch' | 'both' | 'none';
  mentalStatus: ClusterStatus;
  mentalPattern: 'risiko_hoch' | 'risiko_runter' | 'konstant' | 'unknown';
  konditionNote: string;
  aiSummary: string;
  aiSummaryGeneratedAt: string | null;
  updatedAt: string;
}

export interface Match {
  id: string;           // uuid
  playerId: string;
  observePlayerIds: string[];  // empty for play mode; both player IDs for observe mode
  date: string;         // ISO 8601 date
  mode: MatchMode;
  result: 'W' | 'L' | null;
  score: string;        // e.g. "6:4, 3:6, 6:2"
  selectedGoalIds: string[];   // exactly 3 for play mode
  aiBriefing: string;
  startedAt: string;
  endedAt: string | null;
}

export interface MatchObservation {
  id: string;
  matchId: string;
  playerId: string;     // needed for observe mode
  setNumber: number;
  cluster: 'raum' | 'höhe' | 'mental';
  status: ClusterStatus;
  note: string;
  createdAt: string;
}

export interface RetestEntry {
  id: string;
  matchId: string;
  trigger: RetestTrigger;
  raumChanged: boolean;
  höheChanged: boolean;
  mentalChanged: boolean;
  note: string;
  createdAt: string;
}

export interface RetroEntry {
  matchId: string;
  goal1Id: string;
  goal1Result: GoalResult;
  goal1Note: string;
  goal2Id: string;
  goal2Result: GoalResult;
  goal2Note: string;
  goal3Id: string;
  goal3Result: GoalResult;
  goal3Note: string;
  strongestLever: Lever;
  missedSignalNote: string;
  nextTestNote: string;
  aiSynergyFeedback: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  text: string;         // full description
  shortLabel: string;   // max 40 chars
  category: GoalCategory;
  isPredefined: boolean;
  isArchived: boolean;
  createdAt: string;
}
```

### 4.3 IndexedDB Store Names

| Store Name         | Key       | Indexes                      |
|--------------------|-----------|------------------------------|
| `players`          | `id`      | `name`                       |
| `profiles`         | `playerId`| —                            |
| `matches`          | `id`      | `playerId`, `date`           |
| `matchObservations`| `id`      | `matchId`, `playerId`        |
| `retestEntries`    | `id`      | `matchId`                    |
| `retroEntries`     | `matchId` | —                            |
| `goals`            | `id`      | `category`, `isArchived`     |

### 4.4 RLS Policies

N/A — v1 uses browser-local storage only. No server-side database.

---

## 5. API Surface

All API routes are Next.js App Router Route Handlers in `app/api/`. They receive data from client, call the Anthropic API server-side, and return the response. No data is stored server-side.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/pre-match` | public | Generate one-sentence tactical briefing for pre-match |
| POST | `/api/ai/changeover` | public | Generate one-sentence changeover recommendation |
| POST | `/api/ai/retrospective` | public | Generate 2–3 sentence synergy feedback |
| POST | `/api/ai/player-summary` | public | Generate AI player profile summary paragraph |

> ASSUMPTION: All API routes are public (no auth header required) since the app has no user accounts. The `ANTHROPIC_API_KEY` is held server-side in a Next.js environment variable and never exposed to the client. Rate limiting via Vercel Edge Middleware protects against abuse.

### Claude API Call Specifications

**Shared system prompt (all calls):**
```
You are a tactical tennis coach assistant using the 3-Cluster analysis system.

CLUSTER 1 — RAUM: Tests whether the opponent stays stable under positional pressure.
- Test 1 (Cross): Play 3-5 cross balls to backhand. Instability signal: longline attempt after ball 3, fewer than 2/3 balls land deep, panic footwork. Tactic: sustained cross pressure, NO tempo increase.
- Test 2 (Drop): Deep ball → drop shot. Instability signal: late arrival, short high return, lost balance. Tactic: deep → drop → lob combination.

CLUSTER 2 — HÖHE: Tests which contact height zone causes instability.
- Test 3 (Tief, under knee): Slice/flat balls. Instability signal: upright posture, slice goes high over net. Tactic: more slice + flat.
- Test 4 (Hoch, shoulder+): Slow steep topspin. Instability signal: retreat behind baseline, short ball to centre. Tactic: high → immediate flat + direction change.

CLUSTER 3 — MENTAL: Observe at 3 moments only: after own error, at 30:30, at break point.
- Pattern A (risk increases): harder shots, net errors, faster decisions. Tactic: reduce tempo, high spin to centre.
- Pattern B (risk decreases): more spin, retreat, longer rallies. Tactic: increase tempo, attack early.

Response rules:
- Plain text only. No markdown, no bullet points.
- Maximum 2 sentences (1 sentence for changeover calls).
- Temperature: 0.3
- Max tokens: 150
```

**`/api/ai/pre-match` prompt:**
```
Player profile: {serialised profile}
Selected goals: {goal texts}
Generate a single sentence: the tactical entry hypothesis for this match.
```

**`/api/ai/changeover` prompt:**
```
Player profile: {serialised profile}
Current cluster state — Raum: {status}, Höhe: {status}, Mental: {status}
Observation: {text or "none"}
Selected goals: {goal texts}
Generate a single sentence: the best tactical adjustment for the next game.
```

**`/api/ai/retrospective` prompt:**
```
Player profile: {serialised profile}
Match cluster summary: {cluster states}
Goal results: {goal 1}: {ja/teilweise/nein}, {goal 2}: {result}, {goal 3}: {result}
Strongest lever: {lever}
Generate 2-3 sentences evaluating which goal had synergy with the strongest lever and what to test next match.
```

**`/api/ai/player-summary` prompt:**
```
Player profile: {serialised profile}
Match history (last 5): {serialised matches with observations}
Generate one paragraph: what this player demands from you and which lever to use first.
```

---

## 6. Non-Functional Requirements

### 6.1 Performance

- Target concurrent users: 1 (single-user app)
- Page load target: LCP < 2s on 4G connection
- AI API response target: < 3s (enforced by streaming where possible)
- Client-side data operations: < 50ms (all in-memory IndexedDB reads)
- Match-view changeover interaction: entire tap-to-AI-response under 3s

### 6.2 Security

- `ANTHROPIC_API_KEY` stored as server-side environment variable only. Never in client bundle, never in localStorage.
- API routes use Vercel Edge Middleware rate limiting: max 30 AI requests per minute per IP.
- CSP headers: `default-src 'self'; script-src 'self' 'nonce-{nonce}'; connect-src 'self' https://api.anthropic.com` — no unsafe-inline, no unsafe-eval.
- HTTP security headers per governance/rules.md §1.4: HSTS, X-Content-Type-Options, X-Frame-Options: DENY, Referrer-Policy, Permissions-Policy.
- HTTPS only in production (Vercel enforces this).
- No user PII stored server-side. All player names and match data are browser-local.
- Input validation: all AI API route request bodies validated with Zod before forwarding to Claude.
- No SQL injection risk (no server-side database in v1).
- OWASP A05 (Security Misconfiguration): no debug endpoints in production; no stack traces sent to client — only generic error messages.
- OWASP A10 (SSRF): the only external URL called server-side is `https://api.anthropic.com` — hardcoded, not user-controlled.

### 6.3 Accessibility

- Standard: WCAG 2.1 AA
- Touch targets: minimum 48×48 CSS px everywhere; cluster buttons in match-view minimum 80px tall
- All interactive elements keyboard-accessible
- AI recommendation card has sufficient contrast (white on blue, ratio ≥ 4.5:1 — verify with axe)
- Skip-to-main-content link as first focusable element on every page
- All cluster toggle buttons use `role="radio"` within `role="radiogroup"` with `aria-label` for each cluster
- German-language app: `lang="de"` on `<html>`

### 6.4 Browser / Platform Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome  | 120+           |
| Firefox | 120+           |
| Safari  | 17+            |
| Edge    | 120+           |

- Mobile-first: designed for portrait, one-handed operation
- No horizontal scrolling on any viewport 320px–2560px
- Font sizes: minimum 16px body, ≥20px for AI recommendations
- Offline: app shell and all cached data work offline after first load; AI features require network (graceful degradation with inline message)

### 6.5 Data Privacy

- GDPR applicability: the app stores player names (which could be considered personal data of third parties). All data is stored locally in the user's browser — no server-side processing or storage of personal data except for the transient AI API call payloads.
- API call payloads contain player names and match observations. These are sent to Anthropic's API. The user must be informed of this via a one-time notice (see Open Questions OQ-3).
- Data residency: EU (Vercel EU region for the Next.js deployment; Anthropic API is US-hosted — this is a known limitation for v1).
- No analytics, no error tracking that captures user data (Sentry configured to scrub PII if added in future).

---

## 7. Out of Scope

| Item | Notes |
|------|-------|
| User authentication / accounts | Single-user local app. No login. V2 candidate if cloud sync added. |
| Cloud sync / multi-device support | V2 — would require Supabase Auth + DB. |
| Push notifications / match reminders | V2. |
| Video or photo attachments | V2. |
| Social features / sharing profiles | Out of scope permanently. |
| Native iOS/Android app | Web-only in v1. |
| Opponent self-registration | Not in scope — app is for the player's own use only. |
| Statistical analysis beyond 3 progress metrics | V2. |
| Real-time match scoring integration | Not in scope. |
| OAuth (Google, Apple) | N/A — no accounts in v1. |
| Export / backup functionality | V2. |

---

## 8. External Dependencies

### Anthropic Claude API

- **Purpose:** Powers all 4 AI coaching moments: pre-match briefing, changeover recommendation, retest signal, post-match synergy feedback, and player summary.
- **Required Credentials:** `ANTHROPIC_API_KEY`
- **Account Setup:** Create account at console.anthropic.com. Generate API key. Add to Vercel environment variables (never to `.env` committed to git).
- **Model:** `claude-sonnet-4-6` (claude-sonnet-4-6 as of 2026-03-22)
- **Pricing Tier:** Pay-per-use. Estimated usage per match: ~4 API calls × 150 tokens output ≈ 600 output tokens. At current Sonnet pricing, <$0.01 per match. Negligible for a single-user app.
- **Rate Limiting:** Anthropic API has per-minute token limits. The app's rate limiter (30 req/min per IP) is well within limits for single-user usage.

---

## 9. Open Questions

- [ ] OQ-1: How should the user navigate to the Player Profile screen? The intake specifies "Play" and "Observe" as the two tap actions. A third action ("Profil ansehen") needs to be added to the player tap modal, or the profile must be accessible via swipe/long-press. **Recommended:** add "Profil" as a third option in the modal. Needs human confirmation.
- [ ] OQ-2: Should match-view show a set counter / current set indicator? The retest block references "Satzwechsel" and "set_number" is in MatchObservation, but the intake does not specify a set-tracking UI element. **Recommended:** add a simple "Satz: 1 / 2 / 3" toggle at the top of match-view that auto-increments observations. Needs human confirmation.
- [ ] OQ-3: GDPR notice — player names in AI call payloads. A brief notice should be shown to the user on first launch explaining that match data (including player names) is sent to Anthropic's API for AI coaching responses. Should this be a dismissible modal or a persistent footer note? **Recommended:** dismissible modal on first launch, stored dismissed state in localStorage.
- [ ] OQ-4: Short labels for predefined goals — the intake specifies `short_label` max 40 chars but does not provide short labels for the 17 predefined goals. The scaffold agent will derive them as the first 40 chars of each goal text. Confirm this is acceptable or provide explicit short labels.
- [ ] OQ-5: Observe mode retrospective — intake says "only analysis quality block" for observe mode, but it's unclear whether the AI synergy call is made at all, or just skipped. **Recommended:** skip AI call in observe mode; save only the 3 analysis questions as a reduced RetroEntry. Needs human confirmation.
