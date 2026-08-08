import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../shared/components/dashboard";
import { creerChefCompagnie } from "../services/authservice";
import { darkFormStyles } from "../../../shared/styles/darkTheme";

const s = darkFormStyles();

function InscriptionChef() {
  const navigate = useNavigate();

  const [formulaire, setFormulaire] = useState({
    nom: "", prenom: "", nomCompagnie: "", email: "",
    tel: "", username: "", password: "", confirmationPassword: "",
    role: "chef_compagnie",
  });

  function gererChangement(e) {
    const { name, value } = e.target;
    setFormulaire((ancien) => ({ ...ancien, [name]: value }));
  }

  async function gererSoumission(e) {
    e.preventDefault();
    if (formulaire.password !== formulaire.confirmationPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }
    try {
      const data = await creerChefCompagnie(formulaire);
      alert(data.message);
      navigate("/admin");
    } catch (error) {
      alert(error.message);
    }
  }

  const champs = [
    { label: "Nom",                    name: "nom",                  type: "text"     },
    { label: "Prénom",                 name: "prenom",               type: "text"     },
    { label: "Nom de la compagnie",    name: "nomCompagnie",         type: "text"     },
    { label: "Email",                  name: "email",                type: "email"    },
    { label: "Téléphone",              name: "tel",                  type: "tel"      },
    { label: "Nom d'utilisateur",      name: "username",             type: "text"     },
    { label: "Mot de passe",           name: "password",             type: "password" },
    { label: "Confirmation du mot de passe", name: "confirmationPassword", type: "password" },
  ];

  return (
    <>
      <PageHeader
        title="Inscription chef de compagnie"
        subtitle="Crée le compte responsable et rattache une compagnie."
      />
      <div className="dash-form-wrap">
        <div style={s.card}>
          <form onSubmit={gererSoumission}>
            {champs.map(({ label, name, type }) => (
              <div key={name} style={s.group}>
                <label style={s.label}>{label}</label>
                <input
                  type={type}
                  name={name}
                  value={formulaire[name]}
                  onChange={gererChangement}
                  style={s.input}
                  required
                />
              </div>
            ))}
            <div style={s.btnRow}>
              <button type="submit" style={s.btnSubmit}>Créer le compte</button>
              <button type="button" style={s.btnBack} onClick={() => navigate("/admin")}>Retour</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default InscriptionChef;
