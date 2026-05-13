const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

async function apiFetch(url, options = {}) {
    const config = {
        ...options,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers },
    };

    let res = await fetch(`${API_BASE_URL}${url}`, config);

    if (res.status === 401) {
        const refreshRes = await fetch(`${API_BASE_URL}/accounts/token/refresh/`, {
            method: 'POST',
            credentials: 'include',
        });

        if (refreshRes.ok) {
            res = await fetch(`${API_BASE_URL}${url}`, config);
        } else {
            window.location.href = '/login';
            return;
        }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        // Try to extract a readable message from DRF error formats
        const msg = data.message
            || data.detail
            || (typeof data === 'object' ? _extractDrfError(data) : null)
            || 'Une erreur est survenue.';
        throw new Error(msg);
    }

    return data;
}

function _extractDrfError(data) {
    // DRF validation errors: { field: ["msg"] } or { non_field_errors: ["msg"] }
    const keys = Object.keys(data);
    if (!keys.length) return null;
    const first = data[keys[0]];
    if (Array.isArray(first) && first.length) return first[0];
    if (typeof first === 'string') return first;
    return null;
}

export { API_BASE_URL, apiFetch };
export default apiFetch;