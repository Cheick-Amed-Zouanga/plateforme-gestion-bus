import { apiFetch } from "../../../shared/services/api";

export async function loginUser(credentials) {
  return apiFetch("/accounts/connexion/", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function getConnectedProfile() {
  return apiFetch("/accounts/me/");
}

export async function logoutUser() {
  return apiFetch("/accounts/deconnexion/", { method: "POST" });
}

export async function creerChefCompagnie(payload) {
  return apiFetch("/accounts/chefs/creer/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function creerSav(payload) {
  return apiFetch("/accounts/sav/creer/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function creerComptable(payload) {
  return apiFetch("/accounts/comptables/creer/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function modifierEmployePlateforme(payload) {
  return apiFetch("/accounts/plateforme/employes/modifier/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function desactiverEmployePlateforme(payload) {
  return apiFetch("/accounts/plateforme/employes/desactiver/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function demanderReinitialisation(email) {
  return apiFetch("/accounts/demande-reinitialisation/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifierCode(email, code) {
  return apiFetch("/accounts/verifier-code/", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function reinitialiserCompte(email, code, nouveauUsername, nouveauPassword) {
  return apiFetch("/accounts/reinitialiser-compte/", {
    method: "POST",
    body: JSON.stringify({
      email,
      code,
      nouveau_username: nouveauUsername,
      nouveau_password: nouveauPassword,
    }),
  });
}
