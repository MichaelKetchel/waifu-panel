import { describe, expect, it, afterEach } from 'vitest';

import { getSubmissionLimit } from '../../utils/constants.js';

const originalEnv = process.env.SUBMISSION_LIMIT;

afterEach(() => {
  process.env.SUBMISSION_LIMIT = originalEnv;
});

describe('getSubmissionLimit', () => {
  it('falls back to default when unset', () => {
    process.env.SUBMISSION_LIMIT = undefined;
    expect(getSubmissionLimit()).toBe(3);
  });

  it('coerces invalid values to default', () => {
    process.env.SUBMISSION_LIMIT = 'not-a-number';
    expect(getSubmissionLimit()).toBe(3);
  });

  it('returns positive numeric values', () => {
    process.env.SUBMISSION_LIMIT = '5';
    expect(getSubmissionLimit()).toBe(5);
  });

  it('guards against zero or negative values', () => {
    process.env.SUBMISSION_LIMIT = '-1';
    expect(getSubmissionLimit()).toBe(3);
  });
});
