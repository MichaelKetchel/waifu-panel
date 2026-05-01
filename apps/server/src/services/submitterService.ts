import crypto from 'node:crypto';

import { prisma } from '../lib/prisma.js';
import { CHARACTER_STATUSES, getSubmissionLimit } from '../utils/constants.js';

export interface SubmissionPayload {
  name: string;
  series?: string;
  description?: string;
  imagePath: string;
}

export interface SubmissionResult {
  characterId: string;
  queuePosition: number;
  status: string;
  remainingSlots: number;
}

export interface SubmitterSubmission {
  submissionId: string;
  name: string;
  series: string | null;
  imagePath: string;
  status: string;
  queuePosition: number | null;
  rejectionReason: string | null;
  createdAt: string;
}

export async function ensureSubmitter(token?: string) {
  if (token) {
    const existing = await prisma.submitter.findUnique({ where: { token } });
    if (existing) {
      return { submitter: existing, created: false };
    }
  }

  const newToken = crypto.randomUUID();
  const submitter = await prisma.submitter.create({
    data: {
      token: newToken
    }
  });

  return { submitter, created: true };
}

export async function createSubmission(submitterId: string, payload: SubmissionPayload): Promise<SubmissionResult> {
  const submissionLimit = getSubmissionLimit();
  const activeCount = await countLimitActiveSubmissions(submitterId);

  if (activeCount >= submissionLimit) {
    throw Object.assign(new Error('Submission limit reached'), { code: 'SUBMISSION_LIMIT' });
  }

  return prisma.$transaction(async (tx) => {
    const { _max } = await tx.queuePosition.aggregate({
      _max: {
        position: true
      }
    });
    const nextPosition = (_max.position ?? 0) + 1;

    const character = await tx.character.create({
      data: {
        submitterId,
        name: payload.name,
        series: payload.series,
        description: payload.description,
        imagePath: payload.imagePath,
        status: CHARACTER_STATUSES.QUEUED,
        queuePosition: {
          create: {
            position: nextPosition
          }
        }
      },
      include: {
        queuePosition: true
      }
    });

    const remainingSlots = submissionLimit - (activeCount + 1);

    return {
      characterId: character.id,
      queuePosition: character.queuePosition?.position ?? nextPosition,
      status: character.status,
      remainingSlots: Math.max(remainingSlots, 0)
    };
  });
}

export async function getSubmitterSubmissions(token?: string) {
  const submissionLimit = getSubmissionLimit();

  if (!token) {
    return {
      submissions: [] as SubmitterSubmission[],
      remainingSlots: submissionLimit,
      submissionLimit
    };
  }

  const submitter = await prisma.submitter.findUnique({ where: { token } });

  if (!submitter) {
    return {
      submissions: [] as SubmitterSubmission[],
      remainingSlots: submissionLimit,
      submissionLimit
    };
  }

  const [activeCount, submissions] = await Promise.all([
    countLimitActiveSubmissions(submitter.id),
    prisma.character.findMany({
      where: { submitterId: submitter.id },
      include: { queuePosition: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    submissions: submissions.map((submission) => ({
      submissionId: submission.id,
      name: submission.name,
      series: submission.series ?? null,
      imagePath: submission.imagePath,
      status: submission.status,
      queuePosition: submission.queuePosition?.position ?? null,
      rejectionReason: submission.rejectionReason ?? null,
      createdAt: submission.createdAt.toISOString()
    })),
    remainingSlots: Math.max(submissionLimit - activeCount, 0),
    submissionLimit
  };
}

function countLimitActiveSubmissions(submitterId: string) {
  return prisma.character.count({
    where: {
      submitterId,
      status: {
        in: [CHARACTER_STATUSES.QUEUED, CHARACTER_STATUSES.APPROVED, CHARACTER_STATUSES.LIVE]
      }
    }
  });
}
