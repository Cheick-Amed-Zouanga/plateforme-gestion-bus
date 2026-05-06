import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import { demanderReinitialisation } from "../services/authservice";
import { darkFormStyles } from "../../../shared/styles/darkTheme";

function RecuperationComptePage() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur]   = useState("");

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");
    try {
      await demanderReinitialisation(email);
      setMessage("Un code de vérification a été envoyé à votre adresse email.");
      navigate("/verificationCode", { state: { email } });
    } catch (error) {
      setErreur(error.message);
    }
  }

  return (
    <div style={s.page}>
      <Header />
      <SubHeader title="Récupération du compte" />
      <main style={s.main}>
        <div style={s.card}>
          <form onSubmit={gererSoumission}>
            <div style={s.group}>
              <label style={s.label}>Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={s.input}
                placeholder="votre@email.com"
                required
              />
            </div>
            {message && <div style={s.success}>{message}</div>}
            {erreur  && <div style={s.error}>{erreur}</div>}
            <div style={s.btnRow}>
              <button type="submit" style={s.btnSubmit}>Envoyer le code</button>
              <button type="button" style={s.btnBack} onClick={() => navigate("/login")}>Retour</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

const s = darkFormStyles();
export default RecuperationComptePage;
