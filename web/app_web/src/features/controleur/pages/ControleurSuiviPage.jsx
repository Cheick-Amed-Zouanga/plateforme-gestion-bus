import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

export default function ControleurSuiviPage() {
  const navigate = useNavigate();
  const { trajetId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [feedback, setFeedback] = useState("");

  const fetchData = () => {
    apiFetch("/billets/controleur/mon-trajet/")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const marquerEscale = async (arretId) => {
    setMarking(true);
    setFeedback("");
    try {
      await apiFetch(`/billets/controleur/${trajetId}/escale-passee/`, {
        method: "POST",
        body: JSON.stringify({ arret_id: arretId }),
      });
      setFeedback("Escale marquée comme passée.");
      fetchData();
    } catch (e) {
      setFeedback(e.message ?? "Erreur.");
    } finally {
      setMarking(false);
      setTimeout(() => setFeedback(""), 3000);
    }
  };

  if (loading) return (
    <div style={st.page}><Header /><SubHeader title="Suivi du trajet" backPath="/controleur" />
      <main style={st.main}><p style={st.muted}>Chargement…</p></main>
    </div>
  );

  if (!data?.trajet) return (
    <div style={st.page}><Header /><SubHeader title="Suivi du trajet" backPath="/controleur" />
      <main style={st.main}><p style={st.muted}>Aucun trajet trouvé.</p></main>
    </div>
  );

  const { trajet, arrets = [] } = data;
  const statut = trajet.statut;

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title={`Suivi — ${trajet.ligne_display}`} backPath="/controleur" />
      <main style={st.main}>

        {/* Info trajet */}
        <div style={st.infoCard}>
          <div style={st.infoGrid}>
            <InfoItem label="Bus" value={trajet.bus_display} />
            <InfoItem label="Statut" value={trajet.statut_display} />
            <InfoItem label="Départ prévu" value={trajet.depart_prevu ? new Date(trajet.depart_prevu).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—"} />
            <InfoItem label="Arrivée prévue" value={trajet.arrivee_prevue ? new Date(trajet.arrivee_prevue).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—"} />
          </div>
        </div>

        {feedback && (
          <div style={{ ...st.feedbackBanner, borderColor: "#26C2A1", color: "#26C2A1" }}>{feedback}</div>
        )}

        {/* Timeline des arrêts */}
        <div style={st.card}>
          <h3 style={st.cardTitle}>Progression du trajet</h3>
          <div style={st.timeline}>
            {(arrets ?? []).map((a, i) => {
              const isPast = a.est_passee;
              const isCurrent = !isPast && i === (arrets ?? []).findIndex(x => !x.est_passee);
              const dotColor = isPast ? "#26C2A1" : isCurrent ? "#F0883E" : "#E5E7EB";
              const lineColor = isPast ? "#26C2A1" : "#EEF2F7";

              return (
                <div key={a.id} style={st.timelineItem}>
                  <div style={st.dotCol}>
                    <div style={{ ...st.dot, backgroundColor: dotColor, border: isCurrent ? "2px solid #F0883E" : "none", boxShadow: isCurrent ? "0 0 8px #F0883E88" : "none" }} />
                    {i < arrets.length - 1 && <div style={{ ...st.line, backgroundColor: lineColor }} />}
                  </div>
                  <div style={{ ...st.stopContent, paddingBottom: i < arrets.length - 1 ? "16px" : "0" }}>
                    <div style={st.stopRow}>
                      <div>
                        <span style={{ fontWeight: "700", color: isPast ? "#26C2A1" : isCurrent ? "#F0883E" : "#1A1348", fontSize: "14px" }}>
                          {a.ville}
                        </span>
                        {a.est_depart && <span style={st.tagDepart}>Départ</span>}
                        {a.est_arrivee && <span style={st.tagArrivee}>Arrivée</span>}
                        {isPast && <span style={st.tagPasse}>Passée</span>}
                      </div>
                      <span style={{ fontSize: "13px", color: "#58A6FF", fontWeight: "700", fontFamily: "monospace" }}>
                        {a.heure_arrivee ?? a.heure ?? "—"}
                      </span>
                    </div>
                    {isCurrent && statut !== "TERMINE" && (
                      <button
                        style={{ ...st.btnMarquer, opacity: marking ? 0.6 : 1 }}
                        onClick={() => marquerEscale(a.id)}
                        disabled={marking}
                      >
                        {marking ? "…" : "Marquer comme passée →"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={st.actionRow}>
          <button style={st.btnIncident} onClick={() => navigate(`/controleur/incidents/${trajet.id}`)}>
            ⚠ Signaler un incident
          </button>
          {statut !== "TERMINE" && (
            <button style={st.btnRapport} onClick={() => navigate(`/controleur/rapport/${trajet.id}`)}>
              📋 Rapport final
            </button>
          )}
        </div>

      </main>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "10px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
      <div style={{ fontSize: "14px", color: "#1A1348", fontWeight: "700", marginTop: "2px" }}>{value}</div>
    </div>
  );
}

const st = {
  page:          { minHeight: "100vh", backgroundColor: "#F5F7FA", fontFamily: "'Poppins', 'Segoe UI', sans-serif" },
  main:          { maxWidth: "620px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "16px" },
  card:          { backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  cardTitle:     { fontSize: "15px", fontWeight: "700", color: "#1A1348", margin: "0 0 16px", paddingBottom: "10px", borderBottom: "1px solid #EEF2F7" },
  infoCard:      { backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "18px 22px" },
  infoGrid:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  feedbackBanner:{ backgroundColor: "#1B3A2D", border: "1px solid", borderRadius: "8px", padding: "10px 16px", fontSize: "13px" },
  timeline:      { display: "flex", flexDirection: "column" },
  timelineItem:  { display: "flex", gap: "12px" },
  dotCol:        { display: "flex", flexDirection: "column", alignItems: "center", width: "16px", flexShrink: 0, paddingTop: "2px" },
  dot:           { width: "12px", height: "12px", borderRadius: "50%", flexShrink: 0 },
  line:          { width: "2px", flex: 1, minHeight: "12px", margin: "4px 0" },
  stopContent:   { flex: 1 },
  stopRow:       { display: "flex", justifyContent: "space-between", alignItems: "center" },
  tagDepart:     { marginLeft: "8px", fontSize: "10px", color: "#26C2A1", backgroundColor: "#1B3A2D", padding: "1px 6px", borderRadius: "10px", fontWeight: "600" },
  tagArrivee:    { marginLeft: "8px", fontSize: "10px", color: "#E11D48", backgroundColor: "#2D1117", padding: "1px 6px", borderRadius: "10px", fontWeight: "600" },
  tagPasse:      { marginLeft: "8px", fontSize: "10px", color: "#26C2A1", fontWeight: "600" },
  btnMarquer:    { marginTop: "8px", padding: "6px 14px", backgroundColor: "#F0883E22", color: "#F0883E", border: "1px solid #F0883E", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  actionRow:     { display: "flex", gap: "10px", flexWrap: "wrap" },
  btnIncident:   { flex: 1, padding: "12px", backgroundColor: "#2D1A0A", color: "#F0883E", border: "1px solid #F0883E44", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  btnRapport:    { flex: 1, padding: "12px", backgroundColor: "#1B1033", color: "#A371F7", border: "1px solid #A371F744", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  muted:         { color: "#6B7280", fontSize: "13px" },
};
