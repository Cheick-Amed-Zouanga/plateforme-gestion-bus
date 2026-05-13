import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

export default function ChefBusPage() {
  const navigate = useNavigate();
  const [bus, setBus]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur]   = useState("");
  const [recherche, setRecherche] = useState("");
  const [actionId, setActionId]   = useState(null); // id du bus en cours d'action

  useEffect(() => {
    apiFetch("/transport/bus/")
      .then(setBus)
      .catch(e => setErreur(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function desactiverBus(b) {
    if (!window.confirm(`Désactiver le bus ${b.immatriculation} ?`)) return;
    setActionId(b.id);
    try {
      await apiFetch(`/transport/bus/${b.id}/`, { method: "DELETE" });
      setBus(prev => prev.map(x => x.id === b.id ? { ...x, actif: false } : x));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setActionId(null);
    }
  }

  const busFiltres = bus.filter(b =>
    b.immatriculation.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Flotte de bus" />
      <main style={st.main}>

        <button style={st.btnBack} onClick={() => navigate("/chef")}>← Tableau de bord</button>

        <div style={st.topBar}>
          <input
            style={st.search}
            placeholder="Rechercher par immatriculation…"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          <button style={st.btnAdd} onClick={() => navigate("/chef/bus/creer")}>
            + Ajouter un bus
          </button>
        </div>

        {erreur && <div style={st.erreur}>{erreur}</div>}

        <div style={st.card}>
          <table style={st.table}>
            <thead>
              <tr>
                {["Immatriculation", "Type", "Capacité", "Statut", "Actions"].map(h => (
                  <th key={h} style={st.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} style={st.empty}>Chargement…</td></tr>
              )}
              {!loading && busFiltres.length === 0 && (
                <tr><td colSpan={5} style={st.empty}>Aucun bus trouvé.</td></tr>
              )}
              {busFiltres.map(b => (
                <tr key={b.id} style={st.tr}>
                  <td style={st.td}><span style={st.immat}>{b.immatriculation}</span></td>
                  <td style={st.td}>
                    <span style={b.type_bus === "VIP" ? st.badgeVip : st.badgeStd}>
                      {b.type_bus_display}
                    </span>
                  </td>
                  <td style={st.td}>{b.capacite} places</td>
                  <td style={st.td}>
                    <span style={b.actif ? st.actif : st.inactif}>
                      {b.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td style={st.td}>
                    {b.actif && (
                      <button
                        style={{ ...st.btnAction, opacity: actionId === b.id ? 0.5 : 1 }}
                        onClick={() => desactiverBus(b)}
                        disabled={actionId === b.id}
                      >
                        Désactiver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}

const st = {
  page:      { minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" },
  main:      { maxWidth: "960px", margin: "0 auto", padding: "32px 20px" },
  topBar:    { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  search:    { flex: 1, minWidth: "200px", padding: "10px 14px", fontSize: "14px", borderRadius: "8px", border: "1.5px solid #30363D", backgroundColor: "#21262D", color: "#E6EDF3", outline: "none", fontFamily: "inherit" },
  btnAdd:    { padding: "10px 20px", fontSize: "14px", fontWeight: "700", color: "#fff", backgroundColor: "#009A44", border: "none", borderRadius: "8px", cursor: "pointer", whiteSpace: "nowrap" },
  erreur:    { padding: "12px 16px", backgroundColor: "#2D1117", color: "#FF7B72", borderRadius: "8px", fontSize: "14px", marginBottom: "16px" },
  card:      { backgroundColor: "#161B22", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" },
  table:     { width: "100%", borderCollapse: "collapse" },
  th:        { padding: "14px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#8B949E", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #30363D", backgroundColor: "#0D1117" },
  tr:        { borderBottom: "1px solid #21262D" },
  td:        { padding: "14px 16px", fontSize: "14px", color: "#E6EDF3" },
  empty:     { padding: "32px", textAlign: "center", color: "#6E7681", fontSize: "14px" },
  immat:     { fontFamily: "monospace", fontSize: "13px", color: "#79C0FF" },
  badgeVip:  { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#3D1F6B", color: "#D2A8FF" },
  badgeStd:  { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#1C3260", color: "#79C0FF" },
  actif:     { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#112D1F", color: "#56D364" },
  inactif:   { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#2D1117", color: "#FF7B72" },
  btnBack:   { marginBottom: "16px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", color: "#8B949E", backgroundColor: "transparent", border: "1.5px solid #30363D", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" },
  btnAction: { padding: "5px 12px", fontSize: "12px", fontWeight: "600", color: "#FF7B72", backgroundColor: "transparent", border: "1.5px solid #FF7B72", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
};
