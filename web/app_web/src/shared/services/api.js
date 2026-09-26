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
    localStorage.removeItem('permissions');
    window.location.href = '/login';
}

/** Un seul refresh à la fois — évite d'invalider le refresh rotatif. */
let _refreshPromise = null;

async function _refreshAccessToken() {
    if (_refreshPromise) return _refreshPromise;

    _refreshPromise = (async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return null;

        const endpoints = [
            '/iam/auth/refresh/',
            '/accounts/token/refresh/',
        ];

        for (const path of endpoints) {
            try {
                const refreshRes = await fetch(`${API_BASE_URL}${path}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Pas de credentials ici : évite qu'un cookie refresh expiré parasite le body
                    body: JSON.stringify({ refresh: refreshToken }),
                });
                if (!refreshRes.ok) continue;

                const data = await refreshRes.json();
                if (!data.access) continue;

                localStorage.setItem('access_token', data.access);
                // CRITICAL : avec ROTATE_REFRESH_TOKENS, le nouveau refresh doit être sauvegardé
                if (data.refresh) {
                    localStorage.setItem('refresh_token', data.refresh);
                }
                return data.access;
            } catch (_) {
                // essayer l'endpoint suivant
            }
        }
        return null;
    })().finally(() => {
        _refreshPromise = null;
    });

    return _refreshPromise;
}

async function apiFetch(url, options = {}) {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = { ..._authHeaders(), ...options.headers };
    // Laisser le navigateur poser le boundary multipart
    if (isFormData) {
        delete headers['Content-Type'];
    } else if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        credentials: 'include',
        headers,
    };

    let res = await fetch(`${API_BASE_URL}${url}`, config);

    if (res.status === 401) {
        // Ne pas tenter de refresh sur les endpoints d'auth eux-mêmes
        const isAuthUrl = url.includes('/auth/') || url.includes('/connexion/') || url.includes('/token/');
        if (!isAuthUrl) {
            const newAccess = await _refreshAccessToken();
            if (newAccess) {
                res = await fetch(`${API_BASE_URL}${url}`, {
                    ...config,
                    headers: { ...headers, Authorization: `Bearer ${newAccess}` },
                });
            } else {
                _clearSessionAndRedirect();
                throw new Error('Session expirée. Veuillez vous reconnecter.');
            }
        } else {
            _clearSessionAndRedirect();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
    }

    // DELETE / 204 : pas de JSON
    if (res.status === 204) return null;

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
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
