const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

function _authHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function _clearSessionAndRedirect() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    localStorage.removeItem('company');
    localStorage.removeItem('is_super_admin');
    window.location.href = '/login';
}

async function apiFetch(url, options = {}) {
    const config = {
        ...options,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ..._authHeaders(), ...options.headers },
    };

    let res = await fetch(`${API_BASE_URL}${url}`, config);

    if (res.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');
        const refreshRes = refreshToken
            ? await fetch(`${API_BASE_URL}/iam/auth/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
            })
            : null;

        if (refreshRes && refreshRes.ok) {
            const { access } = await refreshRes.json();
            localStorage.setItem('access_token', access);
            res = await fetch(`${API_BASE_URL}${url}`, {
                ...config,
                headers: { ...config.headers, Authorization: `Bearer ${access}` },
            });
        } else {
            _clearSessionAndRedirect();
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