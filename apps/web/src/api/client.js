const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
export async function apiFetch(path, options = {}) {
    const { parseJson = true, headers, body, ...rest } = options;
    const isFormData = body instanceof FormData;
    const finalHeaders = new Headers(headers ?? {});
    if (!isFormData && body !== undefined && !finalHeaders.has('Content-Type')) {
        finalHeaders.set('Content-Type', 'application/json');
    }
    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: 'include',
        headers: finalHeaders,
        body,
        ...rest
    });
    if (!response.ok) {
        const errorBody = parseJson ? await response.json().catch(() => ({})) : null;
        const error = new Error(errorBody?.message ?? `Request failed with status ${response.status}`);
        error.status = response.status;
        error.body = errorBody;
        throw error;
    }
    if (!parseJson) {
        return undefined;
    }
    return (await response.json());
}
