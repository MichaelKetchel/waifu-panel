import { Router as createRouter } from 'express';
import type { Response, Router } from 'express';
import { z } from 'zod';

import { endRound, startRound, getCurrentRound, skipRound } from '../services/roundService.js';
import { requireControlAuth } from '../middleware/controlAuth.js';

const router: Router = createRouter();

const startRoundSchema = z.object({
  characterId: z.string().uuid(),
  mode: z.enum(['yn', 'scale']).default('yn'),
  scale: z
    .object({
      min: z.number().int().min(1),
      max: z.number().int().max(10)
    })
    .optional()
});

router.post('/start', requireControlAuth, async (req, res) => {
  const parseResult = startRoundSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid start round payload', issues: parseResult.error.issues });
  }

  try {
    const { characterId, mode, scale } = parseResult.data;
    const round = await startRound({ characterId, mode, scale });

    res.json({
      message: 'Round started',
      round
    });
  } catch (error) {
    console.error('Start round error', error);
    return handleRoundError(res, error, 'Failed to start round');
  }
});

const endRoundSchema = z.object({
  roundId: z.string().uuid()
});

router.post('/end', requireControlAuth, async (req, res) => {
  const parseResult = endRoundSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid end round payload', issues: parseResult.error.issues });
  }

  try {
    const { round, tallies } = await endRound(parseResult.data.roundId);

    res.json({
      message: 'Round ended',
      roundId: round.id,
      tallies
    });
  } catch (error) {
    console.error('End round error', error);
    return handleRoundError(res, error, 'Failed to end round');
  }
});

router.post('/skip', requireControlAuth, async (req, res) => {
  const parseResult = endRoundSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid skip payload', issues: parseResult.error.issues });
  }

  try {
    const { round, tallies, discardedVotes } = await skipRound(parseResult.data.roundId);

    res.json({
      message: 'Round skipped',
      roundId: round.id,
      tallies,
      discardedVotes
    });
  } catch (error) {
    console.error('Skip round error', error);
    return handleRoundError(res, error, 'Failed to skip round');
  }
});

router.get('/current', async (_req, res) => {
  try {
    const round = await getCurrentRound();
    res.json({ round });
  } catch (error) {
    console.error('Fetch current round error', error);
    res.status(500).json({ message: 'Failed to fetch current round' });
  }
});

export default router;

function handleRoundError(res: Response, error: unknown, fallbackMessage: string) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : undefined;

  switch (code) {
    case 'CHARACTER_NOT_FOUND':
    case 'ROUND_NOT_FOUND':
      return res.status(404).json({ message: code === 'CHARACTER_NOT_FOUND' ? 'Character not found' : 'Round not found', code });
    case 'CHARACTER_NOT_APPROVED':
      return res.status(409).json({ message: 'Character must be approved before starting a round', code });
    case 'CHARACTER_ALREADY_USED':
      return res.status(409).json({ message: 'Character already has a round', code });
    case 'ROUND_IN_PROGRESS':
      return res.status(409).json({ message: 'A round is already active', code });
    case 'ROUND_NOT_ACTIVE':
      return res.status(409).json({ message: 'Round is not active', code });
    default:
      return res.status(500).json({ message: fallbackMessage });
  }
}
