export const SUBMITTER_COOKIE = 'submitter_token';

export const CHARACTER_STATUSES = {
  QUEUED: 'queued',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  LIVE: 'live',
  ARCHIVED: 'archived'
} as const;

export const VOTE_MODES = {
  YES_NO: 'yn',
  SCALE: 'scale'
} as const;

export const DEFAULT_SUBMISSION_IMAGE_MAX_MB = 5;

export type CharacterStatus = (typeof CHARACTER_STATUSES)[keyof typeof CHARACTER_STATUSES];
export type VoteMode = (typeof VOTE_MODES)[keyof typeof VOTE_MODES];

export function getSubmissionLimit(): number {
  const limit = Number(process.env.SUBMISSION_LIMIT ?? 3);
  return Number.isFinite(limit) && limit > 0 ? limit : 3;
}

export function getSubmissionImageMaxBytes(): number {
  const limitMb = Number(process.env.SUBMISSION_IMAGE_MAX_MB ?? DEFAULT_SUBMISSION_IMAGE_MAX_MB);
  const safeLimitMb = Number.isFinite(limitMb) && limitMb > 0 ? limitMb : DEFAULT_SUBMISSION_IMAGE_MAX_MB;
  return Math.floor(safeLimitMb * 1024 * 1024);
}
