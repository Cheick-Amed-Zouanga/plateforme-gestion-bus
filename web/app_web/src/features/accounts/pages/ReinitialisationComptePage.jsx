import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import { reinitialiserCompte } from "../services/authservice";

function ReinitialisationComptePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const code = location.state?.code || "";

  const [nouveauUsername, setNouveauUsername] = useState("");
  const [nouveauPassword, setNouveauPassword] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");

    if (nouveauPassword !== confirmationPassword) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      await reinitialiserCompte(email, code, nouveauUsername, nouveauPassword);

      setMessage("Vos identifiants ont été mis à jour avec succès.");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setErreur(error.message);
    }
  }

  return (
    <div>
      <Header />
      <SubHeader title="Réinitialisation du compte" />

      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}>
        <form onSubmit={gererSoumission}>
          <div style={{ marginBottom: "15px" }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              readOnly
              style={{ width: "100%", padding: "10px", marginTop: "5px", backgroundColor: "#f2f2f2" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Nouveau nom d'utilisateur</label>
            <input
              type="text"
              value={nouveauUsername}
              onChange={(e) => setNouveauUsername(e.target.value)}
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
              required
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              value={nouveauPassword}
              onChange={(e) => setNouveauPassword(e.target.value)}
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
              required
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmationPassword}
              onChange={(e) => setConfirmationPassword(e.target.value)}
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
              required
            />
          </div>

          {message && <p style={{ color: "green" }}>{message}</p>}
          {erreur && <p style={{ color: "red" }}>{erreur}</p>}

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button type="submit">Enregistrer les changements</button>
            <button type="button" onClick={() => navigate("/login")}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReinitialisationComptePage;