import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getConnectedProfile } from "../features/accounts/services/authservice";

function ProtectedRoute({ children }) {
  const [etat, setEtat] = useState("chargement");

  useEffect(() => {
    async function verifier() {
      try {
        await getConnectedProfile();
        setEtat("autorise");
      } catch {
        setEtat("refuse");
      }
    }

    verifier();
  }, []);

  if (etat === "chargement") {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  if (etat === "refuse") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;