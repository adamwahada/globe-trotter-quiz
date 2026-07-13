import { describe, it, expect } from 'vitest';
import { calculateHeartLoss } from '@/types/game';

describe('calculateHeartLoss', () => {
  it('returns 0 when both continent and country are correct', () => {
    expect(calculateHeartLoss(true, true)).toBe(0);
  });

  it('returns 0.5 when continent is correct but country is wrong', () => {
    expect(calculateHeartLoss(true, false)).toBe(0.5);
  });

  it('returns 0.5 when continent is wrong but country is correct', () => {
    expect(calculateHeartLoss(false, true)).toBe(0.5);
  });

  it('returns 1 when both continent and country are wrong', () => {
    expect(calculateHeartLoss(false, false)).toBe(1);
  });
});
