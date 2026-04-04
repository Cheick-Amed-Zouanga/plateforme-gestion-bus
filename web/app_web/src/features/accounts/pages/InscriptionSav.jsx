import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import { creerSav } from "../services/authservice";

function InscriptionSav() {
  const navigate = useNavigate();

  const [formulaire, setFormulaire] = useState({
    nom: "",
    prenom: "",
    email: "",
    tel:"",
    username: "",
    password: "",
    role: "sav",
    confirmationPassword: "",
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

  return (
    <div>
      <Header />
      <SubHeader title="Inscription Agent Service à la clientèle" />

      <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
        <form onSubmit={gererSoumission}>
          <div style={{ marginBottom: "15px" }}>
            <label>Nom</label>
            <input
              type="text"
              name="nom"
              value={formulaire.nom}
              onChange={gererChangement}
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
              required
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Prénom</label>
            <input
              type="text"
              name="prenom"
              value={formulaire.prenom}
              onChange={gererChangement}
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
              required
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formulaire.email}
              onChange={gererChangement}
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
              required
            />
          </div>

          
          <div style={{ marginBottom: "15px" }}>
            <label>Téléphone</label>
            <input
              type="tel"
              name="tel"
              value={formulaire.tel}
              onChange={gererChangement}
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
              required
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Nom d'utilisateur</label>
            <input
              type="text"
              name="username"
              value={formulaire.username}
              onChange={gererChangement}
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
              required
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Mot de passe</label>
            <input
              type="password"
              name="password"
              value={formulaire.password}
              onChange={gererChangement}
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
              required
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>Confirmation du mot de passe</label>
            <input
              type="password"
              name="confirmationPassword"
              value={formulaire.confirmationPassword}
              onChange={gererChangement}
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button type="submit">Créer le compte</button>
            <button type="button" onClick={() => navigate("/admin")}>
              Retour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InscriptionSav;