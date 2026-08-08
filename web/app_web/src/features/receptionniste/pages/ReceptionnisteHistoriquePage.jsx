import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

const JOURS_OPTS = [
  { val: 30,  label: "30 derniers jours" },
  { val: 90,  label: "3 derniers mois" },
  { val: 180, label: "6 derniers mois" },
  { val: 365, label: "12 derniers mois" },
];

const SOURCE_LABEL = { APP: "En ligne", GUICHET: "Guichet" };

const STATUT_PAIEMENT_COLORS = {
  PAYE:       { color: "#56D364", bg: "#1B3A2D" },
  EN_ATTENTE: { color: "#F0883E", bg: "#2D1A0A" },
  REMBOURSE:  { color: "#6E7681", bg: "#21262D" },
};

function fmtDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ReceptionnisteHistoriquePage() {
  const navigate = useNavigate();
  const [jours, setJours] = useState(30);
  const [billets, setBillets] = useState([]);
  const [totalBillets, setTotalBillets] = useState(0);
  const [totalRecettes, setTotalRecettes] = useState(0);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(() => {
    setLoading(true);
    apiFetch(`/billets/historique/?jours=${jours}`)
      .then(d => {
        setBillets(d.billets ?? []);
        setTotalBillets(d.total_billets ?? 0);
        setTotalRecettes(d.total_recettes ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jours]);

  useEffect(() => { charger(); }, [charger]);

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Historique des ventes" />
      <main style={st.main}>
        <button style={st.btnBack} onClick={() => navigate("/receptionniste")}>← Tableau de bord</button>

        <div style={st.toolbar}>
          <h2 style={st.heading}>Mes ventes de billets</h2>
          <select style={st.selectJours} value={jours} onChange={e => setJours(Number(e.target.value))}>
            {JOURS_OPTS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
          </select>
        </div>

        <div style={st.statsRow}>
          <StatChip label="Billets vendus" value={totalBillets} color="#58A6FF" />
          <StatChip label="Encaissement total" value={`${totalRecettes.toLocaleString("fr-FR")} XOF`} color="#56D364" small />
        </div>

        <div style={st.card}>
          {loading ? (
            <p style={st.muted}>Chargement…</p>
          ) : billets.length === 0 ? (
            <p style={st.muted}>Aucun billet vendu sur cette période.</p>
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
                        <td style={st.td}>
                          <button
                            style={st.linkBtn}
                            onClick={() => navigate(`/receptionniste/billet/${b.numero_billet}`)}
                          >
                            {b.numero_billet}
                          </button>
                        </td>
                        <td style={st.td}>
                          <span style={{ color: "#E6EDF3", fontWeight: "600", display: "block" }}>{b.passager}</span>
                          {b.passager_telephone && (
                            <span style={{ fontSize: "11px", color: "#6E7681" }}>{b.passager_telephone}</span>
                          )}
                        </td>
                        <td style={st.td}>
                          <div style={{ fontSize: "12px", color: "#E6EDF3" }}>{b.ligne_display}</div>
                          <div style={{ fontSize: "11px", color: "#79C0FF" }}>
                            {b.arret_depart_ville} → {b.arret_arrivee_ville}
                          </div>
                          <div style={{ fontSize: "11px", color: "#6E7681" }}>{fmtDate(b.depart_prevu)}</div>
                        </td>
                        <td style={st.td}>
                          <span style={st.seatBadge}>{b.siege_numero ?? "—"}</span>
                        </td>
                        <td style={st.td}>
                          <span style={{ fontSize: "11px", backgroundColor: "#21262D", color: "#8B949E", padding: "2px 8px", borderRadius: "4px" }}>
                            {SOURCE_LABEL[b.source] ?? b.source}
                          </span>
                        </td>
                        <td style={st.td}>
                          <span style={{ fontWeight: "700", color: "#E6EDF3" }}>{b.prix?.toLocaleString("fr-FR")}</span>
                          <span style={{ color: "#6E7681", fontSize: "11px", marginLeft: "4px" }}>{b.devise}</span>
                        </td>
                        <td style={st.td}>
                          <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", backgroundColor: sp.bg, color: sp.color }}>
                            {b.statut_paiement_display ?? b.statut_paiement}
                          </span>
                        </td>
                        <td style={st.td}>
                          <span style={{ fontSize: "12px", color: "#6E7681" }}>
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
      </main>
    </div>
  );
}

function StatChip({ label, value, color, small }) {
  return (
    <div style={{ backgroundColor: "#161B22", borderRadius: "10px", padding: "16px 20px", borderTop: `3px solid ${color}`, flex: "1 1 200px" }}>
      <div style={{ fontSize: "11px", color: "#6E7681", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
      <div style={{ fontSize: small ? "16px" : "26px", fontWeight: "800", color, marginTop: "4px" }}>{value}</div>
    </div>
  );
}

const st = {
  page:       { minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" },
  main:       { maxWidth: "1200px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "16px" },
  btnBack:    { alignSelf: "flex-start", padding: "8px 16px", fontSize: "13px", fontWeight: "600", color: "#8B949E", backgroundColor: "transparent", border: "1.5px solid #30363D", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" },
  toolbar:    { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  heading:    { fontSize: "18px", fontWeight: "700", color: "#E6EDF3", margin: 0 },
  selectJours:{ padding: "7px 12px", backgroundColor: "#161B22", border: "1px solid #30363D", borderRadius: "8px", color: "#E6EDF3", fontSize: "13px", fontFamily: "inherit", cursor: "pointer" },
  statsRow:   { display: "flex", flexWrap: "wrap", gap: "12px" },
  card:       { backgroundColor: "#161B22", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  table:      { width: "100%", borderCollapse: "collapse", minWidth: "900px" },
  th:         { padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6E7681", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #21262D" },
  tr:         { borderBottom: "1px solid #21262D" },
  td:         { padding: "11px 12px", fontSize: "13px", color: "#C9D1D9", verticalAlign: "top" },
  seatBadge:  { backgroundColor: "#21262D", color: "#E6EDF3", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", fontFamily: "monospace" },
  muted:      { color: "#6E7681", fontSize: "13px", margin: 0 },
  linkBtn:    { background: "none", border: "none", color: "#79C0FF", fontFamily: "monospace", fontSize: "12px", cursor: "pointer", padding: 0, textDecoration: "underline" },
};
