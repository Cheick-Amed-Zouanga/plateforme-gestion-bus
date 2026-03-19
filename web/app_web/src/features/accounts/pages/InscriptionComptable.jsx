import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import { creerComptable } from "../services/authservice";

function InscriptionComptable() {
  const navigate = useNavigate();

  const [formulaire, setFormulaire] = useState({
    nom: "",
    prenom: "",
    email: "",
    tel:"",
    nomCompagnie:"",
    username: "",
    password: "",
    role: "comptable",
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

  const payload = {
    nom: formulaire.nom,
    prenom: formulaire.prenom,
    email: formulaire.email,
    tel: formulaire.tel,
    username: formulaire.username,
    password: formulaire.password,
    confirmationPassword: formulaire.confirmationPassword,
  };

  try {
    const data = await creerComptable(payload);
    alert(data.message);
    navigate("/admin");
  } catch (error) {
    alert(error.message);
  }
}

  return (
    <div>
      <Header />
      <SubHeader title="Inscription Comptable" />

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
            <label>Téléphone</label>
            <input
              type="text"
              name="nomCompagnie"
              value={formulaire.nomCompagnie}
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

          <div style={{ marginBottom: "20px" }}>
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

export default InscriptionComptable;