const API_BASE_URL = "http://localhost:8000/api";
export default API_BASE_URL;

const METHODES_AVEC_CSRF = ["POST", "PUT", "PATCH", "DELETE"];

function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function initialiserCsrf() {
  await fetch(`${API_BASE_URL}/accounts/csrf/`, {
    method: "GET",
    credentials: "include",
  });
}

export async function apiFetch(chemin, options = {}) {
  const methode = (options.method || "GET").toUpperCase();
  const needsCsrf = METHODES_AVEC_CSRF.includes(methode);

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(needsCsrf ? { "X-CSRFToken": getCsrfToken() } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${chemin}`, {
    ...options,
    method: methode,
    headers,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.detail ||
        Object.values(data)[0]?.[0] ||
        "Une erreur est survenue."
    );
  }

  return data;
}
