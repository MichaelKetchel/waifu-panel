import { describe, expect, it } from 'vitest';

import { resolveFrontendRoute } from '../routes';
import { createQrCode } from './qr';

describe('createQrCode', () => {
  it('generates a square QR matrix for an audience URL', () => {
    const qr = createQrCode(resolveFrontendRoute('audience', 'http://localhost:5173'));

    expect(qr).not.toBeNull();
    expect(qr?.modules).toHaveLength(qr?.size ?? 0);
    expect(qr?.modules.every((row) => row.length === qr.size)).toBe(true);
    expect(qr?.modules.flat().some(Boolean)).toBe(true);
  });

  it('returns null when the value exceeds the supported QR sizes', () => {
    const qr = createQrCode(`https://example.test/${'a'.repeat(200)}`);

    expect(qr).toBeNull();
  });
});
