import API_BASE_URL from "../../../shared/services/api";

async function lireReponse(response) {
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

export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/accounts/connexion/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  return lireReponse(response);
}

export async function getConnectedProfile() {
  const response = await fetch(`${API_BASE_URL}/accounts/me/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return lireReponse(response);
}

export async function logoutUser() {
  const response = await fetch(`${API_BASE_URL}/accounts/deconnexion/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return lireReponse(response);
}

export async function creerChefCompagnie(payload) {
  const response = await fetch(`${API_BASE_URL}/accounts/chefs/creer/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return lireReponse(response);
}

export async function creerSav(payload) {
  const response = await fetch(`${API_BASE_URL}/accounts/sav/creer/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return lireReponse(response);
}

export async function creerComptable(payload) {
  const response = await fetch(`${API_BASE_URL}/accounts/comptables/creer/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return lireReponse(response);
}

export async function modifierEmployePlateforme(payload) {
  const response = await fetch(`${API_BASE_URL}/accounts/plateforme/employes/modifier/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return lireReponse(response);
}

export async function desactiverEmployePlateforme(payload) {
  const response = await fetch(`${API_BASE_URL}/accounts/plateforme/employes/desactiver/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return lireReponse(response);
}

/* Ces 3 fonctions ne marcheront que quand tu auras créé le backend associé */
export async function demanderReinitialisation(email) {
  const response = await fetch(`${API_BASE_URL}/accounts/demande-reinitialisation/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  return lireReponse(response);
}

export async function verifierCode(email, code) {
  const response = await fetch(`${API_BASE_URL}/accounts/verifier-code/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  return lireReponse(response);
}

export async function reinitialiserCompte(email, code, nouveauUsername, nouveauPassword) {
  const response = await fetch(`${API_BASE_URL}/accounts/reinitialiser-compte/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      code,
      nouveau_username: nouveauUsername,
      nouveau_password: nouveauPassword,
    }),
  });

  return lireReponse(response);
}