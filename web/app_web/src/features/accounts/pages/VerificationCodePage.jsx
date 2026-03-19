import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import { verifierCode } from "../services/authservice";

function VerificationCodePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur("");

    try {
      await verifierCode(email, code);

      navigate("/reinitialisationCompte", {
        state: { email, code },
      });
    } catch (error) {
      setErreur(error.message);
    }
  }

  return (
    <div>
      <Header />
      <SubHeader title="Vérification du code" />

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
            <label>Code de vérification</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
              required
            />
          </div>

          {erreur && <p style={{ color: "red" }}>{erreur}</p>}

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button type="submit">Vérifier le code</button>
            <button type="button" onClick={() => navigate("/recuperation-compte")}>
              Retour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VerificationCodePage;