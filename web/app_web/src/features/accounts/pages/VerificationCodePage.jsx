import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import { verifierCode } from "../services/authservice";
import { darkFormStyles } from "../../../shared/styles/darkTheme";

function VerificationCodePage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || "";
  const [code, setCode]     = useState("");
  const [erreur, setErreur] = useState("");

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur("");
    try {
      await verifierCode(email, code);
      navigate("/reinitialisationCompte", { state: { email, code } });
    } catch (error) {
      setErreur(error.message);
    }
  }

  return (
    <div style={s.page}>
      <Header />
      <SubHeader title="Vérification du code" />
      <main style={s.main}>
        <div style={s.card}>
          <form onSubmit={gererSoumission}>
            <div style={s.group}>
              <label style={s.label}>Email</label>
              <input type="email" value={email} readOnly style={s.inputReadonly} />
            </div>
            <div style={s.group}>
              <label style={s.label}>Code de vérification</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={s.input}
                placeholder="123456"
                required
              />
            </div>
            {erreur && <div style={s.error}>{erreur}</div>}
            <div style={s.btnRow}>
              <button type="submit" style={s.btnSubmit}>Vérifier le code</button>
              <button type="button" style={s.btnBack} onClick={() => navigate("/recuperationCompte")}>Retour</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

const s = darkFormStyles();
export default VerificationCodePage;
