import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

const TYPE_INCIDENT = [
  { value: "PASSAGER_SANS_BILLET", label: "Passager sans billet" },
  { value: "CONFLIT_SIEGE",        label: "Conflit de siège" },
  { value: "PROBLEME_BUS",         label: "Problème de bus" },
  { value: "AUTRE",                label: "Autre" },
];

const TYPE_COLOR = {
  PASSAGER_SANS_BILLET: "#F0883E",
  CONFLIT_SIEGE:        "#E67E22",
  PROBLEME_BUS:         "#FF7B72",
  AUTRE:                "#8B949E",
};

export default function ControleurIncidentsPage() {
  const navigate = useNavigate();
  const { trajetId } = useParams();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type_incident: "RETARD", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchIncidents = () => {
    setLoading(true);
    apiFetch(`/billets/controleur/${trajetId}/incidents/`)
      .then(data => setIncidents(Array.isArray(data) ? data : (data.incidents ?? [])))
      .catch(() => setIncidents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchIncidents(); }, [trajetId]);

  const handleSubmit = async () => {
    if (!form.description.trim()) { setError("La description est requise."); return; }
    setError("");
    setSubmitting(true);
    try {
      await apiFetch(`/billets/controleur/${trajetId}/incidents/`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ type_incident: "RETARD", description: "" });
      setShowForm(false);
      fetchIncidents();
    } catch (e) {
      setError(e.message ?? "Erreur.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Incidents du trajet" backPath="/controleur" />
      <main style={st.main}>

        {/* Bouton signaler */}
        <div style={st.topRow}>
          <h3 style={st.pageTitle}>
            {loading ? "…" : `${incidents.length} incident${incidents.length !== 1 ? "s" : ""}`}
          </h3>
          <button style={st.btnSignaler} onClick={() => { setShowForm(f => !f); setError(""); }}>
            {showForm ? "Annuler" : "⚠ Signaler un incident"}
          </button>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div style={st.formCard}>
            <h4 style={st.formTitle}>Nouveau signalement</h4>
            {error && <div style={st.errorBanner}>{error}</div>}
            <label style={st.label}>Type d'incident</label>
            <select style={st.select} value={form.type_incident} onChange={e => setForm(f => ({ ...f, type_incident: e.target.value }))}>
              {TYPE_INCIDENT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <label style={st.label}>Description *</label>
            <textarea
              style={st.textarea}
              rows={3}
              placeholder="Décrivez l'incident…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <div style={st.btnRow}>
              <button style={{ ...st.btnSubmit, opacity: submitting ? 0.6 : 1 }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Envoi…" : "Signaler"}
              </button>
            </div>
          </div>
        )}

        {/* Liste incidents */}
        {loading ? <p style={st.muted}>Chargement…</p> : incidents.length === 0 ? (
          <div style={st.emptyCard}>
            <p style={{ color: "#6E7681", margin: 0, fontSize: "14px" }}>Aucun incident signalé pour ce trajet.</p>
          </div>
        ) : (
          <div style={st.incidentsList}>
            {incidents.map(inc => (
              <IncidentCard key={inc.id} incident={inc} onRefresh={fetchIncidents} />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

function IncidentCard({ incident, onRefresh }) {
  const [showResolution, setShowResolution] = useState(false);
  const [resolution, setResolution] = useState(incident.resolution ?? "");
  const [saving, setSaving] = useState(false);

  const saveResolution = async () => {
    setSaving(true);
    try {
      await apiFetch(`/billets/controleur/incidents/${incident.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ resolution, resolu: true }),
      });
      setShowResolution(false);
      onRefresh();
    } catch {} finally { setSaving(false); }
  };

  const typeInfo = TYPE_INCIDENT.find(t => t.value === incident.type_incident);
  const color = TYPE_COLOR[incident.type_incident] ?? "#8B949E";
  const date = incident.date_incident ? new Date(incident.date_incident).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "";

  return (
    <div style={{ ...st.incidentCard, borderLeft: `3px solid ${color}` }}>
      <div style={st.incidentHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ ...st.typeBadge, backgroundColor: color + "22", color }}>{typeInfo?.label ?? incident.type_incident}</span>
          {incident.resolu && <span style={st.resolvedBadge}>Résolu</span>}
        </div>
        <span style={{ fontSize: "12px", color: "#6E7681" }}>{date}</span>
      </div>

      <p style={st.description}>{incident.description}</p>

      {incident.resolution && (
        <div style={st.resolutionBox}>
          <span style={{ fontSize: "11px", color: "#56D364", fontWeight: "700", textTransform: "uppercase" }}>Résolution : </span>
          <span style={{ fontSize: "13px", color: "#C9D1D9" }}>{incident.resolution}</span>
        </div>
      )}

      {!incident.resolu && (
        <>
          {!showResolution ? (
            <button style={st.btnResoudre} onClick={() => setShowResolution(true)}>+ Ajouter une résolution</button>
          ) : (
            <div style={{ marginTop: "10px" }}>
              <textarea
                style={st.textarea}
                rows={2}
                placeholder="Description de la résolution…"
                value={resolution}
                onChange={e => setResolution(e.target.value)}
              />
              <div style={st.btnRow}>
                <button style={st.btnCancel} onClick={() => setShowResolution(false)}>Annuler</button>
                <button style={{ ...st.btnSubmit, fontSize: "12px", padding: "6px 14px", opacity: saving ? 0.6 : 1 }} onClick={saveResolution} disabled={saving}>
                  {saving ? "…" : "Marquer résolu"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const st = {
  page:          { minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" },
  main:          { maxWidth: "700px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "14px" },
  topRow:        { display: "flex", justifyContent: "space-between", alignItems: "center" },
  pageTitle:     { fontSize: "16px", fontWeight: "700", color: "#E6EDF3", margin: 0 },
  btnSignaler:   { padding: "9px 18px", backgroundColor: "#2D1A0A", color: "#F0883E", border: "1px solid #F0883E", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  formCard:      { backgroundColor: "#161B22", borderRadius: "12px", padding: "20px 22px", border: "1px solid #F0883E33" },
  formTitle:     { fontSize: "14px", fontWeight: "700", color: "#E6EDF3", margin: "0 0 14px" },
  label:         { display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px", marginTop: "12px", fontWeight: "600" },
  select:        { width: "100%", padding: "9px 12px", backgroundColor: "#0D1117", border: "1px solid #30363D", borderRadius: "8px", color: "#E6EDF3", fontSize: "14px", fontFamily: "inherit" },
  textarea:      { width: "100%", padding: "10px 12px", backgroundColor: "#0D1117", border: "1px solid #30363D", borderRadius: "8px", color: "#E6EDF3", fontSize: "13px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" },
  btnRow:        { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" },
  btnSubmit:     { padding: "8px 18px", backgroundColor: "#F0883E", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  btnCancel:     { padding: "8px 14px", backgroundColor: "transparent", color: "#6E7681", border: "1px solid #30363D", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" },
  errorBanner:   { backgroundColor: "#2D1117", border: "1px solid #FF7B72", color: "#FF7B72", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", marginBottom: "8px" },
  incidentsList: { display: "flex", flexDirection: "column", gap: "12px" },
  incidentCard:  { backgroundColor: "#161B22", borderRadius: "10px", padding: "16px 20px" },
  incidentHeader:{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  typeBadge:     { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  resolvedBadge: { padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", backgroundColor: "#1B3A2D", color: "#56D364" },
  description:   { fontSize: "13px", color: "#C9D1D9", margin: "0 0 8px", lineHeight: 1.5 },
  resolutionBox: { backgroundColor: "#0D1117", borderRadius: "6px", padding: "8px 12px", marginBottom: "6px" },
  btnResoudre:   { fontSize: "12px", color: "#56D364", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginTop: "6px" },
  emptyCard:     { backgroundColor: "#161B22", borderRadius: "12px", padding: "32px 24px", textAlign: "center" },
  muted:         { color: "#6E7681", fontSize: "13px" },
};
