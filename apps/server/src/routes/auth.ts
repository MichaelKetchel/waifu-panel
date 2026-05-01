import { Router as createRouter } from 'express';
import type { Router } from 'express';
import { z } from 'zod';

import { clearControlSession, hasValidControlSession, setControlSession } from '../middleware/controlAuth.js';

const router: Router = createRouter();

router.get('/control', (req, res) => {
  res.json({ authenticated: hasValidControlSession(req) });
});

const loginSchema = z.object({
  passcode: z.string().min(1)
});

router.post('/control', (req, res) => {
  const controlPasscode = process.env.CONTROL_PASSCODE?.trim();

  if (!controlPasscode) {
    return res.status(500).json({ message: 'CONTROL_PASSCODE not configured' });
  }

  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Passcode required' });
  }

  if (parseResult.data.passcode !== controlPasscode) {
    return res.status(401).json({ authenticated: false });
  }

  setControlSession(res);
  res.json({ authenticated: true });
});

router.delete('/control', (req, res) => {
  clearControlSession(res);
  res.json({ authenticated: false });
});

export default router;
