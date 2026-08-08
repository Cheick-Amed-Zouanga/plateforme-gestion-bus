import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import { reinitialiserCompte } from "../services/authservice";
import { darkFormStyles } from "../../../shared/styles/darkTheme";

function ReinitialisationComptePage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || "";
  const code      = location.state?.code  || "";

  const [nouveauUsername,      setNouveauUsername]      = useState("");
  const [nouveauPassword,      setNouveauPassword]      = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [erreur,  setErreur]  = useState("");
  const [message, setMessage] = useState("");

  function validerMotDePasse(mdp) {
    if (mdp.length < 7 || mdp.length > 20)          return "Le mot de passe doit contenir entre 7 et 20 caractères.";
    if (!/[A-Z]/.test(mdp))                          return "Le mot de passe doit contenir au moins une majuscule.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(mdp))        return "Le mot de passe doit contenir au moins un caractère spécial.";
    return null;
  }

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");
    const erreurMdp = validerMotDePasse(nouveauPassword);
    if (erreurMdp) { setErreur(erreurMdp); return; }
    if (nouveauPassword !== confirmationPassword) { setErreur("Les mots de passe ne correspondent pas."); return; }
    try {
      await reinitialiserCompte(email, code, nouveauUsername, nouveauPassword);
      setMessage("Vos identifiants ont été mis à jour avec succès.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setErreur(error.message);
    }
  }

  return (
    <div style={s.page}>
      <Header />
      <SubHeader title="Réinitialisation du compte" />
      <main style={s.main}>
        <div style={s.card}>
          <form onSubmit={gererSoumission}>
            <div style={s.group}>
              <label style={s.label}>Email</label>
              <input type="email" value={email} readOnly style={s.inputReadonly} />
            </div>
            <div style={s.group}>
              <label style={s.label}>Nouveau nom d'utilisateur</label>
              <input type="text" value={nouveauUsername} onChange={(e) => setNouveauUsername(e.target.value)} style={s.input} required />
            </div>
            <div style={s.group}>
              <label style={s.label}>Nouveau mot de passe</label>
              <input type="password" value={nouveauPassword} onChange={(e) => setNouveauPassword(e.target.value)} style={s.input} required />
            </div>
            <div style={s.group}>
              <label style={s.label}>Confirmer le mot de passe</label>
              <input type="password" value={confirmationPassword} onChange={(e) => setConfirmationPassword(e.target.value)} style={s.input} required />
            </div>
            {message && <div style={s.success}>{message}</div>}
            {erreur  && <div style={s.error}>{erreur}</div>}
            <div style={s.btnRow}>
              <button type="submit" style={s.btnSubmit}>Enregistrer</button>
              <button type="button" style={s.btnBack} onClick={() => navigate("/login")}>Annuler</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

const s = darkFormStyles();
export default ReinitialisationComptePage;
