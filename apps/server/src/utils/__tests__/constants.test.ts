import { describe, expect, it, afterEach } from 'vitest';

import { getSubmissionImageMaxBytes, getSubmissionLimit } from '../../utils/constants.js';

const originalEnv = {
  SUBMISSION_LIMIT: process.env.SUBMISSION_LIMIT,
  SUBMISSION_IMAGE_MAX_MB: process.env.SUBMISSION_IMAGE_MAX_MB
};

afterEach(() => {
  restoreEnv('SUBMISSION_LIMIT', originalEnv.SUBMISSION_LIMIT);
  restoreEnv('SUBMISSION_IMAGE_MAX_MB', originalEnv.SUBMISSION_IMAGE_MAX_MB);
});

describe('getSubmissionLimit', () => {
  it('falls back to default when unset', () => {
    delete process.env.SUBMISSION_LIMIT;
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

describe('getSubmissionImageMaxBytes', () => {
  it('falls back to 5MB when unset', () => {
    delete process.env.SUBMISSION_IMAGE_MAX_MB;
    expect(getSubmissionImageMaxBytes()).toBe(5 * 1024 * 1024);
  });

  it('returns configured megabytes as bytes', () => {
    process.env.SUBMISSION_IMAGE_MAX_MB = '8';
    expect(getSubmissionImageMaxBytes()).toBe(8 * 1024 * 1024);
  });

  it('allows fractional megabyte limits', () => {
    process.env.SUBMISSION_IMAGE_MAX_MB = '0.5';
    expect(getSubmissionImageMaxBytes()).toBe(512 * 1024);
  });

  it('coerces invalid values to the 5MB default', () => {
    process.env.SUBMISSION_IMAGE_MAX_MB = 'not-a-number';
    expect(getSubmissionImageMaxBytes()).toBe(5 * 1024 * 1024);
  });

  it('guards against zero or negative values', () => {
    process.env.SUBMISSION_IMAGE_MAX_MB = '0';
    expect(getSubmissionImageMaxBytes()).toBe(5 * 1024 * 1024);
  });
});

function restoreEnv(key: keyof typeof originalEnv, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
