import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../../../shared/services/api";
import {
  ActionButton,
  PageHeader,
  Panel,
  ShortcutCard,
  StatCard,
} from "../../../shared/components/dashboard";

const STATUT_MAP = {
  EN_COURS: { label: "En cours", bg: "#E6F9F5", color: "#26C2A1" },
  PLANIFIE: { label: "Planifié", bg: "#EEF2FF", color: "#304FFE" },
  TERMINE: { label: "Terminé", bg: "#F3F4F6", color: "#6B7280" },
  ANNULE: { label: "Annulé", bg: "#FFF1F2", color: "#E11D48" },
};

const ROLE_COULEUR = {
  CONTROLEUR: { bg: "#EEF2FF", color: "#304FFE" },
  RECEPTIONNISTE: { bg: "#E6F9F5", color: "#26C2A1" },
  COMPTABLE: { bg: "#FFF7ED", color: "#E67E22" },
  SAV: { bg: "#F5F3FF", color: "#7C5CBF" },
};

function BadgeStatut({ statut }) {
  const s = STATUT_MAP[statut] ?? STATUT_MAP.PLANIFIE;
  return (
    <span style={{ ...st.badge, backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function CarteTrajet({ t }) {
  const [ouvert, setOuvert] = useState(false);
  const isVip = t.type_bus === "VIP";

  return (
    <div style={st.trajetCard}>
      <div style={st.trajetHeader} onClick={() => setOuvert((o) => !o)}>
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

      {ouvert && (
        <div style={st.trajetDetails}>
          <div style={st.section}>
            <p style={st.sectionTitle}>Itinéraire — {t.capacite} places</p>
            <div style={st.timeline}>
              {t.arrets.map((a, i) => (
                <div key={i} style={st.timelineRow}>
                  <div style={st.timelineLeft}>
                    <div
                      style={{
                        ...st.timelineDot,
                        backgroundColor: a.est_depart
                          ? "#26C2A1"
                          : a.est_arrivee
                            ? "#E11D48"
                            : "#304FFE",
                        width: a.est_depart || a.est_arrivee ? "14px" : "10px",
                        height: a.est_depart || a.est_arrivee ? "14px" : "10px",
                      }}
                    />
                    {i < t.arrets.length - 1 && <div style={st.timelineLine} />}
                  </div>
                  <div style={st.timelineContent}>
                    <span
                      style={{
                        ...st.timelineVille,
                        color: a.est_depart
                          ? "#26C2A1"
                          : a.est_arrivee
                            ? "#E11D48"
                            : "#1A1348",
                        fontWeight: a.est_depart || a.est_arrivee ? "700" : "400",
                      }}
                    >
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

          {t.tarifs.length > 0 ? (
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
                        <strong style={{ color: "#E67E22" }}>
                          {tarif.prix.toLocaleString("fr-FR")} {tarif.devise}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={st.section}>
              <p style={{ ...st.sectionTitle, color: "#6B7280" }}>
                Aucun tarif défini pour ce type de bus sur cette ligne.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChefHomePage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    apiFetch("/transport/tableau-de-bord/")
      .then(setData)
      .catch((e) => setErreur(e.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats ?? {
    bus_actifs: 0,
    total_employes: 0,
    trajets_du_jour: 0,
    planifies: 0,
  };
  const flotte = data?.etat_flotte ?? [];
  const horaires = data?.horaires_du_jour ?? [];
  const employes = data?.employes ?? [];

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PageHeader
        title="Console compagnie"
        subtitle="Pilotez votre flotte, vos lignes, trajets et équipe."
        actions={
          <ActionButton variant="green" onClick={() => navigate("/chef/trajets/creer")}>
            + Nouveau trajet
          </ActionButton>
        }
      />

      {erreur && <div style={st.erreur}>{erreur}</div>}

      <div className="dash-stats">
        <StatCard
          label="Bus actifs"
          value={loading ? "…" : stats.bus_actifs}
          hint="Flotte disponible"
          accent="#26C2A1"
        />
        <StatCard
          label="Employés"
          value={loading ? "…" : stats.total_employes}
          hint="Équipe active"
          accent="#304FFE"
        />
        <StatCard
          label="Trajets du jour"
          value={loading ? "…" : stats.trajets_du_jour}
          hint="Aujourd'hui"
          accent="#E67E22"
        />
        <StatCard
          label="Planifiés"
          value={loading ? "…" : stats.planifies}
          hint="À venir"
          accent="#F1C40F"
        />
      </div>

      <Panel title="Accès rapides" subtitle="Les actions essentielles de votre compagnie">
        <div className="dash-shortcuts">
          <ShortcutCard
            icon="B"
            title="Ajouter un bus"
            description="Étendre la flotte"
            accent="#26C2A1"
            onClick={() => navigate("/chef/bus/creer")}
          />
          <ShortcutCard
            icon="L"
            title="Créer une ligne"
            description="Nouvel itinéraire"
            accent="#0E7490"
            onClick={() => navigate("/chef/lignes/creer")}
          />
          <ShortcutCard
            icon="T"
            title="Créer un trajet"
            description="Planifier un départ"
            accent="#304FFE"
            onClick={() => navigate("/chef/trajets/creer")}
          />
          <ShortcutCard
            icon="E"
            title="Inscrire un employé"
            description="Réceptionniste / contrôleur"
            accent="#7C5CBF"
            onClick={() => navigate("/chef/employes")}
          />
          <ShortcutCard
            icon="$"
            title="Définir un tarif"
            description="Prix par segment"
            accent="#E67E22"
            onClick={() => navigate("/chef/tarifs/creer")}
          />
          <ShortcutCard
            icon="H"
            title="Historique"
            description="Activité passée"
            accent="#1A1348"
            onClick={() => navigate("/chef/historique")}
          />
        </div>
      </Panel>

      <div className="dash-grid-2">
        <Panel title="État de la flotte" subtitle="Répartition des bus">
          {loading ? (
            <p style={st.empty}>Chargement…</p>
          ) : flotte.length === 0 ? (
            <p style={st.empty}>Aucun bus enregistré.</p>
          ) : (
            <>
              {flotte.map((e) => (
                <div key={e.statut} style={st.flotteItem}>
                  <div style={st.flotteLeft}>
                    <span style={{ ...st.flottePoint, backgroundColor: e.couleur }} />
                    <span style={st.flotteLabel}>{e.statut}</span>
                  </div>
                  <span style={{ ...st.flotteCount, color: e.couleur }}>{e.count}</span>
                </div>
              ))}
              <p style={st.flotteSub}>
                Total :{" "}
                <strong style={{ color: "#1A1348" }}>
                  {flotte.reduce((s, e) => s + e.count, 0)} bus
                </strong>
              </p>
              <div className="dash-actions" style={{ marginTop: 14 }}>
                <ActionButton variant="neutral" onClick={() => navigate("/chef/bus")}>
                  Voir les bus
                </ActionButton>
                <ActionButton variant="neutral" onClick={() => navigate("/chef/lignes")}>
                  Voir les lignes
                </ActionButton>
              </div>
            </>
          )}
        </Panel>

        <Panel
          title={`Équipe (${employes.length})`}
          subtitle="Employés de la compagnie"
          action={
            <ActionButton variant="blue" onClick={() => navigate("/chef/employes")}>
              Gérer
            </ActionButton>
          }
        >
          {loading ? (
            <p style={st.empty}>Chargement…</p>
          ) : employes.length === 0 ? (
            <p style={st.empty}>Aucun employé enregistré.</p>
          ) : (
            <div style={st.empGrid}>
              {employes.map((e, i) => {
                const c = ROLE_COULEUR[e.role] ?? { bg: "#EEF2F7", color: "#6B7280" };
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
        </Panel>
      </div>

      <Panel
        title="Horaires du jour"
        subtitle={dateLabel}
        action={
          <ActionButton variant="neutral" onClick={() => navigate("/chef/trajets")}>
            Tous les trajets
          </ActionButton>
        }
      >
        {loading ? (
          <p style={st.empty}>Chargement…</p>
        ) : horaires.length === 0 ? (
          <p style={st.empty}>Aucun trajet prévu aujourd'hui.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <p style={{ ...st.empty, marginBottom: "4px" }}>
              Cliquez sur un trajet pour voir l'itinéraire et les tarifs.
            </p>
            {horaires.map((t) => (
              <CarteTrajet key={t.id} t={t} />
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

const st = {
  erreur: {
    padding: "12px 16px",
    backgroundColor: "#FFF1F2",
    color: "#E11D48",
    borderRadius: "12px",
    fontSize: "14px",
    marginBottom: "16px",
  },
  empty: { fontSize: "13px", color: "#6B7280", margin: 0 },
  badge: { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },

  flotteItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #EEF2F7",
  },
  flotteLeft: { display: "flex", alignItems: "center", gap: "10px" },
  flottePoint: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  flotteLabel: { fontSize: "14px", color: "#4B5563" },
  flotteCount: { fontSize: "22px", fontWeight: "800" },
  flotteSub: { margin: "12px 0 0", fontSize: "13px", color: "#6B7280" },

  empGrid: { display: "flex", flexWrap: "wrap", gap: "10px" },
  empCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#F5F7FA",
    borderRadius: "12px",
    padding: "10px 14px",
    flex: "1 1 200px",
  },
  empAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#EEF2FF",
    color: "#304FFE",
    fontSize: "15px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  empNom: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1A1348",
    margin: "0 0 4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  empBadge: { padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" },

  trajetCard: {
    backgroundColor: "#F5F7FA",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    overflow: "hidden",
  },
  trajetHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    cursor: "pointer",
    gap: "12px",
    flexWrap: "wrap",
  },
  trajetHeaderLeft: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  trajetHeaderRight: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  busBadge: {
    backgroundColor: "#EEF2F7",
    color: "#1A1348",
    padding: "3px 10px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    fontFamily: "monospace",
  },
  typeBadge: { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  typeBadgeStd: { backgroundColor: "#EEF2FF", color: "#304FFE" },
  typeBadgeVip: { backgroundColor: "#F5F3FF", color: "#7C5CBF" },
  ligneName: { fontSize: "14px", color: "#4B5563", fontWeight: "500" },
  heureDepart: { fontSize: "16px", fontWeight: "800", color: "#26C2A1" },
  heureArrow: { fontSize: "14px", color: "#6B7280" },
  heureArrivee: { fontSize: "16px", fontWeight: "800", color: "#E11D48" },
  chevron: { fontSize: "11px", color: "#6B7280", marginLeft: "4px" },

  trajetDetails: {
    borderTop: "1px solid #E5E7EB",
    padding: "18px",
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
  },
  section: { flex: "1 1 260px" },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    margin: "0 0 12px",
  },

  timeline: { display: "flex", flexDirection: "column" },
  timelineRow: { display: "flex", gap: "12px" },
  timelineLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "14px",
    flexShrink: 0,
  },
  timelineDot: { borderRadius: "50%", flexShrink: 0, marginTop: "3px" },
  timelineLine: { width: "2px", flex: 1, backgroundColor: "#E5E7EB", minHeight: "16px" },
  timelineContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flex: 1,
    paddingBottom: "14px",
    gap: "8px",
  },
  timelineVille: { fontSize: "14px", lineHeight: "20px" },
  timelineHeure: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1A1348",
    whiteSpace: "nowrap",
  },
  arretTag: { fontSize: "11px", color: "#6B7280", fontWeight: "400" },

  tarifTable: { width: "100%", borderCollapse: "collapse" },
  tarifTh: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    padding: "6px 8px",
    borderBottom: "1px solid #EEF2F7",
    textAlign: "left",
  },
  tarifTr: { borderBottom: "1px solid #EEF2F7" },
  tarifTd: { fontSize: "13px", color: "#4B5563", padding: "8px 8px" },
};

export default ChefHomePage;
