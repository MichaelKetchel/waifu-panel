const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
export async function apiFetch(path, options = {}) {
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
        error.status = response.status;
        error.body = errorBody;
        throw error;
    }
    if (!parseJson) {
        return undefined;
    }
    return (await response.json());
}
