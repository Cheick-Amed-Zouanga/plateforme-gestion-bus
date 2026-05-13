import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

export default function ChefTarifsPage() {
  const navigate = useNavigate();
  const [tarifs, setTarifs]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [erreur, setErreur]     = useState("");
  const [actionId, setActionId] = useState(null);
  const [editPrix, setEditPrix] = useState({});

  useEffect(() => {
    apiFetch("/transport/tarifs/")
      .then(setTarifs)
      .catch(e => setErreur(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function modifierPrix(t, prix) {
    setActionId(t.id);
    try {
      await apiFetch(`/transport/tarifs/${t.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ prix: Number(prix) }),
      });
      setTarifs(prev => prev.map(x => x.id === t.id ? { ...x, prix: Number(prix) } : x));
      setEditPrix(p => ({ ...p, [t.id]: undefined }));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setActionId(null);
    }
  }

  async function supprimerTarif(t) {
    const label = `${t.arret_depart_ville} → ${t.arret_arrivee_ville} / ${t.type_bus_display}`;
    if (!window.confirm(`Supprimer le tarif ${label} ?`)) return;
    setActionId(t.id);
    try {
      await apiFetch(`/transport/tarifs/${t.id}/`, { method: "DELETE" });
      setTarifs(prev => prev.filter(x => x.id !== t.id));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Tarifs" />
      <main style={st.main}>

        <button style={st.btnBack} onClick={() => navigate("/chef")}>← Tableau de bord</button>

        <div style={st.topBar}>
          <p style={st.count}>{tarifs.length} tarif(s) défini(s)</p>
          <button style={st.btnAdd} onClick={() => navigate("/chef/tarifs/creer")}>
            + Définir un tarif
          </button>
        </div>

        {erreur && <div style={st.erreur}>{erreur}</div>}

        <div style={st.card}>
          <table style={st.table}>
            <thead>
              <tr>
                {["Ligne", "Segment", "Type de bus", "Prix", "Devise", "Actions"].map(h => (
                  <th key={h} style={st.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} style={st.empty}>Chargement…</td></tr>}
              {!loading && tarifs.length === 0 && (
                <tr><td colSpan={6} style={st.empty}>Aucun tarif défini.</td></tr>
              )}
              {tarifs.map(t => {
                const en_cours = actionId === t.id;
                const nvPrix   = editPrix[t.id];
                return (
                  <tr key={t.id} style={st.tr}>
                    <td style={st.td}>{t.ligne_display}</td>
                    <td style={st.td}>
                      <span style={st.segment}>
                        {t.arret_depart_ville} → {t.arret_arrivee_ville}
                      </span>
                    </td>
                    <td style={st.td}>
                      <span style={t.type_bus === "VIP" ? st.badgeVip : st.badgeStd}>
                        {t.type_bus_display}
                      </span>
                    </td>
                    <td style={st.td}>
                      {nvPrix !== undefined ? (
                        <span style={st.prixEdit}>
                          <input
                            style={st.inputPrix}
                            type="number"
                            min={0}
                            value={nvPrix}
                            onChange={e => setEditPrix(p => ({ ...p, [t.id]: e.target.value }))}
                          />
                          <button style={st.btnOk} onClick={() => modifierPrix(t, nvPrix)} disabled={en_cours}>✓</button>
                          <button style={st.btnAnnuler} onClick={() => setEditPrix(p => ({ ...p, [t.id]: undefined }))}>✕</button>
                        </span>
                      ) : (
                        <strong style={st.prix}>{t.prix.toLocaleString("fr-FR")}</strong>
                      )}
                    </td>
                    <td style={st.td}>{t.devise}</td>
                    <td style={st.td}>
                      <div style={st.actions}>
                        {nvPrix === undefined && (
                          <button style={st.btnModif}
                            onClick={() => setEditPrix(p => ({ ...p, [t.id]: t.prix }))}>
                            Modifier prix
                          </button>
                        )}
                        <button
                          style={{ ...st.btnDanger, opacity: en_cours ? 0.5 : 1 }}
                          onClick={() => supprimerTarif(t)}
                          disabled={en_cours}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}

const st = {
  page:      { minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" },
  main:      { maxWidth: "1050px", margin: "0 auto", padding: "32px 20px" },
  topBar:    { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" },
  count:     { fontSize: "14px", color: "#8B949E", margin: 0 },
  btnAdd:    { padding: "10px 20px", fontSize: "14px", fontWeight: "700", color: "#fff", backgroundColor: "#009A44", border: "none", borderRadius: "8px", cursor: "pointer" },
  erreur:    { padding: "12px 16px", backgroundColor: "#2D1117", color: "#FF7B72", borderRadius: "8px", fontSize: "14px", marginBottom: "16px" },
  card:      { backgroundColor: "#161B22", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" },
  table:     { width: "100%", borderCollapse: "collapse" },
  th:        { padding: "14px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#8B949E", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #30363D", backgroundColor: "#0D1117" },
  tr:        { borderBottom: "1px solid #21262D" },
  td:        { padding: "14px 16px", fontSize: "14px", color: "#E6EDF3" },
  empty:     { padding: "32px", textAlign: "center", color: "#6E7681", fontSize: "14px" },
  segment:   { fontWeight: "600", color: "#79C0FF" },
  badgeVip:  { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#3D1F6B", color: "#D2A8FF" },
  badgeStd:  { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#1C3260", color: "#79C0FF" },
  prix:      { color: "#F0883E", fontWeight: "700" },
  btnBack:   { marginBottom: "16px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", color: "#8B949E", backgroundColor: "transparent", border: "1.5px solid #30363D", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" },
  actions:   { display: "flex", gap: "6px", alignItems: "center" },
  btnModif:  { padding: "4px 10px", fontSize: "12px", fontWeight: "600", color: "#79C0FF", backgroundColor: "transparent", border: "1.5px solid #1C3260", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  btnDanger: { padding: "4px 10px", fontSize: "12px", fontWeight: "600", color: "#FF7B72", backgroundColor: "transparent", border: "1.5px solid #FF7B72", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  prixEdit:  { display: "flex", alignItems: "center", gap: "4px" },
  inputPrix: { width: "90px", padding: "3px 8px", fontSize: "13px", borderRadius: "4px", border: "1px solid #30363D", backgroundColor: "#0D1117", color: "#E6EDF3", outline: "none", fontFamily: "inherit" },
  btnOk:     { padding: "3px 8px", fontSize: "12px", fontWeight: "700", color: "#56D364", backgroundColor: "transparent", border: "1px solid #56D364", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" },
  btnAnnuler:{ padding: "3px 8px", fontSize: "12px", fontWeight: "700", color: "#8B949E", backgroundColor: "transparent", border: "1px solid #30363D", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" },
};
