import { describe, expect, it } from 'vitest';

import { APP_ROUTES, resolveFrontendRoute } from './routes';

describe('frontend route resolver', () => {
  it('returns relative routes for React Router', () => {
    expect(resolveFrontendRoute('audience')).toBe(APP_ROUTES.audience);
  });

  it('builds absolute public URLs for generated links', () => {
    expect(resolveFrontendRoute('audience', 'https://panel.example.test/')).toBe('https://panel.example.test/vote');
  });
});
