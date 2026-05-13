import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

const STATUT_COLOR = {
  PLANIFIE: "#58A6FF",
  EN_COURS: "#56D364",
  TERMINE:  "#6E7681",
  ANNULE:   "#FF7B72",
};

export default function ControleurHomePage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    apiFetch("/billets/controleur/mon-trajet/")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div style={st.page}><Header /><SubHeader title="Tableau de bord — Contrôleur" />
      <main style={st.main}><p style={st.muted}>Chargement…</p></main>
    </div>
  );

  if (!data || !data.trajet) return (
    <div style={st.page}><Header /><SubHeader title="Tableau de bord — Contrôleur" />
      <main style={st.main}>
        <div style={st.emptyCard}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🚌</div>
          <h3 style={{ color: "#E6EDF3", margin: "0 0 8px", fontSize: "16px" }}>Aucun trajet assigné aujourd'hui</h3>
          <p style={{ color: "#6E7681", margin: 0, fontSize: "13px" }}>Vous n'avez pas de trajet prévu pour aujourd'hui.</p>
        </div>
      </main>
    </div>
  );

  const { trajet, arrets = [], compteurs } = data;
  const statusColor = STATUT_COLOR[trajet.statut] ?? "#6E7681";

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Tableau de bord — Contrôleur" />
      <main style={st.main}>

        {/* Trajet en cours */}
        <div style={{ ...st.card, borderTop: `3px solid ${statusColor}` }}>
          <div style={st.trajetHeader}>
            <div>
              <div style={{ fontSize: "12px", color: "#6E7681", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>Trajet du jour</div>
              <h2 style={{ margin: "0 0 4px", fontSize: "20px", color: "#E6EDF3", fontWeight: "800" }}>{trajet.ligne_display ?? trajet.ligne}</h2>
              <span style={{ fontSize: "13px", color: "#8B949E" }}>{trajet.bus_display ?? trajet.bus}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ ...st.statusBadge, backgroundColor: statusColor + "22", color: statusColor }}>{trajet.statut_display ?? trajet.statut}</span>
              <div style={{ fontSize: "13px", color: "#8B949E", marginTop: "8px" }}>
                Départ prévu : <strong style={{ color: "#E6EDF3" }}>
                  {trajet.depart_prevu ? new Date(trajet.depart_prevu).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Compteurs */}
        <div style={st.statsRow}>
          <StatCard label="Passagers à bord" value={compteurs?.passagers_a_bord ?? 0} color="#58A6FF" />
          <StatCard label="Billets validés" value={compteurs?.billets_valides ?? 0} color="#56D364" />
          <StatCard label="En attente paiement" value={compteurs?.en_attente_paiement ?? 0} color="#F0883E" />
          <StatCard label="Incidents" value={compteurs?.incidents ?? 0} color="#FF7B72" />
        </div>

        {/* Actions rapides */}
        <div style={st.shortcuts}>
          <ActionBtn label="Scanner un billet"     color="#009A44" onClick={() => navigate("/controleur/valider")}                        icon="✓" />
          <ActionBtn label="Liste d'embarquement"  color="#0E7490" onClick={() => navigate(`/controleur/embarquement/${trajet.id}`)}     icon="👥" />
          <ActionBtn label="Suivi du trajet"        color="#1B6CA8" onClick={() => navigate(`/controleur/suivi/${trajet.id}`)}           icon="📍" />
          <ActionBtn label="Incidents"              color="#E67E22" onClick={() => navigate(`/controleur/incidents/${trajet.id}`)}       icon="⚠" />
          {trajet.statut !== "TERMINE" && (
            <ActionBtn label="Rapport final"        color="#6E3FAA" onClick={() => navigate(`/controleur/rapport/${trajet.id}`)}        icon="📋" />
          )}
        </div>

        {/* Timeline des arrêts */}
        <div style={st.card}>
          <h3 style={st.cardTitle}>Itinéraire du jour</h3>
          <div style={st.timeline}>
            {(arrets ?? []).map((a, i) => (
              <div key={a.id} style={st.timelineItem}>
                <div style={st.timelineDotCol}>
                  <div style={{
                    ...st.timelineDot,
                    backgroundColor: a.est_depart ? "#56D364" : a.est_arrivee ? "#FF7B72" : "#58A6FF",
                  }} />
                  {i < arrets.length - 1 && <div style={st.timelineLine} />}
                </div>
                <div style={st.timelineContent}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontWeight: "700", color: "#E6EDF3", fontSize: "14px" }}>{a.ville}</span>
                    <span style={{ fontSize: "13px", color: "#58A6FF", fontWeight: "700", fontFamily: "monospace" }}>
                      {a.heure_arrivee ?? a.heure ?? "—"}
                    </span>
                  </div>
                  {(a.est_depart || a.est_arrivee) && (
                    <span style={{ fontSize: "11px", color: a.est_depart ? "#56D364" : "#FF7B72", fontWeight: "600" }}>
                      {a.est_depart ? "Départ" : "Arrivée"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

function ActionBtn({ label, color, onClick, icon }) {
  return (
    <button onClick={onClick} style={{ ...st.actionBtn, backgroundColor: color }}>
      <span style={{ fontSize: "16px" }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ flex: "1 1 160px", backgroundColor: "#161B22", borderRadius: "12px", padding: "18px 20px", borderTop: `3px solid ${color}`, boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
      <p style={{ fontSize: "11px", color: "#6E7681", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: "26px", fontWeight: "800", color, margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

const st = {
  page:          { minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" },
  main:          { maxWidth: "900px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "16px" },
  card:          { backgroundColor: "#161B22", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  cardTitle:     { fontSize: "15px", fontWeight: "700", color: "#E6EDF3", margin: "0 0 16px", paddingBottom: "10px", borderBottom: "1px solid #21262D" },
  trajetHeader:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" },
  statusBadge:   { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  statsRow:      { display: "flex", flexWrap: "wrap", gap: "12px" },
  shortcuts:     { display: "flex", flexWrap: "wrap", gap: "10px" },
  actionBtn:     { display: "flex", alignItems: "center", gap: "8px", padding: "11px 18px", fontSize: "14px", fontWeight: "600", borderRadius: "8px", cursor: "pointer", border: "none", color: "#fff", fontFamily: "inherit" },
  timeline:      { display: "flex", flexDirection: "column" },
  timelineItem:  { display: "flex", gap: "12px" },
  timelineDotCol:{ display: "flex", flexDirection: "column", alignItems: "center", width: "16px", flexShrink: 0 },
  timelineDot:   { width: "12px", height: "12px", borderRadius: "50%", flexShrink: 0, marginTop: "4px" },
  timelineLine:  { width: "2px", flex: 1, backgroundColor: "#21262D", margin: "4px 0", minHeight: "16px" },
  timelineContent:{ flex: 1, paddingBottom: "14px" },
  muted:         { color: "#6E7681", fontSize: "13px" },
  emptyCard:     { backgroundColor: "#161B22", borderRadius: "12px", padding: "48px 24px", textAlign: "center" },
};
