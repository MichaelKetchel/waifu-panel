export const APP_ROUTES = {
  submission: '/',
  audience: '/vote',
  audienceAlias: '/audience',
  display: '/display',
  control: '/control'
} as const;

export type AppRouteKey = keyof typeof APP_ROUTES;

export function resolveFrontendRoute(route: AppRouteKey, frontendBaseUrl?: string) {
  const path = APP_ROUTES[route];
  const base = frontendBaseUrl ?? (typeof window !== 'undefined' ? window.location.origin : undefined);
  if (!base) return path;
  return new URL(path, `${base.replace(/\/$/, '')}/`).toString();
}
