import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { modifierEmployePlateforme } from "../features/accounts/services/authservice";

function ModificationEmploye({ titre }) {
  const navigate = useNavigate();

  const [formulaire, setFormulaire] = useState({
    usernameRecherche: "",
    nom: "",
    prenom: "",
    email: "",
    tel: "",
  });

  function gererChangement(e) {
    const { name, value } = e.target;
    setFormulaire((ancien) => ({
      ...ancien,
      [name]: value,
    }));
  }

  async function gererSoumission(e) {
    e.preventDefault();

    try {
      const data = await modifierEmployePlateforme(formulaire);
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
          <label>Nom d'utilisateur de l'employé à modifier</label>
          <input
            type="text"
            name="usernameRecherche"
            value={formulaire.usernameRecherche}
            onChange={gererChangement}
            style={{ width: "100%", padding: "10px", marginTop: "5px" }}
            required
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Nouveau nom</label>
          <input
            type="text"
            name="nom"
            value={formulaire.nom}
            onChange={gererChangement}
            style={{ width: "100%", padding: "10px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Nouveau prénom</label>
          <input
            type="text"
            name="prenom"
            value={formulaire.prenom}
            onChange={gererChangement}
            style={{ width: "100%", padding: "10px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Nouvel email</label>
          <input
            type="email"
            name="email"
            value={formulaire.email}
            onChange={gererChangement}
            style={{ width: "100%", padding: "10px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Nouveau téléphone</label>
          <input
            type="tel"
            name="tel"
            value={formulaire.tel}
            onChange={gererChangement}
            style={{ width: "100%", padding: "10px", marginTop: "5px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button type="submit">Enregistrer les modifications</button>
          <button type="button" onClick={() => navigate("/admin")}>
            Retour
          </button>
        </div>
      </form>
    </div>
  );
}

export default ModificationEmploye;