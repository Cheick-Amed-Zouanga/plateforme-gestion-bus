import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

const STATUT = {
  PLANIFIE: { label: "Planifié",  bg: "#1B2A3B", color: "#58A6FF" },
  EN_COURS: { label: "En cours",  bg: "#1B3A2D", color: "#56D364" },
  TERMINE:  { label: "Terminé",   bg: "#21262D", color: "#6E7681" },
  ANNULE:   { label: "Annulé",    bg: "#2D1117", color: "#FF7B72" },
};

function BadgeStatut({ s }) {
  const m = STATUT[s] ?? STATUT.PLANIFIE;
  return <span style={{ ...st.badge, backgroundColor: m.bg, color: m.color }}>{m.label}</span>;
}

export default function ReceptionnisteHomePage() {
  const navigate  = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/billets/dashboard/")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats   = data?.stats   ?? { billets_auj: 0, encaissement: 0, trajets_auj: 0, en_attente_paiement: 0, commandes_en_ligne_attente: 0 };
  const trajets = data?.trajets ?? [];
  const alertes = data?.alertes ?? [];

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Tableau de bord — Réceptionniste" />
      <main style={st.main}>

        {/* Raccourcis */}
        <section style={st.shortcuts}>
          <Btn label="Vendre un billet"        onClick={() => navigate("/receptionniste/vente")}     color="#009A44" />
          <BtnBadge
            label="Commandes en ligne"
            badge={loading ? null : stats.commandes_en_ligne_attente}
            onClick={() => navigate("/receptionniste/commandes")}
            color="#E67E22"
          />
          <Btn label="Chercher une réservation" onClick={() => navigate("/receptionniste/recherche")}  color="#1B6CA8" />
          <Btn label="Liste des passagers"      onClick={() => navigate("/receptionniste/passagers")}  color="#6E3FAA" />
          <Btn label="Historique des ventes"    onClick={() => navigate("/receptionniste/historique")} color="#21262D" />
        </section>

        {/* Stats */}
        <section style={st.statsRow}>
          <StatCard label="Billets vendus auj." value={loading ? "…" : stats.billets_auj}           color="#009A44" />
          <StatCard label="Encaissement auj."   value={loading ? "…" : `${stats.encaissement.toLocaleString("fr-FR")} XOF`} color="#F0883E" small />
          <StatCard label="Trajets aujourd'hui" value={loading ? "…" : stats.trajets_auj}            color="#58A6FF" />
          <StatCard label="En attente paiement" value={loading ? "…" : stats.en_attente_paiement}    color="#E67E22" />
        </section>

        {/* Alertes */}
        {alertes.length > 0 && (
          <div style={st.alertesBox}>
            {alertes.map((a, i) => (
              <div key={i} style={st.alerte}>
                <span style={st.alerteIcon}>{a.type === 'occupation' ? '🚌' : '💳'}</span>
                <span style={st.alerteMsg}>{a.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Trajets disponibles */}
        <div style={st.card}>
          <h3 style={st.cardTitle}>Trajets disponibles — 30 prochains jours</h3>
          {loading ? <p style={st.empty}>Chargement…</p> : trajets.length === 0 ? (
            <p style={st.empty}>Aucun trajet disponible pour les 30 prochains jours.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={st.table}>
                <thead>
                  <tr>{["Date", "Bus", "Ligne", "Départ", "Contrôleur", "Vendus / Cap.", "Taux", "Statut", ""].map(h => (
                    <th key={h} style={st.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {trajets.map(t => (
                    <tr key={t.id} style={{ ...st.tr, ...(t.est_aujourd_hui ? { backgroundColor: "#0D1F17" } : {}) }}>
                      <td style={st.td}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: t.est_aujourd_hui ? "#56D364" : "#8B949E" }}>
                          {t.est_aujourd_hui ? "Aujourd'hui" : t.date}
                        </span>
                      </td>
                      <td style={st.td}><span style={st.busBadge}>{t.bus}</span></td>
                      <td style={st.td}>{t.ligne}</td>
                      <td style={st.td}><strong style={{ color: "#E6EDF3" }}>{t.depart}</strong></td>
                      <td style={st.td}>{t.controleur ?? <span style={{ color: "#6E7681" }}>—</span>}</td>
                      <td style={st.td}>{t.vendus} / {t.capacite}</td>
                      <td style={st.td}><TauxBar taux={t.taux} /></td>
                      <td style={st.td}><BadgeStatut s={t.statut} /></td>
                      <td style={st.td}>
                        <button style={st.btnSell}
                          onClick={() => navigate(`/receptionniste/vente?trajet=${t.id}`)}>
                          Réserver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

function TauxBar({ taux }) {
  const color = taux >= 90 ? "#FF7B72" : taux >= 60 ? "#F0883E" : "#56D364";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "60px", height: "6px", backgroundColor: "#21262D", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${taux}%`, height: "100%", backgroundColor: color, borderRadius: "3px" }} />
      </div>
      <span style={{ fontSize: "12px", color, fontWeight: "600" }}>{taux}%</span>
    </div>
  );
}

function StatCard({ label, value, color, small }) {
  return (
    <div style={{ ...st.statCard, borderTopColor: color }}>
      <p style={st.statLabel}>{label}</p>
      <p style={{ ...st.statValue, color, fontSize: small ? "16px" : "28px" }}>{value}</p>
    </div>
  );
}

function Btn({ label, onClick, color }) {
  return (
    <button onClick={onClick} style={{ ...st.actionBtn, backgroundColor: color }}>
      {label}
    </button>
  );
}

function BtnBadge({ label, onClick, color, badge }) {
  return (
    <button onClick={onClick} style={{ ...st.actionBtn, backgroundColor: color, position: "relative", paddingRight: badge > 0 ? "36px" : "20px" }}>
      {label}
      {badge > 0 && (
        <span style={{
          position: "absolute", top: "-8px", right: "-8px",
          backgroundColor: "#FF7B72", color: "#fff",
          borderRadius: "10px", fontSize: "11px", fontWeight: "800",
          minWidth: "20px", height: "20px", padding: "0 5px",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 2px #0D1117",
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

const st = {
  page:      { minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" },
  main:      { maxWidth: "1100px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "20px" },
  shortcuts: { display: "flex", flexWrap: "wrap", gap: "10px" },
  actionBtn: { padding: "10px 20px", fontSize: "14px", fontWeight: "600", borderRadius: "8px", cursor: "pointer", border: "none", color: "#fff", fontFamily: "inherit" },
  statsRow:  { display: "flex", flexWrap: "wrap", gap: "16px" },
  statCard:  { flex: "1 1 180px", backgroundColor: "#161B22", borderRadius: "12px", padding: "20px 22px", borderTop: "3px solid", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  statLabel: { fontSize: "12px", color: "#6E7681", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px" },
  statValue: { fontWeight: "800", margin: 0, lineHeight: 1 },
  alertesBox:{ backgroundColor: "#161B22", borderRadius: "10px", padding: "16px 20px", border: "1px solid #F0883E33" },
  alerte:    { display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #21262D", fontSize: "13px", color: "#C9D1D9" },
  alerteIcon:{ fontSize: "16px" },
  alerteMsg: { flex: 1 },
  card:      { backgroundColor: "#161B22", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  cardTitle: { fontSize: "15px", fontWeight: "700", color: "#E6EDF3", margin: "0 0 16px", paddingBottom: "10px", borderBottom: "1px solid #21262D" },
  table:     { width: "100%", borderCollapse: "collapse", minWidth: "680px" },
  th:        { padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6E7681", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #21262D" },
  tr:        { borderBottom: "1px solid #21262D" },
  td:        { padding: "12px", fontSize: "13px", color: "#C9D1D9" },
  busBadge:  { backgroundColor: "#21262D", color: "#E6EDF3", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", fontFamily: "monospace" },
  badge:     { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  empty:     { fontSize: "13px", color: "#6E7681", margin: 0 },
  btnSell:   { padding: "4px 12px", fontSize: "12px", fontWeight: "600", color: "#56D364", backgroundColor: "transparent", border: "1.5px solid #56D364", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
};
