import { Router as createRouter } from 'express';
import type { Router } from 'express';
import { z } from 'zod';

import { moderateCharacter } from '../services/moderationService.js';

const router: Router = createRouter();

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
    console.error('Moderation error', error);
    res.status(500).json({ message: 'Failed to update character status' });
  }
});

export default router;
