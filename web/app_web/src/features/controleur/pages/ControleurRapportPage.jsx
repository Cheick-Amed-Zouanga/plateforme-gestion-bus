import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

export default function ControleurRapportPage() {
  const navigate = useNavigate();
  const { trajetId } = useParams();
  const [trajet, setTrajet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    heure_depart_reelle: "",
    heure_arrivee_reelle: "",
    nb_billets_bord: "",
    nb_passagers_reels: "",
    nb_absents: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    apiFetch("/billets/controleur/mon-trajet/")
      .then(data => {
        setTrajet(data?.trajet ?? null);
        const compteurs = data?.compteurs ?? {};
        setForm(f => ({
          ...f,
          nb_billets_bord:      String(compteurs.billets_valides ?? ""),
          nb_passagers_reels:   String(compteurs.billets_valides ?? ""),
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!form.heure_depart_reelle || !form.heure_arrivee_reelle) {
      setError("Les heures de départ et d'arrivée réelles sont requises.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await apiFetch(`/billets/controleur/${trajetId}/rapport/`, {
        method: "POST",
        body: JSON.stringify({
          nb_billets_bord:    form.nb_billets_bord    ? Number(form.nb_billets_bord)    : 0,
          nb_passagers_reels: form.nb_passagers_reels ? Number(form.nb_passagers_reels) : 0,
          heure_depart_reelle:  form.heure_depart_reelle  || undefined,
          heure_arrivee_reelle: form.heure_arrivee_reelle || undefined,
          notes: form.notes,
        }),
      });
      setSubmitted(true);
    } catch (e) {
      setError(e.message ?? "Erreur lors de la soumission.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={st.page}><Header /><SubHeader title="Rapport de fin de trajet" backPath="/controleur" />
      <main style={st.main}><p style={st.muted}>Chargement…</p></main>
    </div>
  );

  if (submitted) return (
    <div style={st.page}><Header /><SubHeader title="Rapport de fin de trajet" backPath="/controleur" />
      <main style={st.main}>
        <div style={st.successCard}>
          <div style={st.successIcon}>✓</div>
          <h3 style={{ color: "#56D364", margin: "0 0 8px", fontSize: "17px" }}>Rapport soumis avec succès</h3>
          <p style={{ color: "#6E7681", margin: "0 0 20px", fontSize: "13px" }}>Le trajet a été marqué comme terminé.</p>
          <button style={st.btnHome} onClick={() => navigate("/controleur")}>Retour au tableau de bord</button>
        </div>
      </main>
    </div>
  );

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Rapport de fin de trajet" backPath="/controleur" />
      <main style={st.main}>

        {trajet && (
          <div style={st.infoCard}>
            <div style={st.infoGrid}>
              <InfoItem label="Ligne" value={trajet.ligne_display} />
              <InfoItem label="Bus" value={trajet.bus_display} />
              <InfoItem label="Départ prévu" value={trajet.depart_prevu ? new Date(trajet.depart_prevu).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—"} />
              <InfoItem label="Arrivée prévue" value={trajet.arrivee_prevue ? new Date(trajet.arrivee_prevue).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—"} />
            </div>
          </div>
        )}

        <div style={st.card}>
          <h3 style={st.cardTitle}>Rapport de fin de service</h3>
          {error && <div style={st.errorBanner}>{error}</div>}

          <div style={st.formGrid}>
            <div>
              <label style={st.label}>Heure de départ réelle *</label>
              <input style={st.input} type="datetime-local" value={form.heure_depart_reelle}
                onChange={e => setForm(f => ({ ...f, heure_depart_reelle: e.target.value }))} />
            </div>
            <div>
              <label style={st.label}>Heure d'arrivée réelle *</label>
              <input style={st.input} type="datetime-local" value={form.heure_arrivee_reelle}
                onChange={e => setForm(f => ({ ...f, heure_arrivee_reelle: e.target.value }))} />
            </div>
            <div>
              <label style={st.label}>Billets validés à bord</label>
              <input style={st.input} type="number" min="0" value={form.nb_billets_bord}
                onChange={e => setForm(f => ({ ...f, nb_billets_bord: e.target.value }))} />
            </div>
            <div>
              <label style={st.label}>Passagers réels embarqués</label>
              <input style={st.input} type="number" min="0" value={form.nb_passagers_reels}
                onChange={e => setForm(f => ({ ...f, nb_passagers_reels: e.target.value }))} />
            </div>
          </div>

          <label style={st.label}>Notes / Observations</label>
          <textarea style={st.textarea} rows={4} placeholder="Incidents, remarques sur le trajet…"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

          <div style={st.warningBox}>
            <span style={{ fontSize: "14px" }}>⚠</span>
            <span style={{ fontSize: "13px", color: "#F0883E" }}>
              En soumettant ce rapport, le trajet sera marqué comme <strong>Terminé</strong>. Cette action est irréversible.
            </span>
          </div>

          <div style={st.btnRow}>
            <button style={st.btnCancel} onClick={() => navigate("/controleur")}>Annuler</button>
            <button style={{ ...st.btnSubmit, opacity: submitting ? 0.6 : 1 }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Envoi…" : "Soumettre le rapport"}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "10px", color: "#6E7681", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
      <div style={{ fontSize: "14px", color: "#E6EDF3", fontWeight: "700", marginTop: "2px" }}>{value}</div>
    </div>
  );
}

const st = {
  page:        { minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" },
  main:        { maxWidth: "620px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "16px" },
  card:        { backgroundColor: "#161B22", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  cardTitle:   { fontSize: "15px", fontWeight: "700", color: "#E6EDF3", margin: "0 0 16px", paddingBottom: "10px", borderBottom: "1px solid #21262D" },
  infoCard:    { backgroundColor: "#161B22", borderRadius: "12px", padding: "18px 22px" },
  infoGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  formGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" },
  label:       { display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px", marginTop: "14px", fontWeight: "600" },
  input:       { width: "100%", padding: "10px 12px", backgroundColor: "#0D1117", border: "1px solid #30363D", borderRadius: "8px", color: "#E6EDF3", fontSize: "13px", fontFamily: "inherit", boxSizing: "border-box" },
  textarea:    { width: "100%", padding: "10px 12px", backgroundColor: "#0D1117", border: "1px solid #30363D", borderRadius: "8px", color: "#E6EDF3", fontSize: "13px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" },
  warningBox:  { display: "flex", alignItems: "flex-start", gap: "10px", backgroundColor: "#2D1A0A", borderRadius: "8px", padding: "12px 14px", marginTop: "16px", border: "1px solid #F0883E33" },
  btnRow:      { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" },
  btnSubmit:   { padding: "10px 22px", backgroundColor: "#A371F7", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  btnCancel:   { padding: "10px 18px", backgroundColor: "transparent", color: "#6E7681", border: "1px solid #30363D", borderRadius: "8px", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" },
  errorBanner: { backgroundColor: "#2D1117", border: "1px solid #FF7B72", color: "#FF7B72", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "12px" },
  successCard: { backgroundColor: "#161B22", borderRadius: "12px", padding: "48px 24px", textAlign: "center" },
  successIcon: { width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "#1B3A2D", border: "2px solid #56D364", color: "#56D364", fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  btnHome:     { padding: "10px 22px", backgroundColor: "#009A44", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  muted:       { color: "#6E7681", fontSize: "13px" },
};
