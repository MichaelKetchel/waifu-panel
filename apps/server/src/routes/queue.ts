import { Router as createRouter } from 'express';
import type { Router } from 'express';
import { z } from 'zod';

import { requireControlAuth } from '../middleware/controlAuth.js';
import { queueService } from '../services/queueService.js';

const router: Router = createRouter();

const moveQueueItemSchema = z.object({
  position: z.number().int().min(1)
});

router.get('/', async (_req, res) => {
  const queue = await queueService.snapshot();

  res.json({
    queue
  });
});

router.patch('/:characterId', requireControlAuth, async (req, res) => {
  const parseResult = moveQueueItemSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid queue move payload', issues: parseResult.error.issues });
  }

  try {
    const queue = await queueService.updatePosition(req.params.characterId, parseResult.data.position);
    return res.json({
      message: 'Queue position updated',
      queue
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'NOT_IN_QUEUE') {
      return res.status(404).json({ message: 'Character not in queue', code: 'NOT_IN_QUEUE' });
    }

    console.error('Queue move error', error);
    return res.status(500).json({ message: 'Failed to move queue item' });
  }
});

export default router;
