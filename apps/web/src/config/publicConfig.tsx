import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PublicConfig } from '@waifu-panel/shared';

import { resolveFrontendRoute, type AppRouteKey } from '../routes';

const DEFAULT_DEV_FRONTEND_BASE_URL = 'http://localhost:5173';
const DEFAULT_DEV_BACKEND_BASE_URL = 'http://localhost:3000';
const DEFAULT_SUBMISSION_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const CONFIG_ENDPOINT = cleanBaseUrl(import.meta.env.VITE_CONFIG_URL)?.replace(/\/$/, '') ?? '/api/config/public';

const PublicConfigContext = createContext<PublicConfig | null>(null);
let currentConfig: PublicConfig | null = null;

interface PublicConfigState {
  config: PublicConfig | null;
  error: string | null;
}

export function PublicConfigProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PublicConfigState>({ config: currentConfig, error: null });

  useEffect(() => {
    let cancelled = false;

    loadPublicConfig()
      .then((config) => {
        if (!cancelled) setState({ config, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ config: null, error: error instanceof Error ? error.message : 'Failed to load configuration' });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.error) {
    return (
      <div className="app-shell">
        <main>
          <section className="card">
            <h2>Unable to load panel configuration</h2>
            <p className="muted">{state.error}</p>
          </section>
        </main>
      </div>
    );
  }

  if (!state.config) {
    return (
      <div className="app-shell">
        <main>
          <section className="card">
            <h2>Loading panel configuration</h2>
          </section>
        </main>
      </div>
    );
  }

  return <PublicConfigContext.Provider value={state.config}>{children}</PublicConfigContext.Provider>;
}

export function usePublicConfig() {
  const config = useContext(PublicConfigContext);
  if (!config) {
    throw new Error('PublicConfigProvider is required');
  }
  return config;
}

export async function loadPublicConfig() {
  const response = await fetch(CONFIG_ENDPOINT, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Configuration request failed with status ${response.status}`);
  }

  const config = normalizePublicConfig((await response.json()) as PublicConfig);
  currentConfig = config;
  return config;
}

export function getPublicConfig() {
  if (currentConfig) return currentConfig;

  currentConfig = createFallbackConfig();
  return currentConfig;
}

export function getBackendBaseUrl() {
  return getPublicConfig().backendBaseUrl;
}

export function getSocketBaseUrl() {
  return getPublicConfig().backendBaseUrl;
}

export function getFrontendBaseUrl() {
  return getPublicConfig().frontendBaseUrl;
}

export function getFrontendUrl(route: AppRouteKey) {
  return resolveFrontendRoute(route, getPublicConfig().frontendBaseUrl);
}

function normalizePublicConfig(config: PublicConfig): PublicConfig {
  const frontendBaseUrl = cleanBaseUrl(config.frontendBaseUrl) ?? DEFAULT_DEV_FRONTEND_BASE_URL;
  const configuredBackend = cleanBaseUrl(config.backendBaseUrl) ?? DEFAULT_DEV_BACKEND_BASE_URL;
  // If the configured backend is cross-origin from the current page, use the current
  // origin instead so requests route through the dev proxy and cookies stay same-origin.
  const pageOrigin = getBrowserOrigin();
  const backendBaseUrl =
    pageOrigin && isCrossOrigin(configuredBackend, pageOrigin) ? pageOrigin : configuredBackend;
  const submissionImageMaxBytes =
    Number.isFinite(config.submissionImageMaxBytes) && config.submissionImageMaxBytes > 0
      ? config.submissionImageMaxBytes
      : DEFAULT_SUBMISSION_IMAGE_MAX_BYTES;

  return {
    frontendBaseUrl,
    backendBaseUrl,
    submissionImageMaxBytes
  };
}

function createFallbackConfig(): PublicConfig {
  const frontendBaseUrl = cleanBaseUrl(getBrowserOrigin()) ?? DEFAULT_DEV_FRONTEND_BASE_URL;
  const backendBaseUrl = frontendBaseUrl || DEFAULT_DEV_BACKEND_BASE_URL;

  return {
    frontendBaseUrl,
    backendBaseUrl,
    submissionImageMaxBytes: DEFAULT_SUBMISSION_IMAGE_MAX_BYTES
  };
}

function getBrowserOrigin() {
  if (typeof window === 'undefined') return undefined;
  return window.location.origin;
}

function cleanBaseUrl(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/$/, '') : undefined;
}

function isCrossOrigin(url: string, pageOrigin: string) {
  try {
    return new URL(url).origin !== pageOrigin;
  } catch {
    return false;
  }
}
