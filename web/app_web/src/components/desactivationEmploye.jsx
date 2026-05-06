import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { desactiverEmployePlateforme } from "../features/accounts/services/authservice";
import { darkFormStyles } from "../shared/styles/darkTheme";

const s = darkFormStyles();

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
    <main style={s.main}>
      <div style={s.card}>
        <form onSubmit={gererSoumission}>
          <div style={s.group}>
            <label style={s.label}>Nom d'utilisateur de l'employé à désactiver</label>
            <input
              type="text"
              value={usernameRecherche}
              onChange={(e) => setUsernameRecherche(e.target.value)}
              style={s.input}
              placeholder="username"
              required
            />
          </div>
          <div style={s.btnRow}>
            <button type="submit" style={{ ...s.btnSubmit, backgroundColor: "#C41E3A" }}>
              Désactiver le compte
            </button>
            <button type="button" style={s.btnBack} onClick={() => navigate("/admin")}>
              Retour
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default DesactivationEmploye;
