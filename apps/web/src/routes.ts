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
  if (!frontendBaseUrl) return path;

  return new URL(path, `${frontendBaseUrl.replace(/\/$/, '')}/`).toString();
}
