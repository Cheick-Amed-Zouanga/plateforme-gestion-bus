import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../../../shared/services/api";

const JOURS_OPTS = [
  { val: 30,  label: "30 derniers jours" },
  { val: 90,  label: "3 derniers mois" },
  { val: 180, label: "6 derniers mois" },
  { val: 365, label: "12 derniers mois" },
];

const STATUT_COLORS = {
  TERMINE: { bg: "#112D1F", color: "#26C2A1" },
  ANNULE:  { bg: "#2D1117", color: "#E11D48" },
};

const SOURCE_LABEL = { APP: "Application", GUICHET: "Guichet" };
const STATUT_PAIEMENT_COLORS = {
  PAYE:       { color: "#26C2A1", bg: "#1B3A2D" },
  EN_ATTENTE: { color: "#F0883E", bg: "#2D1A0A" },
  REMBOURSE:  { color: "#6B7280", bg: "#EEF2F7" },
};

function fmt(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ChefHistoriquePage() {
  const navigate = useNavigate();
  const [onglet, setOnglet]   = useState("trajets");  // "trajets" | "billets"
  const [jours,  setJours]    = useState(90);

  // Trajets
  const [trajets,       setTrajets]       = useState([]);
  const [totalTrajets,  setTotalTrajets]  = useState(0);
  const [totalRecettesTrajets, setTotalRecettesTrajets] = useState(0);
  const [loadingTrajets, setLoadingTrajets] = useState(false);

  // Billets
  const [billets,        setBillets]        = useState([]);
  const [totalBillets,   setTotalBillets]   = useState(0);
  const [totalRecettes,  setTotalRecettes]  = useState(0);
  const [loadingBillets, setLoadingBillets] = useState(false);

  const chargerTrajets = useCallback(() => {
    setLoadingTrajets(true);
    apiFetch(`/transport/historique/?jours=${jours}`)
      .then(d => {
        setTrajets(d.trajets ?? []);
        setTotalTrajets(d.total_trajets ?? 0);
        setTotalRecettesTrajets(d.total_recettes ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoadingTrajets(false));
  }, [jours]);

  const chargerBillets = useCallback(() => {
    setLoadingBillets(true);
    apiFetch(`/billets/historique/?jours=${jours}`)
      .then(d => {
        setBillets(d.billets ?? []);
        setTotalBillets(d.total_billets ?? 0);
        setTotalRecettes(d.total_recettes ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoadingBillets(false));
  }, [jours]);

  useEffect(() => { if (onglet === "trajets") chargerTrajets(); }, [onglet, chargerTrajets]);
  useEffect(() => { if (onglet === "billets") chargerBillets(); }, [onglet, chargerBillets]);

  return (
    <div style={st.page}>
      <main style={st.main}>
        <button style={st.btnBack} onClick={() => navigate("/chef")}>← Tableau de bord</button>

        {/* Barre de contrôle */}
        <div style={st.toolbar}>
          <div style={st.tabs}>
            <button style={{ ...st.tab, ...(onglet === "trajets" ? st.tabActif : {}) }} onClick={() => setOnglet("trajets")}>
              Trajets passés
            </button>
            <button style={{ ...st.tab, ...(onglet === "billets" ? st.tabActif : {}) }} onClick={() => setOnglet("billets")}>
              Réservations / Billets
            </button>
          </div>
          <select style={st.selectJours} value={jours} onChange={e => setJours(Number(e.target.value))}>
            {JOURS_OPTS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
          </select>
        </div>

        {/* ── ONGLET TRAJETS ── */}
        {onglet === "trajets" && (
          <>
            <div style={st.statsRow}>
              <StatChip label="Trajets effectués" value={totalTrajets}                                            color="#58A6FF" />
              <StatChip label="Recettes totales"  value={`${totalRecettesTrajets.toLocaleString("fr-FR")} XOF`}  color="#26C2A1" small />
            </div>
            <div style={st.card}>
              {loadingTrajets ? <p style={st.muted}>Chargement…</p> : trajets.length === 0 ? (
                <p style={st.muted}>Aucun trajet terminé ou annulé sur cette période.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={st.table}>
                    <thead>
                      <tr>
                        {["Ligne", "Bus", "Départ", "Arrivée", "Contrôleur", "Billets", "Taux occup.", "Recettes", "Statut"].map(h => (
                          <th key={h} style={st.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trajets.map(t => {
                        const c = STATUT_COLORS[t.statut] ?? { bg: "#EEF2F7", color: "#1A1348" };
                        const taux = t.taux_occupation ?? 0;
                        const tauxColor = taux >= 80 ? "#26C2A1" : taux >= 50 ? "#F0883E" : "#6B7280";
                        return (
                          <tr key={t.id} style={st.tr}>
                            <td style={st.td}>{t.ligne_display}</td>
                            <td style={st.td}><span style={st.mono}>{t.bus_display}</span></td>
                            <td style={st.td}>{fmt(t.depart_prevu)}</td>
                            <td style={st.td}>{fmt(t.arrivee_prevue)}</td>
                            <td style={st.td}>{t.controleur ?? <span style={{ color: "#6B7280" }}>—</span>}</td>
                            <td style={st.td}>{t.nb_billets} / {t.capacite}</td>
                            <td style={st.td}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{ width: "48px", height: "5px", backgroundColor: "#EEF2F7", borderRadius: "3px", overflow: "hidden" }}>
                                  <div style={{ width: `${taux}%`, height: "100%", backgroundColor: tauxColor }} />
                                </div>
                                <span style={{ fontSize: "12px", color: tauxColor, fontWeight: "600" }}>{taux}%</span>
                              </div>
                            </td>
                            <td style={st.td}>
                              <span style={{ fontWeight: "700", color: "#26C2A1" }}>
                                {t.recettes.toLocaleString("fr-FR")} <span style={{ color: "#6B7280", fontSize: "11px" }}>XOF</span>
                              </span>
                            </td>
                            <td style={st.td}>
                              <span style={{ ...st.badge, backgroundColor: c.bg, color: c.color }}>{t.statut_display}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── ONGLET BILLETS ── */}
        {onglet === "billets" && (
          <>
            <div style={st.statsRow}>
              <StatChip label="Billets émis"      value={totalBillets}                                    color="#58A6FF" />
              <StatChip label="Recettes encaissées" value={`${totalRecettes.toLocaleString("fr-FR")} XOF`} color="#26C2A1" small />
            </div>
            <div style={st.card}>
              {loadingBillets ? <p style={st.muted}>Chargement…</p> : billets.length === 0 ? (
                <p style={st.muted}>Aucune réservation sur cette période.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={st.table}>
                    <thead>
                      <tr>
                        {["N° Billet", "Passager", "Trajet / Segment", "Siège", "Source", "Prix", "Paiement", "Date émission"].map(h => (
                          <th key={h} style={st.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {billets.map(b => {
                        const sp = STATUT_PAIEMENT_COLORS[b.statut_paiement] ?? STATUT_PAIEMENT_COLORS.REMBOURSE;
                        return (
                          <tr key={b.id} style={st.tr}>
                            <td style={st.td}><span style={st.mono}>{b.numero_billet}</span></td>
                            <td style={st.td}>
                              <span style={{ color: "#1A1348", fontWeight: "600", display: "block" }}>{b.passager}</span>
                              {b.passager_telephone && <span style={{ fontSize: "11px", color: "#6B7280" }}>{b.passager_telephone}</span>}
                            </td>
                            <td style={st.td}>
                              <div style={{ fontSize: "12px", color: "#1A1348" }}>{b.ligne_display}</div>
                              <div style={{ fontSize: "11px", color: "#79C0FF" }}>{b.arret_depart_ville} → {b.arret_arrivee_ville}</div>
                              <div style={{ fontSize: "11px", color: "#6B7280" }}>{fmtDate(b.depart_prevu)}</div>
                            </td>
                            <td style={st.td}><span style={st.seatBadge}>{b.siege_numero ?? "—"}</span></td>
                            <td style={st.td}>
                              <span style={{ fontSize: "11px", backgroundColor: "#EEF2F7", color: "#6B7280", padding: "2px 8px", borderRadius: "4px" }}>
                                {SOURCE_LABEL[b.source] ?? b.source}
                              </span>
                            </td>
                            <td style={st.td}>
                              <span style={{ fontWeight: "700", color: "#1A1348" }}>{b.prix?.toLocaleString("fr-FR")}</span>
                              <span style={{ color: "#6B7280", fontSize: "11px", marginLeft: "4px" }}>{b.devise}</span>
                            </td>
                            <td style={st.td}>
                              <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", backgroundColor: sp.bg, color: sp.color }}>
                                {b.statut_paiement_display ?? b.statut_paiement}
                              </span>
                            </td>
                            <td style={st.td}>
                              <span style={{ fontSize: "12px", color: "#6B7280" }}>
                                {b.emis_le ? new Date(b.emis_le).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

      </main>
    </div>
  );
}

function StatChip({ label, value, color, small }) {
  return (
    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", padding: "16px 20px", borderTop: `3px solid ${color}`, flex: "1 1 200px" }}>
      <div style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
      <div style={{ fontSize: small ? "16px" : "26px", fontWeight: "800", color, marginTop: "4px" }}>{value}</div>
    </div>
  );
}

const st = {
  page:       { fontFamily: "'Poppins', 'Segoe UI', sans-serif" },
  main:       { maxWidth: "1200px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "16px" },
  btnBack:    { alignSelf: "flex-start", padding: "8px 16px", fontSize: "13px", fontWeight: "600", color: "#6B7280", backgroundColor: "transparent", border: "1.5px solid #E5E7EB", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" },
  toolbar:    { display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #EEF2F7", paddingBottom: "0" },
  tabs:       { display: "flex", gap: "4px" },
  tab:        { padding: "10px 22px", fontSize: "14px", fontWeight: "600", color: "#6B7280", backgroundColor: "transparent", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", fontFamily: "inherit", marginBottom: "-1px" },
  tabActif:   { color: "#1A1348", borderBottomColor: "#58A6FF" },
  selectJours:{ padding: "7px 12px", backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "8px", color: "#1A1348", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", marginBottom: "1px" },
  statsRow:   { display: "flex", flexWrap: "wrap", gap: "12px" },
  card:       { backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  table:      { width: "100%", borderCollapse: "collapse", minWidth: "900px" },
  th:         { padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #EEF2F7" },
  tr:         { borderBottom: "1px solid #EEF2F7" },
  td:         { padding: "11px 12px", fontSize: "13px", color: "#C9D1D9", verticalAlign: "top" },
  badge:      { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  mono:       { fontFamily: "monospace", fontSize: "12px", color: "#79C0FF" },
  seatBadge:  { backgroundColor: "#EEF2F7", color: "#1A1348", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", fontFamily: "monospace" },
  muted:      { color: "#6B7280", fontSize: "13px", margin: 0 },
};
