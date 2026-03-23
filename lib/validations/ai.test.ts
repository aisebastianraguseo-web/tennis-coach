import { describe, it, expect } from 'vitest'
import { preMatchSchema, changoverSchema, retrospectiveSchema, playerSummarySchema } from './ai'

const UUID = '550e8400-e29b-41d4-a716-446655440000'
const UUID2 = '550e8400-e29b-41d4-a716-446655440001'
const UUID3 = '550e8400-e29b-41d4-a716-446655440002'

describe('preMatchSchema', () => {
  it('accepts valid input with exactly 3 goal IDs', () => {
    const result = preMatchSchema.safeParse({
      playerId: UUID,
      selectedGoalIds: [UUID, UUID2, UUID3],
    })
    expect(result.success).toBe(true)
  })

  it('rejects fewer than 3 goal IDs', () => {
    const result = preMatchSchema.safeParse({ playerId: UUID, selectedGoalIds: [UUID, UUID2] })
    expect(result.success).toBe(false)
  })

  it('rejects invalid playerId', () => {
    const result = preMatchSchema.safeParse({
      playerId: 'not-a-uuid',
      selectedGoalIds: [UUID, UUID2, UUID3],
    })
    expect(result.success).toBe(false)
  })
})

describe('changoverSchema', () => {
  const validBase = {
    playerId: UUID,
    matchId: UUID2,
    clusterState: { raum: 'stabil', hoehe: 'instabil', mental: 'unknown' },
    selectedGoalIds: [UUID3],
  }

  it('accepts valid input', () => {
    expect(changoverSchema.safeParse(validBase).success).toBe(true)
  })

  it('rejects invalid cluster status', () => {
    const result = changoverSchema.safeParse({
      ...validBase,
      clusterState: { raum: 'gut', hoehe: 'instabil', mental: 'unknown' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 3 selected goals', () => {
    const result = changoverSchema.safeParse({
      ...validBase,
      selectedGoalIds: [UUID, UUID2, UUID3, UUID],
    })
    expect(result.success).toBe(false)
  })
})

describe('retrospectiveSchema', () => {
  const validGoalResult = (id: string) => ({ goalId: id, result: 'ja' as const })
  const valid = {
    playerId: UUID,
    matchId: UUID2,
    goalResults: [validGoalResult(UUID), validGoalResult(UUID2), validGoalResult(UUID3)],
    strongestLever: 'raum' as const,
  }

  it('accepts valid input', () => {
    expect(retrospectiveSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects invalid lever', () => {
    const result = retrospectiveSchema.safeParse({ ...valid, strongestLever: 'kopf' })
    expect(result.success).toBe(false)
  })

  it('rejects fewer than 3 goal results', () => {
    const result = retrospectiveSchema.safeParse({
      ...valid,
      goalResults: [validGoalResult(UUID), validGoalResult(UUID2)],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid goal result value', () => {
    const result = retrospectiveSchema.safeParse({
      ...valid,
      goalResults: [
        { goalId: UUID, result: 'vielleicht' },
        validGoalResult(UUID2),
        validGoalResult(UUID3),
      ],
    })
    expect(result.success).toBe(false)
  })
})

describe('playerSummarySchema', () => {
  it('accepts a valid UUID', () => {
    expect(playerSummarySchema.safeParse({ playerId: UUID }).success).toBe(true)
  })

  it('rejects a non-UUID string', () => {
    expect(playerSummarySchema.safeParse({ playerId: 'abc' }).success).toBe(false)
  })
})
