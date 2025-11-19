import { describe, expect, it } from 'vitest';

import { normalizeVoteValue } from '../voteService.js';

describe('normalizeVoteValue', () => {
  it('reduces yes/no votes to binary values', () => {
    expect(normalizeVoteValue({ mode: 'yn', scaleMin: 0, scaleMax: 1 }, 10)).toBe(1);
    expect(normalizeVoteValue({ mode: 'yn', scaleMin: 0, scaleMax: 1 }, -5)).toBe(0);
  });

  it('clamps scale votes to allowed range', () => {
    const round = { mode: 'scale', scaleMin: 1, scaleMax: 5 };
    expect(normalizeVoteValue(round, 10)).toBe(5);
    expect(normalizeVoteValue(round, -2)).toBe(1);
  });

  it('rounds to nearest whole number for scale mode', () => {
    const round = { mode: 'scale', scaleMin: 1, scaleMax: 5 };
    expect(normalizeVoteValue(round, 3.6)).toBe(4);
    expect(normalizeVoteValue(round, 2.2)).toBe(2);
  });
});
