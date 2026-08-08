import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default function ChefLignesPage() {
  const navigate = useNavigate();
  const [lignes, setLignes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur]   = useState("");
  const [actionId, setActionId] = useState(null);
  const [editNom, setEditNom]   = useState({}); // { [id]: valeur }

  useEffect(() => {
    apiFetch("/transport/lignes/")
      .then(setLignes)
      .catch(e => setErreur(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function desactiverLigne(l) {
    if (!window.confirm(`Désactiver la ligne "${l.nom}" ?`)) return;
    setActionId(l.id);
    try {
      await apiFetch(`/transport/lignes/${l.id}/desactiver/`, { method: "POST" });
      setLignes(prev => prev.map(x => x.id === l.id ? { ...x, active: false } : x));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setActionId(null);
    }
  }

  async function supprimerLigne(l) {
    if (!window.confirm(`Supprimer définitivement la ligne "${l.nom}" ?\nCette action est irréversible.`)) return;
    setActionId(l.id);
    try {
      await apiFetch(`/transport/lignes/${l.id}/`, { method: "DELETE" });
      setLignes(prev => prev.filter(x => x.id !== l.id));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setActionId(null);
    }
  }

  async function modifierNom(l, nom) {
    if (!nom.trim()) return;
    setActionId(l.id);
    try {
      await apiFetch(`/transport/lignes/${l.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ nom: nom.trim() }),
      });
      setLignes(prev => prev.map(x => x.id === l.id ? { ...x, nom: nom.trim() } : x));
      setEditNom(p => ({ ...p, [l.id]: undefined }));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Mes lignes" />
      <main style={st.main}>

        <button style={st.btnBack} onClick={() => navigate("/chef")}>← Tableau de bord</button>

        <div style={st.topBar}>
          <p style={st.count}>{lignes.length} ligne(s)</p>
          <button style={st.btnAdd} onClick={() => navigate("/chef/lignes/creer")}>
            + Créer une ligne
          </button>
        </div>

        {erreur && <div style={st.erreur}>{erreur}</div>}

        <div style={st.card}>
          <table style={st.table}>
            <thead>
              <tr>
                {["Code", "Nom", "Itinéraire", "Arrêts", "Créée le", "Statut", "Actions"].map(h => (
                  <th key={h} style={st.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={st.empty}>Chargement…</td></tr>}
              {!loading && lignes.length === 0 && (
                <tr><td colSpan={7} style={st.empty}>Aucune ligne créée.</td></tr>
              )}
              {lignes.map(l => {
                const en_cours  = actionId === l.id;
                const nvNom     = editNom[l.id];
                return (
                  <tr key={l.id} style={st.tr}>
                    <td style={st.td}><span style={st.code}>{l.code}</span></td>
                    <td style={st.td}>
                      {nvNom !== undefined ? (
                        <span style={st.nomEdit}>
                          <input
                            style={st.inputNom}
                            value={nvNom}
                            onChange={e => setEditNom(p => ({ ...p, [l.id]: e.target.value }))}
                            autoFocus
                          />
                          <button style={st.btnOk} onClick={() => modifierNom(l, nvNom)} disabled={en_cours}>✓</button>
                          <button style={st.btnAnnuler} onClick={() => setEditNom(p => ({ ...p, [l.id]: undefined }))}>✕</button>
                        </span>
                      ) : (
                        l.nom
                      )}
                    </td>
                    <td style={st.td}>
                      {l.depart && l.arrivee
                        ? <span style={st.itineraire}>{l.depart} → {l.arrivee}</span>
                        : <span style={st.vide}>—</span>}
                    </td>
                    <td style={st.td}>{l.nb_arrets}</td>
                    <td style={st.td}>{fmtDate(l.date_creation)}</td>
                    <td style={st.td}>
                      <span style={l.active ? st.actif : st.inactif}>
                        {l.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={st.td}>
                      <div style={st.actions}>
                        {nvNom === undefined && (
                          <button style={st.btnModif}
                            onClick={() => setEditNom(p => ({ ...p, [l.id]: l.nom }))}>
                            Renommer
                          </button>
                        )}
                        {l.active && (
                          <button style={{ ...st.btnWarn, opacity: en_cours ? 0.5 : 1 }}
                            onClick={() => desactiverLigne(l)} disabled={en_cours}>
                            Désactiver
                          </button>
                        )}
                        <button style={{ ...st.btnDanger, opacity: en_cours ? 0.5 : 1 }}
                          onClick={() => supprimerLigne(l)} disabled={en_cours}>
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
  page:       { minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" },
  main:       { maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" },
  btnBack:    { marginBottom: "16px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", color: "#8B949E", backgroundColor: "transparent", border: "1.5px solid #30363D", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" },
  topBar:     { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" },
  count:      { fontSize: "14px", color: "#8B949E", margin: 0 },
  btnAdd:     { padding: "10px 20px", fontSize: "14px", fontWeight: "700", color: "#fff", backgroundColor: "#0E7490", border: "none", borderRadius: "8px", cursor: "pointer" },
  erreur:     { padding: "12px 16px", backgroundColor: "#2D1117", color: "#FF7B72", borderRadius: "8px", fontSize: "14px", marginBottom: "16px" },
  card:       { backgroundColor: "#161B22", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { padding: "14px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#8B949E", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #30363D", backgroundColor: "#0D1117" },
  tr:         { borderBottom: "1px solid #21262D" },
  td:         { padding: "12px 16px", fontSize: "13px", color: "#E6EDF3" },
  empty:      { padding: "32px", textAlign: "center", color: "#6E7681", fontSize: "14px" },
  code:       { fontFamily: "monospace", fontSize: "13px", color: "#79C0FF", backgroundColor: "#1C2A3A", padding: "2px 8px", borderRadius: "4px" },
  itineraire: { color: "#C9D1D9", fontSize: "13px" },
  vide:       { color: "#6E7681" },
  actif:      { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#112D1F", color: "#56D364" },
  inactif:    { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#2D1117", color: "#FF7B72" },
  actions:    { display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" },
  btnModif:   { padding: "3px 8px", fontSize: "11px", fontWeight: "600", color: "#79C0FF", backgroundColor: "transparent", border: "1px solid #1C3260", borderRadius: "5px", cursor: "pointer", fontFamily: "inherit" },
  btnWarn:    { padding: "3px 8px", fontSize: "11px", fontWeight: "600", color: "#F0883E", backgroundColor: "transparent", border: "1px solid #F0883E", borderRadius: "5px", cursor: "pointer", fontFamily: "inherit" },
  btnDanger:  { padding: "3px 8px", fontSize: "11px", fontWeight: "600", color: "#FF7B72", backgroundColor: "transparent", border: "1px solid #FF7B72", borderRadius: "5px", cursor: "pointer", fontFamily: "inherit" },
  nomEdit:    { display: "flex", alignItems: "center", gap: "4px" },
  inputNom:   { padding: "3px 8px", fontSize: "13px", borderRadius: "4px", border: "1px solid #30363D", backgroundColor: "#0D1117", color: "#E6EDF3", outline: "none", fontFamily: "inherit", width: "140px" },
  btnOk:      { padding: "3px 8px", fontSize: "12px", fontWeight: "700", color: "#56D364", backgroundColor: "transparent", border: "1px solid #56D364", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" },
  btnAnnuler: { padding: "3px 8px", fontSize: "12px", fontWeight: "700", color: "#8B949E", backgroundColor: "transparent", border: "1px solid #30363D", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" },
};
