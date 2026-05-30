import { describe, it, expect } from 'vitest'
import { formatDuration } from './format'

describe('formatDuration', () => {
  it('formats sub-hour values in minutes', () => {
    expect(formatDuration(300_000)).toBe('5 min')
    expect(formatDuration(600_000)).toBe('10 min')
    expect(formatDuration(1_800_000)).toBe('30 min')
  })
  it('formats whole hours without minutes', () => {
    expect(formatDuration(3_600_000)).toBe('1 hr')
    expect(formatDuration(7_200_000)).toBe('2 hr')
  })
  it('formats hours with remaining minutes', () => {
    expect(formatDuration(4_500_000)).toBe('1 hr 15 min') // 75 min
    expect(formatDuration(5_400_000)).toBe('1 hr 30 min') // 90 min
    expect(formatDuration(3_900_000)).toBe('1 hr 5 min')  // 65 min
  })
})
