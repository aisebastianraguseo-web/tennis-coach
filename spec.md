# Spec: Tennis Coach

**ID:** tennis-coach
**Type:** web-saas
**Version:** 1.1
**Status:** approved
**Created:** 2026-03-22T00:00:00Z
**Updated:** 2026-03-22T00:00:00Z — Stack change: Supabase → Neon + Clerk; storage browser-local → cloud PostgreSQL

---

## 1. Product Overview

### 1.1 Description

Tennis Coach is a mobile-first, cloud-backed web app for club-level tennis players who want to build structured, data-driven knowledge about their recurring opponents and their own playing goals. The app stores growing opponent profiles based on a 3-Cluster analysis framework (Raum / Höhe / Mental), guides pre-match preparation with AI-powered tactical briefings, tracks real-time cluster signals during changeovers, and captures post-match retrospectives. Data is persisted in a Neon (serverless PostgreSQL) database. Authentication is handled by Clerk. The only AI service is the Anthropic Claude API, called through a proxied Next.js API route to protect the API key.

### 1.2 Problem Statement

Club tennis beginners have no system to retain observations between matches. Every match starts at zero — patterns noticed about opponents are forgotten, tactical insights from losses are never revisited, and personal improvement goals are never tracked against actual match behaviour. They need a lightweight mobile tool that stores growing opponent profiles, guides pre-match preparation, delivers AI tactical recommendations during changeovers (30 seconds), and captures post-match retrospectives — all without requiring a printer, notebook or desktop.

### 1.3 Success Criteria

1. User can view the full player list, tap a player, and open their profile within 3 taps and under 5 seconds on a mobile device.
2. User can complete the pre-match preparation flow (goal selection + AI briefing) in under 2 minutes.
3. User can tap a cluster state in match-view and receive an AI recommendation within 3 seconds.
4. User can complete the post-match retrospective and have the player profile auto-updated in a single submit action.
5. All match history, player profiles, and goals persist in the cloud and are accessible after login from any device.

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
- [ ] AC-player-list-6: List persists across sessions and devices (data in Neon via authenticated Server Actions).

### Data Requirements

- `players` table: id, user_id, name, is_predefined, created_at
- Derived fields (computed at query time via JOIN): match_count, last_match_date, profile_completeness

### API Surface

Data is fetched via Next.js Server Actions (no separate REST endpoint). All actions require an authenticated Clerk session (`auth()` returns `userId`). Every query filters by `user_id = userId`.

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
- [ ] AC-goal-library-6: Goal library persists across sessions and devices (data in Neon).

### Data Requirements

- `goals` table: id, user_id, text, short_label, category (bewegung|technik|taktik|aufschlag|koerper|sonstige), is_predefined, is_archived, created_at

### API Surface

Server Actions only. All actions scoped to `user_id` from Clerk `auth()`.

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

All data is stored in Neon (serverless PostgreSQL). Every table carries a `user_id` column (Clerk user ID) so all rows are tenant-scoped. Access control is enforced at the application layer: every Server Action and Route Handler calls `auth()` from Clerk and appends `WHERE user_id = :userId` to every query.

- **players** — one per opponent per user (predefined rows seeded on first login)
- **profiles** — one-to-one with players; stores cluster states and AI summary
- **matches** — many-to-one with players; one per play/observe session
- **match_observations** — many-to-one with matches; one per cluster tap
- **retest_entries** — many-to-one with matches; one per retest trigger event
- **retro_entries** — one-to-one with matches (play mode only)
- **goals** — per-user library; predefined rows seeded on first login

### 4.2 Database Schema (PostgreSQL / Drizzle)

```sql
-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- players
CREATE TABLE players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,           -- Clerk userId
  name        TEXT NOT NULL,
  is_predefined BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- profiles (1:1 with players)
CREATE TABLE profiles (
  player_id         UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  user_id           TEXT NOT NULL,
  raum_status       TEXT NOT NULL DEFAULT 'unknown' CHECK (raum_status IN ('stabil','instabil','unknown')),
  raum_sublever     TEXT NOT NULL DEFAULT 'none'    CHECK (raum_sublever IN ('cross','drop','both','none')),
  hoehe_status      TEXT NOT NULL DEFAULT 'unknown' CHECK (hoehe_status IN ('stabil','instabil','unknown')),
  hoehe_sublever    TEXT NOT NULL DEFAULT 'none'    CHECK (hoehe_sublever IN ('tief','hoch','both','none')),
  mental_status     TEXT NOT NULL DEFAULT 'unknown' CHECK (mental_status IN ('stabil','instabil','unknown')),
  mental_pattern    TEXT NOT NULL DEFAULT 'unknown' CHECK (mental_pattern IN ('risiko_hoch','risiko_runter','konstant','unknown')),
  kondition_note    TEXT NOT NULL DEFAULT '',
  ai_summary        TEXT NOT NULL DEFAULT '',
  ai_summary_generated_at TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- matches
CREATE TABLE matches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL,
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  observe_player_ids UUID[] NOT NULL DEFAULT '{}',  -- empty for play mode
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  mode              TEXT NOT NULL CHECK (mode IN ('play','observe')),
  result            TEXT CHECK (result IN ('W','L')),
  score             TEXT NOT NULL DEFAULT '',
  selected_goal_ids UUID[] NOT NULL DEFAULT '{}',   -- exactly 3 for play mode
  ai_briefing       TEXT NOT NULL DEFAULT '',
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ
);

-- match_observations
CREATE TABLE match_observations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  set_number  SMALLINT NOT NULL DEFAULT 1,
  cluster     TEXT NOT NULL CHECK (cluster IN ('raum','hoehe','mental')),
  status      TEXT NOT NULL CHECK (status IN ('stabil','instabil','unknown')),
  note        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- retest_entries
CREATE TABLE retest_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL,
  match_id       UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  trigger        TEXT NOT NULL CHECK (trigger IN ('satzwechsel','break','drei_games')),
  raum_changed   BOOLEAN NOT NULL DEFAULT false,
  hoehe_changed  BOOLEAN NOT NULL DEFAULT false,
  mental_changed BOOLEAN NOT NULL DEFAULT false,
  note           TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- retro_entries (1:1 with matches, play mode only)
CREATE TABLE retro_entries (
  match_id            UUID PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  user_id             TEXT NOT NULL,
  goal_1_id           UUID NOT NULL REFERENCES goals(id),
  goal_1_result       TEXT NOT NULL CHECK (goal_1_result IN ('ja','teilweise','nein')),
  goal_1_note         TEXT NOT NULL DEFAULT '',
  goal_2_id           UUID NOT NULL REFERENCES goals(id),
  goal_2_result       TEXT NOT NULL CHECK (goal_2_result IN ('ja','teilweise','nein')),
  goal_2_note         TEXT NOT NULL DEFAULT '',
  goal_3_id           UUID NOT NULL REFERENCES goals(id),
  goal_3_result       TEXT NOT NULL CHECK (goal_3_result IN ('ja','teilweise','nein')),
  goal_3_note         TEXT NOT NULL DEFAULT '',
  strongest_lever     TEXT NOT NULL CHECK (strongest_lever IN ('raum','hoehe','mental','keiner')),
  missed_signal_note  TEXT NOT NULL DEFAULT '',
  next_test_note      TEXT NOT NULL DEFAULT '',
  ai_synergy_feedback TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_settings (one row per user, created on first login)
CREATE TABLE user_settings (
  user_id                     TEXT PRIMARY KEY,  -- Clerk userId
  gdpr_notice_dismissed_at    TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- goals
CREATE TABLE goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  text         TEXT NOT NULL,
  short_label  TEXT NOT NULL,         -- max 40 chars, enforced in app layer
  category     TEXT NOT NULL CHECK (category IN ('bewegung','technik','taktik','aufschlag','koerper','sonstige')),
  is_predefined BOOLEAN NOT NULL DEFAULT false,
  is_archived  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.3 Indexes

```sql
CREATE INDEX idx_players_user_id        ON players(user_id);
CREATE INDEX idx_profiles_user_id       ON profiles(user_id);
CREATE INDEX idx_matches_user_id        ON matches(user_id);
CREATE INDEX idx_matches_player_id      ON matches(player_id);
CREATE INDEX idx_matches_date           ON matches(date DESC);
CREATE INDEX idx_observations_match_id  ON match_observations(match_id);
CREATE INDEX idx_observations_user_id   ON match_observations(user_id);
CREATE INDEX idx_retest_match_id        ON retest_entries(match_id);
CREATE INDEX idx_retro_user_id          ON retro_entries(user_id);
CREATE INDEX idx_goals_user_id          ON goals(user_id);
CREATE INDEX idx_goals_category         ON goals(category);
```

### 4.4 Access Control (replaces RLS)

Neon does not provide built-in Row Level Security. Access control is enforced at the application layer via three mechanisms:

1. **Clerk Middleware** — all routes under `/(app)` require an active session. Unauthenticated requests are redirected to `/sign-in`.
2. **`user_id` filter on every query** — every Drizzle query includes `.where(eq(table.userId, userId))` where `userId` comes from `auth()`. This is enforced via a shared query helper `lib/db/queries.ts` — direct table access without this filter is not permitted.
3. **Server Actions / Route Handlers only** — no DB access from client components. `auth()` is only available server-side.

### 4.5 Seed Data (on first login)

When a user logs in for the first time (detected by absence of rows in `players` for their `user_id`), a seed Server Action inserts:
- 16 predefined players
- 17 predefined goals (as specified in intake)

This runs once per user, idempotently gated by `WHERE user_id = :userId AND is_predefined = true`.

---

## 5. API Surface

The app uses two types of server-side data access:
- **Server Actions** — for all CRUD operations (players, goals, matches, observations, retro). Called from Client Components via `use server`.
- **Route Handlers** — for AI calls only (streaming-compatible, returns plain text).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/pre-match` | Clerk session required | Generate one-sentence tactical briefing |
| POST | `/api/ai/changeover` | Clerk session required | Generate one-sentence changeover recommendation |
| POST | `/api/ai/retrospective` | Clerk session required | Generate 2–3 sentence synergy feedback |
| POST | `/api/ai/player-summary` | Clerk session required | Generate AI player profile summary paragraph |

All Route Handlers call `auth()` from Clerk at the top and return 401 if no session is present. The `ANTHROPIC_API_KEY` is held server-side and never exposed to the client.

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

- **Auth**: Clerk handles all authentication. `middleware.ts` protects `/(app)` routes. Every Server Action and Route Handler calls `auth()` and returns 401/redirect if no session.
- **DB access control**: every query includes `WHERE user_id = :userId` (Clerk userId). No cross-user data access is possible at the application layer.
- **`ANTHROPIC_API_KEY`**: server-side environment variable only. Never in client bundle, never logged.
- **`DATABASE_URL`**: server-side only. Neon connection string never exposed to client.
- **Rate limiting**: Vercel Edge Middleware — max 30 AI API requests per minute per IP.
- **CSP headers**: `default-src 'self'; script-src 'self' 'nonce-{nonce}'; connect-src 'self' https://api.anthropic.com https://clerk.com` — no unsafe-inline, no unsafe-eval.
- **HTTP security headers** per governance/rules.md §1.4: HSTS, X-Content-Type-Options, X-Frame-Options: DENY, Referrer-Policy, Permissions-Policy.
- **HTTPS**: Vercel enforces HTTPS in production.
- **Input validation**: all Server Action and Route Handler inputs validated with Zod before any DB query or Claude API call.
- **SQL injection**: prevented by Drizzle ORM parameterised queries. Raw SQL is not used in application code.
- **OWASP A01 (Broken Access Control)**: `user_id` filter on every query; Clerk Middleware blocks unauthenticated access.
- **OWASP A05 (Security Misconfiguration)**: no debug endpoints in production; no stack traces returned to client.
- **OWASP A10 (SSRF)**: only hardcoded external URL server-side is `https://api.anthropic.com`.

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
- Offline: not supported in v1 — all features require network (Neon + Clerk + Anthropic). App shows an error state when offline (see OQ-6).

### 6.5 Data Privacy

- GDPR applicability: the app stores player names (personal data of third parties) and match observations in Neon (PostgreSQL). Data is stored server-side under the authenticated user's `user_id`.
- Clerk stores user account data (email, session tokens) — see Clerk's DPA for GDPR compliance details.
- API call payloads contain player names and match observations sent to Anthropic's API (US-hosted). Users are informed via a one-time consent notice on first login (see OQ-3).
- Data residency: Vercel EU region for Next.js; Neon EU region (`eu-central-1`); Anthropic API is US-hosted (known v1 limitation).
- No analytics. Sentry (if enabled) configured to scrub PII.

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

### Neon (PostgreSQL)

- **Purpose:** Serverless PostgreSQL database. Stores all application data (players, profiles, matches, goals, observations, retro entries).
- **Required Credentials:** `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (for migrations)
- **Account Setup:** Create project at neon.tech. Select region `eu-central-1`. Copy connection strings to Vercel environment variables.
- **Pricing Tier:** Free tier — 0.5 GB storage, 1 project, no expiry. Sufficient for a single-user app with years of match data.
- **Driver:** `@neondatabase/serverless` + Drizzle ORM.

### Clerk

- **Purpose:** Authentication — sign-up, sign-in, session management, user identity (`userId` used as tenant key in all DB queries).
- **Required Credentials:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, redirect URL env vars (see stack.md)
- **Account Setup:** Create app at clerk.com. Enable Email/Password provider. Add environment variables to Vercel.
- **Pricing Tier:** Free tier — 10,000 MAU. Covers any realistic usage of this app.
- **Integration:** `@clerk/nextjs` package. `middleware.ts` protects app routes. `auth()` used server-side in every data access function.

### Anthropic Claude API

- **Purpose:** Powers all AI coaching moments: pre-match briefing, changeover recommendation, post-match synergy feedback, and player summary.
- **Required Credentials:** `ANTHROPIC_API_KEY`
- **Account Setup:** Create account at console.anthropic.com. Generate API key. Add to Vercel environment variables (never to `.env` committed to git).
- **Model:** `claude-sonnet-4-6`
- **Pricing Tier:** Pay-per-use. Estimated usage per match: ~4 API calls × 150 tokens output ≈ 600 output tokens. <$0.01 per match. Negligible for a single-user app.
- **Rate Limiting:** App-level limiter (30 req/min per IP) is well within Anthropic's per-minute limits.

---

## 9. Open Questions

All open questions resolved. Decisions recorded below.

- [x] OQ-1: Player Profile navigation — **RESOLVED:** "Profil" as third option in the player tap modal (alongside "Spielen" and "Beobachten").
- [x] OQ-2: Set counter in match-view — **RESOLVED:** Simple "Satz: 1 / 2 / 3" toggle at the top of match-view. Auto-increments `set_number` on observations.
- [x] OQ-3: GDPR notice — **RESOLVED:** One-time dismissible modal shown after first sign-in. Dismissed state stored as a column `gdpr_notice_dismissed_at` in a `user_settings` table.
- [x] OQ-4: Short labels — **RESOLVED:** First 40 characters of each goal text used as `short_label`. Applied during seed.
- [x] OQ-5: Observe mode AI — **RESOLVED:** AI synergy call is skipped in observe mode. Only the 3 analysis questions (Q1–Q3) are saved as a reduced RetroEntry (goal fields left null).
- [x] OQ-6: Offline — **RESOLVED:** Offline is out-of-scope for v1. App shows a generic network error state when DB or Clerk is unreachable.
