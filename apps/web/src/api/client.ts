import { getBackendBaseUrl } from '../config/publicConfig';

interface RequestOptions extends RequestInit {
  parseJson?: boolean;
}

export async function apiFetch<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const { parseJson = true, headers, body, ...rest } = options;
  const isFormData = body instanceof FormData;

  const finalHeaders = new Headers(headers ?? {});

  if (!isFormData && body !== undefined && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    credentials: 'include',
    headers: finalHeaders,
    body,
    ...rest
  });

  if (!response.ok) {
    const errorBody = parseJson ? await response.json().catch(() => ({})) : null;
    const error = new Error(errorBody?.message ?? `Request failed with status ${response.status}`);
    (error as any).status = response.status;
    (error as any).body = errorBody;
    throw error;
  }

  if (!parseJson) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
