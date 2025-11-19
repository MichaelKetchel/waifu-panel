import { Router as createRouter } from 'express';
import type { Router } from 'express';

import { queueService } from '../services/queueService.js';

const router: Router = createRouter();

router.get('/', async (_req, res) => {
  const queue = await queueService.snapshot();

  res.json({
    queue
  });
});

export default router;
