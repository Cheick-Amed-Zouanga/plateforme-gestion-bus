import { Navigate } from "react-router-dom";

/**
 * Garde d'authentification pour le nouveau système multi-tenant (IAM).
 * Vérifie la présence du token JWT dans localStorage (posé par LoginPage
 * via POST /api/token/), distinct de l'ancien système par cookies.
 */
function RequireIamAuth({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default RequireIamAuth;
