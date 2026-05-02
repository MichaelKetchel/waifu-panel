import { Router, type Router as ExpressRouter } from 'express';

import { buildPublicConfig } from '../services/publicConfigService.js';

const router: ExpressRouter = Router();

router.get('/public', (req, res) => {
  res.json(buildPublicConfig(req));
});

export default router;
