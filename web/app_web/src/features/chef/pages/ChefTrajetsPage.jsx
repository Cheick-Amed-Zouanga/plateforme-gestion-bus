import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

const STATUT_COLORS = {
  PLANIFIE: { bg: "#1C3260", color: "#79C0FF" },
  EN_COURS: { bg: "#2D1F00", color: "#F0883E" },
  TERMINE:  { bg: "#112D1F", color: "#56D364" },
  ANNULE:   { bg: "#2D1117", color: "#FF7B72" },
};

const STATUTS = [
  { val: "PLANIFIE", label: "Planifié" },
  { val: "EN_COURS", label: "En cours" },
  { val: "TERMINE",  label: "Terminé" },
  { val: "ANNULE",   label: "Annulé" },
];

function fmt(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ChefTrajetsPage() {
  const navigate = useNavigate();
  const [trajets, setTrajets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [erreur, setErreur]     = useState("");
  const [filtre, setFiltre]     = useState("TOUS");
  const [actionId, setActionId] = useState(null);
  const [editStatut, setEditStatut] = useState({}); // { [id]: newStatut }

  useEffect(() => {
    apiFetch("/transport/trajets/")
      .then(setTrajets)
      .catch(e => setErreur(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function changerStatut(t, statut) {
    setActionId(t.id);
    try {
      await apiFetch(`/transport/trajets/${t.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ statut }),
      });
      setTrajets(prev => prev.map(x => x.id === t.id ? { ...x, statut, statut_display: STATUTS.find(s => s.val === statut)?.label ?? statut } : x));
      setEditStatut(p => ({ ...p, [t.id]: undefined }));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setActionId(null);
    }
  }

  async function supprimerTrajet(t) {
    if (!window.confirm(`Supprimer ce trajet (${t.ligne_display}) ?`)) return;
    setActionId(t.id);
    try {
      await apiFetch(`/transport/trajets/${t.id}/`, { method: "DELETE" });
      setTrajets(prev => prev.filter(x => x.id !== t.id));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setActionId(null);
    }
  }

  const trajetsFiltres = filtre === "TOUS" ? trajets : trajets.filter(t => t.statut === filtre);

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Trajets" />
      <main style={st.main}>

        <button style={st.btnBack} onClick={() => navigate("/chef")}>← Tableau de bord</button>

        <div style={st.topBar}>
          <div style={st.filtres}>
            <button style={{ ...st.filtrBtn, ...(filtre === "TOUS" ? st.filtrActif : {}) }} onClick={() => setFiltre("TOUS")}>
              Tous ({trajets.length})
            </button>
            {STATUTS.map(f => {
              const count = trajets.filter(t => t.statut === f.val).length;
              return (
                <button key={f.val} style={{ ...st.filtrBtn, ...(filtre === f.val ? st.filtrActif : {}) }} onClick={() => setFiltre(f.val)}>
                  {f.label} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
          <button style={st.btnAdd} onClick={() => navigate("/chef/trajets/creer")}>
            + Nouveau trajet
          </button>
        </div>

        {erreur && <div style={st.erreur}>{erreur}</div>}

        <div style={st.card}>
          <table style={st.table}>
            <thead>
              <tr>
                {["Ligne", "Bus", "Départ prévu", "Arrivée prévue", "Statut", "Actions"].map(h => (
                  <th key={h} style={st.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} style={st.empty}>Chargement…</td></tr>}
              {!loading && trajetsFiltres.length === 0 && (
                <tr><td colSpan={6} style={st.empty}>Aucun trajet pour ce filtre.</td></tr>
              )}
              {trajetsFiltres.map(t => {
                const c = STATUT_COLORS[t.statut] ?? { bg: "#21262D", color: "#E6EDF3" };
                const en_cours = actionId === t.id;
                const nouveauStatut = editStatut[t.id];
                return (
                  <tr key={t.id} style={st.tr}>
                    <td style={st.td}>{t.ligne_display}</td>
                    <td style={st.td}><span style={st.immat}>{t.bus_display}</span></td>
                    <td style={st.td}>{fmt(t.depart_prevu)}</td>
                    <td style={st.td}>{fmt(t.arrivee_prevue)}</td>
                    <td style={st.td}>
                      <span style={{ ...st.badge, backgroundColor: c.bg, color: c.color }}>
                        {t.statut_display}
                      </span>
                    </td>
                    <td style={st.td}>
                      <div style={st.actions}>
                        {/* Sélecteur de statut */}
                        {t.statut !== "TERMINE" && t.statut !== "ANNULE" && (
                          nouveauStatut !== undefined ? (
                            <span style={st.statutEdit}>
                              <select
                                style={st.selectStatut}
                                value={nouveauStatut}
                                onChange={e => setEditStatut(p => ({ ...p, [t.id]: e.target.value }))}
                              >
                                {STATUTS.filter(s => s.val !== t.statut).map(s => (
                                  <option key={s.val} value={s.val}>{s.label}</option>
                                ))}
                              </select>
                              <button style={st.btnOk} onClick={() => changerStatut(t, nouveauStatut)} disabled={en_cours}>✓</button>
                              <button style={st.btnAnnuler} onClick={() => setEditStatut(p => ({ ...p, [t.id]: undefined }))}>✕</button>
                            </span>
                          ) : (
                            <button style={st.btnModif} onClick={() => setEditStatut(p => ({ ...p, [t.id]: STATUTS.find(s => s.val !== t.statut)?.val }))}>
                              Statut
                            </button>
                          )
                        )}
                        {/* Supprimer (sauf EN_COURS) */}
                        {t.statut !== "EN_COURS" && (
                          <button style={{ ...st.btnDanger, opacity: en_cours ? 0.5 : 1 }} onClick={() => supprimerTrajet(t)} disabled={en_cours}>
                            Supprimer
                          </button>
                        )}
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
  main:       { maxWidth: "1200px", margin: "0 auto", padding: "32px 20px" },
  topBar:     { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" },
  filtres:    { display: "flex", gap: "6px", flexWrap: "wrap" },
  filtrBtn:   { padding: "6px 12px", fontSize: "12px", fontWeight: "600", color: "#8B949E", backgroundColor: "#161B22", border: "1.5px solid #30363D", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  filtrActif: { backgroundColor: "#21262D", color: "#E6EDF3", borderColor: "#58A6FF" },
  btnAdd:     { padding: "10px 20px", fontSize: "14px", fontWeight: "700", color: "#fff", backgroundColor: "#009A44", border: "none", borderRadius: "8px", cursor: "pointer", whiteSpace: "nowrap" },
  erreur:     { padding: "12px 16px", backgroundColor: "#2D1117", color: "#FF7B72", borderRadius: "8px", fontSize: "14px", marginBottom: "16px" },
  card:       { backgroundColor: "#161B22", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { padding: "14px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#8B949E", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #30363D", backgroundColor: "#0D1117" },
  tr:         { borderBottom: "1px solid #21262D" },
  td:         { padding: "12px 16px", fontSize: "13px", color: "#E6EDF3" },
  empty:      { padding: "32px", textAlign: "center", color: "#6E7681", fontSize: "14px" },
  immat:      { fontFamily: "monospace", fontSize: "13px", color: "#79C0FF" },
  badge:      { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  btnBack:    { marginBottom: "16px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", color: "#8B949E", backgroundColor: "transparent", border: "1.5px solid #30363D", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" },
  actions:    { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" },
  btnModif:   { padding: "4px 10px", fontSize: "12px", fontWeight: "600", color: "#79C0FF", backgroundColor: "transparent", border: "1.5px solid #1C3260", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  btnDanger:  { padding: "4px 10px", fontSize: "12px", fontWeight: "600", color: "#FF7B72", backgroundColor: "transparent", border: "1.5px solid #FF7B72", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  statutEdit: { display: "flex", alignItems: "center", gap: "4px" },
  selectStatut: { padding: "3px 6px", fontSize: "12px", borderRadius: "4px", border: "1px solid #30363D", backgroundColor: "#0D1117", color: "#E6EDF3", outline: "none", fontFamily: "inherit" },
  btnOk:      { padding: "3px 8px", fontSize: "12px", fontWeight: "700", color: "#56D364", backgroundColor: "transparent", border: "1px solid #56D364", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" },
  btnAnnuler: { padding: "3px 8px", fontSize: "12px", fontWeight: "700", color: "#8B949E", backgroundColor: "transparent", border: "1px solid #30363D", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" },
};
