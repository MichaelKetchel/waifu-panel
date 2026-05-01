import { describe, expect, it } from 'vitest';

import { isStartableCharacterStatus } from '../roundService.js';

describe('isStartableCharacterStatus', () => {
  it('only allows approved characters to start a round', () => {
    expect(isStartableCharacterStatus('approved')).toBe(true);
    expect(isStartableCharacterStatus('queued')).toBe(false);
    expect(isStartableCharacterStatus('live')).toBe(false);
    expect(isStartableCharacterStatus('archived')).toBe(false);
    expect(isStartableCharacterStatus('rejected')).toBe(false);
  });
});
