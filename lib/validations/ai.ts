import { z } from 'zod'

export const preMatchSchema = z.object({
  playerId: z.string().uuid(),
  selectedGoalIds: z.array(z.string().uuid()).length(3),
})

export const changoverSchema = z.object({
  playerId: z.string().uuid(),
  matchId: z.string().uuid(),
  clusterState: z.object({
    raum: z.enum(['stabil', 'instabil', 'unknown']),
    hoehe: z.enum(['stabil', 'instabil', 'unknown']),
    mental: z.enum(['stabil', 'instabil', 'unknown']),
  }),
  observation: z.string().max(100).optional(),
  selectedGoalIds: z.array(z.string().uuid()).max(3),
})

export const retrospectiveSchema = z.object({
  playerId: z.string().uuid(),
  matchId: z.string().uuid(),
  goalResults: z
    .array(
      z.object({
        goalId: z.string().uuid(),
        result: z.enum(['ja', 'teilweise', 'nein']),
        note: z.string().max(200).optional(),
      })
    )
    .length(3),
  strongestLever: z.enum(['raum', 'hoehe', 'mental', 'keiner']),
  missedSignal: z.string().max(500).optional(),
  nextTest: z.string().max(500).optional(),
})

export const playerSummarySchema = z.object({
  playerId: z.string().uuid(),
})

export type PreMatchInput = z.infer<typeof preMatchSchema>
export type ChangoverInput = z.infer<typeof changoverSchema>
export type RetrospectiveInput = z.infer<typeof retrospectiveSchema>
export type PlayerSummaryInput = z.infer<typeof playerSummarySchema>
