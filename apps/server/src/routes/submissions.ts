import { Router as createRouter } from 'express';
import type { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { createSubmission, ensureSubmitter } from '../services/submitterService.js';
import { SUBMITTER_COOKIE } from '../utils/constants.js';

const router: Router = createRouter();

const submissionSchema = z.object({
  name: z.string().min(1),
  series: z.string().optional(),
  description: z.string().optional(),
  imagePath: z.string().min(1)
});

router.post('/', async (req, res) => {
  const parseResult = submissionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid submission payload', issues: parseResult.error.issues });
  }

  try {
    const existingToken = req.cookies[SUBMITTER_COOKIE] as string | undefined;
    const { submitter } = await ensureSubmitter(existingToken);

    if (!existingToken || existingToken !== submitter.token) {
      res.cookie(SUBMITTER_COOKIE, submitter.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 365
      });
    }

    const result = await createSubmission(submitter.id, parseResult.data);

    return res.status(202).json({
      message: 'Submission received',
      submissionId: result.characterId,
      queuePosition: result.queuePosition,
      remainingSlots: result.remainingSlots,
      status: result.status
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && (error as any).code === 'SUBMISSION_LIMIT') {
      return res.status(429).json({
        message: 'Submission limit reached for this device',
        code: 'SUBMISSION_LIMIT'
      });
    }

    console.error('Submission error', error);
    return res.status(500).json({ message: 'Failed to create submission' });
  }
});

router.get('/status/:id', async (req, res) => {
  const character = await prisma.character.findUnique({
    where: { id: req.params.id },
    include: {
      queuePosition: true
    }
  });

  if (!character) {
    return res.status(404).json({ message: 'Submission not found' });
  }

  return res.json({
    submissionId: character.id,
    status: character.status,
    position: character.queuePosition?.position ?? null
  });
});

export default router;
