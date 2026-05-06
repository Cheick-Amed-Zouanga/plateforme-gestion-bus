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
        throw new Error(data.message || data.detail || 'Une erreur est survenue.');
    }

    return data;
}

export { API_BASE_URL, apiFetch };
export default apiFetch;