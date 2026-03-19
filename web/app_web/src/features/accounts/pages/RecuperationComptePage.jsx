import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import { demanderReinitialisation } from "../services/authservice";

function RecuperationComptePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");

    try {
      await demanderReinitialisation(email);

      setMessage("Un code de vérification a été envoyé à votre adresse email.");

      navigate("/verificationCode", {
        state: { email },
      });
    } catch (error) {
      setErreur(error.message)
    }
  }

  return (
    <div>
      <Header />
      <SubHeader title="Récupération du compte" />

      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}>
        <form onSubmit={gererSoumission}>
          <div style={{ marginBottom: "15px" }}>
            <label>Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
              required
            />
          </div>

          {message && <p>{message}</p>}
          {erreur && <p style={{ color: "red" }}>{erreur}</p>}

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button type="submit">Envoyer le code</button>
            <button type="button" onClick={() => navigate("/login")}>
              Retour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecuperationComptePage;