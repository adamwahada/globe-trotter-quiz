import { describe, it, expect } from 'vitest';
import {
  calculateHeartLoss,
  getRemainingHeartLoss,
  applyHeartDelta,
} from '@/types/game';

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

describe('getRemainingHeartLoss', () => {
  it('returns full loss when nothing deducted yet', () => {
    expect(getRemainingHeartLoss({ heartLoss: 1, heartsDeductedThisRound: 0 })).toBe(1);
  });

  it('returns remainder after continent penalty was applied live', () => {
    expect(getRemainingHeartLoss({ heartLoss: 1, heartsDeductedThisRound: 0.5 })).toBe(0.5);
  });

  it('returns 0 when all loss already deducted', () => {
    expect(getRemainingHeartLoss({ heartLoss: 0.5, heartsDeductedThisRound: 0.5 })).toBe(0);
  });
});

describe('applyHeartDelta', () => {
  it('deducts hearts for one player independently', () => {
    const alice = applyHeartDelta({ hearts: 5, isEliminated: false }, 0.5, 1);
    const bob = applyHeartDelta({ hearts: 5, isEliminated: false }, 1, 1);

    expect(alice.hearts).toBe(4.5);
    expect(bob.hearts).toBe(4);
    expect(alice.isEliminated).toBe(false);
    expect(bob.isEliminated).toBe(false);
  });

  it('eliminates player when hearts reach zero', () => {
    const state = applyHeartDelta({ hearts: 0.5, isEliminated: false }, 0.5, 3);
    expect(state.hearts).toBe(0);
    expect(state.isEliminated).toBe(true);
    expect(state.eliminatedInRound).toBe(3);
  });
});
