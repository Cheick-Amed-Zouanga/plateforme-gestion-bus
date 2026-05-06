import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import { creerSav } from "../services/authservice";
import { darkFormStyles } from "../../../shared/styles/darkTheme";

const s = darkFormStyles();

function InscriptionSav() {
  const navigate = useNavigate();

  const [formulaire, setFormulaire] = useState({
    nom: "", prenom: "", email: "", tel: "",
    username: "", password: "", confirmationPassword: "",
    role: "sav",
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
      const data = await creerSav(formulaire);
      alert(data.message);
      navigate("/admin");
    } catch (error) {
      alert(error.message);
    }
  }

  const champs = [
    { label: "Nom",                          name: "nom",                  type: "text"     },
    { label: "Prénom",                       name: "prenom",               type: "text"     },
    { label: "Email",                        name: "email",                type: "email"    },
    { label: "Téléphone",                    name: "tel",                  type: "tel"      },
    { label: "Nom d'utilisateur",            name: "username",             type: "text"     },
    { label: "Mot de passe",                 name: "password",             type: "password" },
    { label: "Confirmation du mot de passe", name: "confirmationPassword", type: "password" },
  ];

  return (
    <div style={s.page}>
      <Header />
      <SubHeader title="Inscription Agent Service à la clientèle" />
      <main style={s.main}>
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
      </main>
    </div>
  );
}

export default InscriptionSav;
