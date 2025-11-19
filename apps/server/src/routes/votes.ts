import { Router as createRouter } from 'express';
import type { Router } from 'express';
import { z } from 'zod';

import { ensureSubmitter } from '../services/submitterService.js';
import { submitVote } from '../services/voteService.js';
import { SUBMITTER_COOKIE } from '../utils/constants.js';

const router: Router = createRouter();

const voteSchema = z.object({
  roundId: z.string().uuid(),
  value: z.number()
});

router.post('/', async (req, res) => {
  const parseResult = voteSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid vote payload', issues: parseResult.error.issues });
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

    const result = await submitVote({
      roundId: parseResult.data.roundId,
      value: parseResult.data.value,
      submitterId: submitter.id
    });

    res.json({
      message: 'Vote recorded',
      ...result
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && (error as any).code === 'ROUND_NOT_ACTIVE') {
      return res.status(409).json({ message: 'Round is not active', code: 'ROUND_NOT_ACTIVE' });
    }
    console.error('Vote error', error);
    res.status(500).json({ message: 'Failed to record vote' });
  }
});

export default router;
