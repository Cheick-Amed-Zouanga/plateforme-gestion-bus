import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { desactiverEmployePlateforme } from "../features/accounts/services/authservice";

function DesactivationEmploye({ titre }) {
  const navigate = useNavigate();
  const [usernameRecherche, setUsernameRecherche] = useState("");

  async function gererSoumission(e) {
    e.preventDefault();

    try {
      const data = await desactiverEmployePlateforme({ usernameRecherche });
      alert(data.message);
      navigate("/admin");
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h3>{titre}</h3>

      <form onSubmit={gererSoumission}>
        <div style={{ marginBottom: "15px" }}>
          <label>Nom d'utilisateur de l'employé à désactiver</label>
          <input
            type="text"
            value={usernameRecherche}
            onChange={(e) => setUsernameRecherche(e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: "5px" }}
            required
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button type="submit">Désactiver le compte</button>
          <button type="button" onClick={() => navigate("/admin")}>
            Retour
          </button>
        </div>
      </form>
    </div>
  );
}

export default DesactivationEmploye;