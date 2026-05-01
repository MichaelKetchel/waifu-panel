import { Router as createRouter } from 'express';
import type { Router } from 'express';
import { z } from 'zod';

import { moderateCharacter } from '../services/moderationService.js';
import { requireControlAuth } from '../middleware/controlAuth.js';

const router: Router = createRouter();

router.use(requireControlAuth);

const moderationSchema = z.object({
  action: z.enum(['approve', 'reject', 'skip']),
  reason: z.string().optional()
});

router.post('/:characterId', async (req, res) => {
  const parseResult = moderationSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid moderation payload', issues: parseResult.error.issues });
  }

  try {
    const character = await moderateCharacter(req.params.characterId, parseResult.data.action, parseResult.data.reason);
    res.json({
      message: 'Moderation applied',
      characterId: character.id,
      status: character.status
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: 'Character not found', code: 'CHARACTER_NOT_FOUND' });
    }

    console.error('Moderation error', error);
    return res.status(500).json({ message: 'Failed to update character status' });
  }
});

export default router;
