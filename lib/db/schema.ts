import {
  pgTable,
  text,
  boolean,
  timestamp,
  date,
  uuid,
  smallint,
  pgEnum,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const clusterStatusEnum = pgEnum('cluster_status', ['stabil', 'instabil', 'unknown'])
export const raumSubleverEnum = pgEnum('raum_sublever', ['cross', 'drop', 'both', 'none'])
export const hoeheSubleverEnum = pgEnum('hoehe_sublever', ['tief', 'hoch', 'both', 'none'])
export const mentalPatternEnum = pgEnum('mental_pattern', [
  'risiko_hoch',
  'risiko_runter',
  'konstant',
  'unknown',
])
export const matchModeEnum = pgEnum('match_mode', ['play', 'observe'])
export const matchResultEnum = pgEnum('match_result', ['W', 'L'])
export const clusterEnum = pgEnum('cluster', ['raum', 'hoehe', 'mental'])
export const retestTriggerEnum = pgEnum('retest_trigger', ['satzwechsel', 'break', 'drei_games'])
export const goalResultEnum = pgEnum('goal_result', ['ja', 'teilweise', 'nein'])
export const leverEnum = pgEnum('lever', ['raum', 'hoehe', 'mental', 'keiner'])
export const goalCategoryEnum = pgEnum('goal_category', [
  'bewegung',
  'technik',
  'taktik',
  'aufschlag',
  'koerper',
  'sonstige',
])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const userSettings = pgTable('user_settings', {
  userId: text('user_id').primaryKey(), // Clerk userId
  gdprNoticeDismissedAt: timestamp('gdpr_notice_dismissed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  isPredefined: boolean('is_predefined').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const profiles = pgTable('profiles', {
  playerId: uuid('player_id')
    .primaryKey()
    .references(() => players.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  raumStatus: clusterStatusEnum('raum_status').notNull().default('unknown'),
  raumSublever: raumSubleverEnum('raum_sublever').notNull().default('none'),
  hoeheStatus: clusterStatusEnum('hoehe_status').notNull().default('unknown'),
  hoeheSublever: hoeheSubleverEnum('hoehe_sublever').notNull().default('none'),
  mentalStatus: clusterStatusEnum('mental_status').notNull().default('unknown'),
  mentalPattern: mentalPatternEnum('mental_pattern').notNull().default('unknown'),
  konditionNote: text('kondition_note').notNull().default(''),
  aiSummary: text('ai_summary').notNull().default(''),
  aiSummaryGeneratedAt: timestamp('ai_summary_generated_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  playerId: uuid('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  observePlayerIds: uuid('observe_player_ids').array().notNull().default([]),
  date: date('date').notNull(),
  mode: matchModeEnum('mode').notNull(),
  result: matchResultEnum('result'),
  score: text('score').notNull().default(''),
  selectedGoalIds: uuid('selected_goal_ids').array().notNull().default([]),
  aiBriefing: text('ai_briefing').notNull().default(''),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
})

export const matchObservations = pgTable('match_observations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  matchId: uuid('match_id')
    .notNull()
    .references(() => matches.id, { onDelete: 'cascade' }),
  playerId: uuid('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  setNumber: smallint('set_number').notNull().default(1),
  cluster: clusterEnum('cluster').notNull(),
  status: clusterStatusEnum('status').notNull(),
  note: text('note').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const retestEntries = pgTable('retest_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  matchId: uuid('match_id')
    .notNull()
    .references(() => matches.id, { onDelete: 'cascade' }),
  trigger: retestTriggerEnum('trigger').notNull(),
  raumChanged: boolean('raum_changed').notNull().default(false),
  hoeheChanged: boolean('hoehe_changed').notNull().default(false),
  mentalChanged: boolean('mental_changed').notNull().default(false),
  note: text('note').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  text: text('text').notNull(),
  shortLabel: text('short_label').notNull(),
  category: goalCategoryEnum('category').notNull(),
  isPredefined: boolean('is_predefined').notNull().default(false),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const retroEntries = pgTable('retro_entries', {
  matchId: uuid('match_id')
    .primaryKey()
    .references(() => matches.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  goal1Id: uuid('goal_1_id').references(() => goals.id),
  goal1Result: goalResultEnum('goal_1_result'),
  goal1Note: text('goal_1_note').notNull().default(''),
  goal2Id: uuid('goal_2_id').references(() => goals.id),
  goal2Result: goalResultEnum('goal_2_result'),
  goal2Note: text('goal_2_note').notNull().default(''),
  goal3Id: uuid('goal_3_id').references(() => goals.id),
  goal3Result: goalResultEnum('goal_3_result'),
  goal3Note: text('goal_3_note').notNull().default(''),
  strongestLever: leverEnum('strongest_lever').notNull(),
  missedSignalNote: text('missed_signal_note').notNull().default(''),
  nextTestNote: text('next_test_note').notNull().default(''),
  aiSynergyFeedback: text('ai_synergy_feedback').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
