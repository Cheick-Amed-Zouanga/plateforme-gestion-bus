import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getConnectedProfile } from "../features/accounts/services/authservice";

function ProtectedRoute({ children, roles }) {
  const [etat, setEtat] = useState("chargement");

  useEffect(() => {
    async function verifier() {
      try {
        const profil = await getConnectedProfile();

        if (roles && !roles.includes(profil.role)) {
          setEtat("mauvais_role");
        } else {
          setEtat("autorise");
        }
      } catch {
        setEtat("refuse");
      }
    }

    verifier();
  }, [roles]);

  if (etat === "chargement") {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  if (etat === "refuse") {
    return <Navigate to="/login" replace />;
  }

  if (etat === "mauvais_role") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
