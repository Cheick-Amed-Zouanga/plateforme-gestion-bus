import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUT_MAP = {
  EN_COURS: { label: "En cours",  bg: "#1B3A2D", color: "#56D364" },
  PLANIFIE: { label: "Planifié",  bg: "#1B2A3B", color: "#58A6FF" },
  TERMINE:  { label: "Terminé",   bg: "#21262D", color: "#6E7681" },
  ANNULE:   { label: "Annulé",    bg: "#2D1117", color: "#FF7B72" },
};

const ROLE_COULEUR = {
  CONTROLEUR:    { bg: "#1B2A3B", color: "#58A6FF" },
  RECEPTIONNISTE:{ bg: "#1B3A2D", color: "#56D364" },
  COMPTABLE:     { bg: "#3B2A1B", color: "#E67E22" },
  SAV:           { bg: "#3D1F6B", color: "#D2A8FF" },
};

function BadgeStatut({ statut }) {
  const s = STATUT_MAP[statut] ?? STATUT_MAP.PLANIFIE;
  return (
    <span style={{ ...st.badge, backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ─── Carte horaire détaillée ──────────────────────────────────────────────────

function CarteTrajet({ t }) {
  const [ouvert, setOuvert] = useState(false);
  const isVip = t.type_bus === "VIP";

  return (
    <div style={st.trajetCard}>
      {/* ── En-tête cliquable ── */}
      <div style={st.trajetHeader} onClick={() => setOuvert(o => !o)}>
        <div style={st.trajetHeaderLeft}>
          <span style={st.busBadge}>{t.bus}</span>
          <span style={{ ...st.typeBadge, ...(isVip ? st.typeBadgeVip : st.typeBadgeStd) }}>
            {t.type_bus_display}
          </span>
          <span style={st.ligneName}>{t.ligne}</span>
        </div>
        <div style={st.trajetHeaderRight}>
          <span style={st.heureDepart}>{t.depart}</span>
          <span style={st.heureArrow}>→</span>
          <span style={st.heureArrivee}>{t.arrivee}</span>
          <BadgeStatut statut={t.statut} />
          <span style={st.chevron}>{ouvert ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* ── Détails dépliables ── */}
      {ouvert && (
        <div style={st.trajetDetails}>

          {/* Timeline des arrêts */}
          <div style={st.section}>
            <p style={st.sectionTitle}>Itinéraire — {t.capacite} places</p>
            <div style={st.timeline}>
              {t.arrets.map((a, i) => (
                <div key={i} style={st.timelineRow}>
                  <div style={st.timelineLeft}>
                    <div style={{
                      ...st.timelineDot,
                      backgroundColor: a.est_depart ? "#56D364" : a.est_arrivee ? "#FF7B72" : "#58A6FF",
                      width:  a.est_depart || a.est_arrivee ? "14px" : "10px",
                      height: a.est_depart || a.est_arrivee ? "14px" : "10px",
                    }} />
                    {i < t.arrets.length - 1 && <div style={st.timelineLine} />}
                  </div>
                  <div style={st.timelineContent}>
                    <span style={{
                      ...st.timelineVille,
                      color: a.est_depart ? "#56D364" : a.est_arrivee ? "#FF7B72" : "#E6EDF3",
                      fontWeight: a.est_depart || a.est_arrivee ? "700" : "400",
                    }}>
                      {a.ville}
                      {a.est_depart && <span style={st.arretTag}> départ</span>}
                      {a.est_arrivee && <span style={st.arretTag}> arrivée</span>}
                    </span>
                    <span style={st.timelineHeure}>{a.heure}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tarifs */}
          {t.tarifs.length > 0 && (
            <div style={st.section}>
              <p style={st.sectionTitle}>Tarifs {t.type_bus_display}</p>
              <table style={st.tarifTable}>
                <thead>
                  <tr>
                    <th style={st.tarifTh}>De</th>
                    <th style={st.tarifTh}>À</th>
                    <th style={{ ...st.tarifTh, textAlign: "right" }}>Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {t.tarifs.map((tarif, i) => (
                    <tr key={i} style={st.tarifTr}>
                      <td style={st.tarifTd}>{tarif.depart_ville}</td>
                      <td style={st.tarifTd}>{tarif.arrivee_ville}</td>
                      <td style={{ ...st.tarifTd, textAlign: "right" }}>
                        <strong style={{ color: "#F0883E" }}>
                          {tarif.prix.toLocaleString("fr-FR")} {tarif.devise}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {t.tarifs.length === 0 && (
            <div style={st.section}>
              <p style={{ ...st.sectionTitle, color: "#6E7681" }}>
                Aucun tarif défini pour ce type de bus sur cette ligne.
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

function ChefHomePage() {
  const navigate = useNavigate();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur]   = useState("");

  useEffect(() => {
    apiFetch("/transport/tableau-de-bord/")
      .then(setData)
      .catch(e => setErreur(e.message))
      .finally(() => setLoading(false));
  }, []);

  const stats    = data?.stats            ?? { bus_actifs: 0, total_employes: 0, trajets_du_jour: 0, planifies: 0 };
  const flotte   = data?.etat_flotte      ?? [];
  const horaires = data?.horaires_du_jour ?? [];
  const employes = data?.employes         ?? [];

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Tableau de bord — Chef de compagnie" />

      <main style={st.main}>

        {erreur && <div style={st.erreur}>{erreur}</div>}

        {/* ── Raccourcis rapides ── */}
        <section style={st.shortcutsRow}>
          <ActionBtn label="Ajouter un bus"      onClick={() => navigate("/chef/bus/creer")}         color="#009A44" />
          <ActionBtn label="Créer une ligne"     onClick={() => navigate("/chef/lignes/creer")}      color="#0E7490" />
          <ActionBtn label="Créer un trajet"     onClick={() => navigate("/chef/trajets/creer")}     color="#1B6CA8" />
          <ActionBtn label="Inscrire un employé" onClick={() => navigate("/chef/employes/inscrire")} color="#6E3FAA" />
          <ActionBtn label="Définir un tarif"    onClick={() => navigate("/chef/tarifs/creer")}      color="#E67E22" />
          <ActionBtn label="Voir les bus"        onClick={() => navigate("/chef/bus")}               color="#21262D" outline />
          <ActionBtn label="Voir les lignes"     onClick={() => navigate("/chef/lignes")}            color="#21262D" outline />
          <ActionBtn label="Voir les trajets"    onClick={() => navigate("/chef/trajets")}           color="#21262D" outline />
          <ActionBtn label="Historique"          onClick={() => navigate("/chef/historique")}        color="#21262D" outline />
        </section>

        {/* ── Statistiques clés ── */}
        <section style={st.statsRow}>
          <StatCard label="Bus actifs"          value={loading ? "…" : stats.bus_actifs}      color="#009A44" />
          <StatCard label="Employés actifs"     value={loading ? "…" : stats.total_employes}  color="#58A6FF" />
          <StatCard label="Trajets aujourd'hui" value={loading ? "…" : stats.trajets_du_jour} color="#E67E22" />
          <StatCard label="Trajets planifiés"   value={loading ? "…" : stats.planifies}       color="#F1C40F" />
        </section>

        {/* ── Flotte + Équipe ── */}
        <section style={st.row}>

          <div style={{ ...st.card, flex: "1 1 240px" }}>
            <h3 style={st.cardTitle}>État de la flotte</h3>
            {loading ? (
              <p style={st.empty}>Chargement…</p>
            ) : flotte.length === 0 ? (
              <p style={st.empty}>Aucun bus enregistré.</p>
            ) : (
              <>
                {flotte.map(e => (
                  <div key={e.statut} style={st.flotteItem}>
                    <div style={st.flotteLeft}>
                      <span style={{ ...st.flottePoint, backgroundColor: e.couleur }} />
                      <span style={st.flotteLabel}>{e.statut}</span>
                    </div>
                    <span style={{ ...st.flotteCount, color: e.couleur }}>{e.count}</span>
                  </div>
                ))}
                <p style={st.flotteSub}>
                  Total : <strong style={{ color: "#E6EDF3" }}>{flotte.reduce((s, e) => s + e.count, 0)} bus</strong>
                </p>
              </>
            )}
          </div>

          <div style={{ ...st.card, flex: "2 1 360px" }}>
            <h3 style={st.cardTitle}>
              Équipe ({employes.length} employé{employes.length !== 1 ? "s" : ""})
            </h3>
            {loading ? (
              <p style={st.empty}>Chargement…</p>
            ) : employes.length === 0 ? (
              <p style={st.empty}>Aucun employé enregistré.</p>
            ) : (
              <div style={st.empGrid}>
                {employes.map((e, i) => {
                  const c = ROLE_COULEUR[e.role] ?? { bg: "#21262D", color: "#8B949E" };
                  return (
                    <div key={i} style={st.empCard}>
                      <div style={st.empAvatar}>{e.nom.charAt(0).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={st.empNom}>{e.nom}</p>
                        <span style={{ ...st.empBadge, backgroundColor: c.bg, color: c.color }}>
                          {e.role_display}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

        {/* ── Horaires du jour ── */}
        <div style={st.card}>
          <h3 style={st.cardTitle}>
            Horaires du jour — <span style={{ color: "#58A6FF", fontWeight: 400 }}>{dateLabel}</span>
          </h3>

          {loading ? (
            <p style={st.empty}>Chargement…</p>
          ) : horaires.length === 0 ? (
            <p style={st.empty}>Aucun trajet prévu aujourd'hui.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ ...st.empty, marginBottom: "4px" }}>
                Cliquez sur un trajet pour voir l'itinéraire et les tarifs.
              </p>
              {horaires.map(t => <CarteTrajet key={t.id} t={t} />)}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...st.statCard, borderTopColor: color }}>
      <p style={st.statLabel}>{label}</p>
      <p style={{ ...st.statValue, color }}>{value}</p>
    </div>
  );
}

function ActionBtn({ label, onClick, color, outline }) {
  return (
    <button onClick={onClick} style={{
      ...st.actionBtn,
      backgroundColor: outline ? "transparent" : color,
      border:          outline ? "1.5px solid #30363D" : "none",
      color:           outline ? "#C9D1D9" : "#fff",
    }}>
      {label}
    </button>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = {
  page:  { minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" },
  main:  { maxWidth: "1100px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "20px" },

  erreur: { padding: "12px 16px", backgroundColor: "#2D1117", color: "#FF7B72", borderRadius: "8px", fontSize: "14px" },

  shortcutsRow: { display: "flex", flexWrap: "wrap", gap: "10px" },
  actionBtn:    { padding: "10px 20px", fontSize: "14px", fontWeight: "600", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" },

  statsRow:  { display: "flex", flexWrap: "wrap", gap: "16px" },
  statCard:  { flex: "1 1 180px", backgroundColor: "#161B22", borderRadius: "12px", padding: "20px 22px", borderTop: "3px solid", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  statLabel: { fontSize: "12px", color: "#6E7681", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px" },
  statValue: { fontWeight: "800", fontSize: "32px", margin: 0, lineHeight: 1 },

  card:      { backgroundColor: "#161B22", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  cardTitle: { fontSize: "15px", fontWeight: "700", color: "#E6EDF3", margin: "0 0 16px", paddingBottom: "10px", borderBottom: "1px solid #21262D" },

  row:   { display: "flex", flexWrap: "wrap", gap: "20px" },
  badge: { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  empty: { fontSize: "13px", color: "#6E7681", margin: 0 },

  // Flotte
  flotteItem:  { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #21262D" },
  flotteLeft:  { display: "flex", alignItems: "center", gap: "10px" },
  flottePoint: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  flotteLabel: { fontSize: "14px", color: "#C9D1D9" },
  flotteCount: { fontSize: "22px", fontWeight: "800" },
  flotteSub:   { margin: "12px 0 0", fontSize: "13px", color: "#6E7681" },

  // Équipe
  empGrid:  { display: "flex", flexWrap: "wrap", gap: "10px" },
  empCard:  { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#0D1117", borderRadius: "10px", padding: "10px 14px", flex: "1 1 200px" },
  empAvatar:{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#21262D", color: "#E6EDF3", fontSize: "15px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  empNom:   { fontSize: "13px", fontWeight: "600", color: "#E6EDF3", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  empBadge: { padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" },

  // Cartes trajet
  trajetCard:       { backgroundColor: "#0D1117", borderRadius: "10px", border: "1px solid #21262D", overflow: "hidden" },
  trajetHeader:     { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer", gap: "12px", flexWrap: "wrap" },
  trajetHeaderLeft: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  trajetHeaderRight:{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  busBadge:     { backgroundColor: "#21262D", color: "#E6EDF3", padding: "3px 10px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", fontFamily: "monospace" },
  typeBadge:    { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  typeBadgeStd: { backgroundColor: "#1C3260", color: "#79C0FF" },
  typeBadgeVip: { backgroundColor: "#3D1F6B", color: "#D2A8FF" },
  ligneName:    { fontSize: "14px", color: "#C9D1D9", fontWeight: "500" },
  heureDepart:  { fontSize: "16px", fontWeight: "800", color: "#56D364" },
  heureArrow:   { fontSize: "14px", color: "#6E7681" },
  heureArrivee: { fontSize: "16px", fontWeight: "800", color: "#FF7B72" },
  chevron:      { fontSize: "11px", color: "#6E7681", marginLeft: "4px" },

  trajetDetails: { borderTop: "1px solid #21262D", padding: "18px", display: "flex", flexWrap: "wrap", gap: "24px" },
  section:       { flex: "1 1 260px" },
  sectionTitle:  { fontSize: "12px", fontWeight: "700", color: "#8B949E", textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 12px" },

  // Timeline
  timeline:        { display: "flex", flexDirection: "column" },
  timelineRow:     { display: "flex", gap: "12px" },
  timelineLeft:    { display: "flex", flexDirection: "column", alignItems: "center", width: "14px", flexShrink: 0 },
  timelineDot:     { borderRadius: "50%", flexShrink: 0, marginTop: "3px" },
  timelineLine:    { width: "2px", flex: 1, backgroundColor: "#30363D", minHeight: "16px" },
  timelineContent: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flex: 1, paddingBottom: "14px", gap: "8px" },
  timelineVille:   { fontSize: "14px", lineHeight: "20px" },
  timelineHeure:   { fontSize: "14px", fontWeight: "700", color: "#E6EDF3", whiteSpace: "nowrap" },
  arretTag:        { fontSize: "11px", color: "#6E7681", fontWeight: "400" },

  // Table tarifs
  tarifTable: { width: "100%", borderCollapse: "collapse" },
  tarifTh:    { fontSize: "11px", fontWeight: "700", color: "#6E7681", textTransform: "uppercase", letterSpacing: "0.6px", padding: "6px 8px", borderBottom: "1px solid #21262D", textAlign: "left" },
  tarifTr:    { borderBottom: "1px solid #21262D" },
  tarifTd:    { fontSize: "13px", color: "#C9D1D9", padding: "8px 8px" },
};

export default ChefHomePage;
