import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { modifierEmployePlateforme } from "../features/accounts/services/authservice";
import { darkFormStyles } from "../shared/styles/darkTheme";

const s = darkFormStyles();

function ModificationEmploye({ titre }) {
  const navigate = useNavigate();

  const [formulaire, setFormulaire] = useState({
    usernameRecherche: "", nom: "", prenom: "", email: "", tel: "",
  });

  function gererChangement(e) {
    const { name, value } = e.target;
    setFormulaire((ancien) => ({ ...ancien, [name]: value }));
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

  const champs = [
    { label: "Nom d'utilisateur de l'employé à modifier", name: "usernameRecherche", required: true  },
    { label: "Nouveau nom",       name: "nom",    required: false },
    { label: "Nouveau prénom",    name: "prenom", required: false },
    { label: "Nouvel email",      name: "email",  required: false, type: "email" },
    { label: "Nouveau téléphone", name: "tel",    required: false, type: "tel"   },
  ];

  return (
    <main style={s.main}>
      <div style={s.card}>
        <form onSubmit={gererSoumission}>
          {champs.map(({ label, name, required, type = "text" }) => (
            <div key={name} style={s.group}>
              <label style={s.label}>{label}</label>
              <input
                type={type}
                name={name}
                value={formulaire[name]}
                onChange={gererChangement}
                style={s.input}
                required={required}
              />
            </div>
          ))}
          <div style={s.btnRow}>
            <button type="submit" style={s.btnSubmit}>Enregistrer les modifications</button>
            <button type="button" style={s.btnBack} onClick={() => navigate("/admin")}>Retour</button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default ModificationEmploye;
