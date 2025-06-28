import { describe, it, expect } from 'vitest'
import {
  isValidEventPlacement,
  findValidPlacement,
  getConsumptionPeriods,
  getNextValidPosition
} from './collisionDetection'

const mockEvents = [
  {
    name: 'cast windlance',
    req: ['eq', 'bal'],
    consumes: ['eq'],
    duration: 1.5
  },
  {
    name: 'drink health',
    req: ['pill'],
    consumes: ['pill'],
    duration: 0.5
  }
]

describe('collisionDetection', () => {
  describe('getConsumptionPeriods', () => {
    it('should return consumption periods for a balance', () => {
      const eventValues = { 'cast windlance': 1.0, 'drink health': 2.0 }
      const periods = getConsumptionPeriods('eq', mockEvents, eventValues)
      
      expect(periods).toEqual([
        { start: 1.0, end: 2.5, eventName: 'cast windlance' }
      ])
    })

    it('should return empty array when no events consume the balance', () => {
      const eventValues = { 'cast windlance': 1.0 }
      const periods = getConsumptionPeriods('bal', mockEvents, eventValues)
      
      expect(periods).toEqual([])
    })
  })

  describe('isValidEventPlacement', () => {
    it('should allow event requiring balance outside consumption period', () => {
      const eventValues = { 'cast windlance': 2.0 }
      const newEvent = { name: 'new event', req: ['eq'], consumes: [], duration: 1.0 }
      
      // Should be valid at time 0 (before consumption starts at 2.0)
      const isValid = isValidEventPlacement('new event', 0, newEvent, 'eq', mockEvents, eventValues)
      expect(isValid).toBe(true)
    })

    it('should prevent event requiring balance during consumption period', () => {
      const eventValues = { 'cast windlance': 1.0 }
      const newEvent = { name: 'new event', req: ['eq'], consumes: [], duration: 1.0 }
      
      // Should be invalid at time 1.5 (during consumption period 1.0-2.5)
      const isValid = isValidEventPlacement('new event', 1.5, newEvent, 'eq', mockEvents, eventValues)
      expect(isValid).toBe(false)
    })

    it('should prevent overlapping consumption periods', () => {
      const eventValues = { 'cast windlance': 1.0 }
      const newEvent = { name: 'new event', req: [], consumes: ['eq'], duration: 1.0 }
      
      // Should be invalid at time 1.5 (would overlap with existing consumption 1.0-2.5)
      const isValid = isValidEventPlacement('new event', 1.5, newEvent, 'eq', mockEvents, eventValues)
      expect(isValid).toBe(false)
    })

    it('should allow adjacent consumption periods', () => {
      const eventValues = { 'cast windlance': 1.0 }
      const newEvent = { name: 'new event', req: [], consumes: ['eq'], duration: 0.5 }
      
      // Should be valid at time 2.5 (right after existing consumption ends)
      const isValid = isValidEventPlacement('new event', 2.5, newEvent, 'eq', mockEvents, eventValues)
      expect(isValid).toBe(true)
    })
  })

  describe('findValidPlacement', () => {
    it('should find valid placement for non-conflicting event', () => {
      const eventValues = { 'cast windlance': 2.0 }
      const newEvent = { name: 'new event', req: ['eq'], consumes: [], duration: 1.0 }
      
      const placement = findValidPlacement('new event', newEvent, 'eq', mockEvents, eventValues)
      expect(placement).toBe(0) // Should find position at start
    })

    it('should find placement after consumption period', () => {
      const eventValues = { 'cast windlance': 0.5 }
      const newEvent = { name: 'new event', req: [], consumes: ['eq'], duration: 1.0 }
      
      const placement = findValidPlacement('new event', newEvent, 'eq', mockEvents, eventValues, 1.0)
      expect(placement).toBe(2.0) // Should find position after consumption ends (0.5 + 1.5 = 2.0)
    })

    it('should return null when no valid placement exists', () => {
      const eventValues = { 'cast windlance': 0 }
      const newEvent = { name: 'new event', req: [], consumes: ['eq'], duration: 6.0 } // Too long
      
      const placement = findValidPlacement('new event', newEvent, 'eq', mockEvents, eventValues)
      expect(placement).toBe(null)
    })
  })

  describe('getNextValidPosition', () => {
    it('should return current position if valid', () => {
      const eventValues = { 'cast windlance': 2.0 }
      const event = { name: 'test event', req: ['eq'], consumes: [], duration: 1.0 }
      
      const position = getNextValidPosition('test event', 0, event, 'eq', mockEvents, eventValues)
      expect(position).toBe(0)
    })

    it('should prefer backward position to avoid forward jumping', () => {
      const eventValues = { 'cast windlance': 0.5 }
      const event = { name: 'test event', req: ['eq'], consumes: [], duration: 1.0 }
      
      // Trying to place at 1.0 (during consumption), should prefer backward position
      // instead of jumping forward to 2.0 (which could cause overlaps with later events)
      const position = getNextValidPosition('test event', 1.0, event, 'eq', mockEvents, eventValues)
      expect(position).toBeLessThanOrEqual(1.0) // Should find position before the conflict, not jump forward
    })
  })
})