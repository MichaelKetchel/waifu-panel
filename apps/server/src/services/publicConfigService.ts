import type { Request } from 'express';
import type { PublicConfig } from '@waifu-panel/shared';

import { getSubmissionImageMaxBytes } from '../utils/constants.js';

const DEFAULT_PUBLIC_ORIGIN = `http://localhost:${process.env.PORT ?? 3000}`;

export function buildPublicConfig(req: Pick<Request, 'headers' | 'protocol' | 'secure'>): PublicConfig {
  const requestOrigin = getRequestOrigin(req) ?? DEFAULT_PUBLIC_ORIGIN;
  const frontendBaseUrl = cleanBaseUrl(process.env.PUBLIC_FRONTEND_URL) ?? requestOrigin;
  const backendBaseUrl = cleanBaseUrl(process.env.PUBLIC_BACKEND_URL) ?? cleanBaseUrl(process.env.PUBLIC_BASE_URL) ?? requestOrigin;

  return {
    frontendBaseUrl,
    backendBaseUrl,
    submissionImageMaxBytes: getSubmissionImageMaxBytes()
  };
}

function getRequestOrigin(req: Pick<Request, 'headers' | 'protocol' | 'secure'>) {
  const forwardedHost = firstHeaderValue(req.headers['x-forwarded-host']);
  const host = forwardedHost ?? firstHeaderValue(req.headers.host);
  if (!host) return null;

  const forwardedProto = firstHeaderValue(req.headers['x-forwarded-proto']);
  const protocol = forwardedProto ?? (req.secure ? 'https' : req.protocol || 'http');

  return `${protocol.toLowerCase()}://${host.toLowerCase()}`;
}

function firstHeaderValue(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.split(',')[0]?.trim() || undefined;
}

function cleanBaseUrl(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/$/, '') : undefined;
}
