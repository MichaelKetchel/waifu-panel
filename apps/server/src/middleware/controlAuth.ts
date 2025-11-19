import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const CONTROL_COOKIE = 'control_session';

function computeToken() {
  const passcode = process.env.CONTROL_PASSCODE ?? '';
  const sessionSecret = process.env.SESSION_SECRET ?? 'waifu-panel';
  return crypto.createHash('sha256').update(`${passcode}:${sessionSecret}`).digest('hex');
}

export function hasValidControlSession(req: Request) {
  const token = req.cookies[CONTROL_COOKIE];
  if (!token || !process.env.CONTROL_PASSCODE) return false;
  return token === computeToken();
}

export function setControlSession(res: Response) {
  res.cookie(CONTROL_COOKIE, computeToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 30
  });
}

export function clearControlSession(res: Response) {
  res.clearCookie(CONTROL_COOKIE);
}

export function requireControlAuth(req: Request, res: Response, next: NextFunction) {
  if (!process.env.CONTROL_PASSCODE) {
    return res.status(500).json({ message: 'CONTROL_PASSCODE not configured' });
  }

  if (hasValidControlSession(req)) {
    return next();
  }

  return res.status(401).json({ message: 'Control authentication required' });
}
