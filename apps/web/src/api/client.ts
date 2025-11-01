const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

interface RequestOptions extends RequestInit {
  parseJson?: boolean;
}

export async function apiFetch<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const { parseJson = true, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {})
    },
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
