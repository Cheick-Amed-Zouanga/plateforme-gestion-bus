import { apiFetch } from "../../../shared/services/api";

export async function loginUser(credentials) {
  return apiFetch("/accounts/connexion/", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function getConnectedProfile() {
  // Nouveau système multi-tenant (IAM) : /iam/auth/me/ renvoie
  // { user, company, is_super_admin, permissions, role } où `role` est déjà
  // mappé vers les constantes legacy (ADMIN_PLATEFORME, CHEF_COMPAGNIE...)
  // consommées par ProtectedRoute.
  const data = await apiFetch("/iam/auth/me/");
  return { ...data.user, role: data.role, company: data.company };
}

export async function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("username");
  localStorage.removeItem("company");
  localStorage.removeItem("is_super_admin");
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
