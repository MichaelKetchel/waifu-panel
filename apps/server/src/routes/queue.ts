import { Router as createRouter } from 'express';
import type { Router } from 'express';

import { getQueueSnapshot } from '../services/queueService.js';

const router: Router = createRouter();

router.get('/', async (_req, res) => {
  const queue = await getQueueSnapshot();

  res.json({
    queue
  });
});

export default router;
