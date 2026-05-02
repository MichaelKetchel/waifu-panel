import { afterEach, describe, expect, it } from 'vitest';

import { buildPublicConfig } from '../publicConfigService.js';

const originalEnv = {
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL,
  PUBLIC_BACKEND_URL: process.env.PUBLIC_BACKEND_URL,
  PUBLIC_FRONTEND_URL: process.env.PUBLIC_FRONTEND_URL
};

afterEach(() => {
  restoreEnv('PUBLIC_BASE_URL', originalEnv.PUBLIC_BASE_URL);
  restoreEnv('PUBLIC_BACKEND_URL', originalEnv.PUBLIC_BACKEND_URL);
  restoreEnv('PUBLIC_FRONTEND_URL', originalEnv.PUBLIC_FRONTEND_URL);
});

describe('buildPublicConfig', () => {
  it('defaults public URLs to the request origin', () => {
    const config = buildPublicConfig({
      headers: { host: 'Panel-Host.local:3000' },
      protocol: 'http',
      secure: false
    });

    expect(config).toEqual({
      frontendBaseUrl: 'http://panel-host.local:3000',
      backendBaseUrl: 'http://panel-host.local:3000'
    });
  });

  it('honors public frontend and backend overrides', () => {
    process.env.PUBLIC_FRONTEND_URL = 'https://vote.example.test/';
    process.env.PUBLIC_BACKEND_URL = 'https://api.example.test/';

    const config = buildPublicConfig({
      headers: { host: 'internal.local:3000' },
      protocol: 'http',
      secure: false
    });

    expect(config).toMatchObject({
      frontendBaseUrl: 'https://vote.example.test',
      backendBaseUrl: 'https://api.example.test'
    });
  });

  it('uses forwarded host and proto when a reverse proxy provides them', () => {
    const config = buildPublicConfig({
      headers: {
        host: 'internal.local:3000',
        'x-forwarded-host': 'Panel.example.test',
        'x-forwarded-proto': 'https'
      },
      protocol: 'http',
      secure: false
    });

    expect(config.frontendBaseUrl).toBe('https://panel.example.test');
    expect(config.backendBaseUrl).toBe('https://panel.example.test');
  });
});

function restoreEnv(key: keyof typeof originalEnv, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
