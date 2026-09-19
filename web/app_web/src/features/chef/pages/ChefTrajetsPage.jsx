import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../../../shared/services/api";
import Modal from "../../../shared/components/Modal";
import BusSeatPlan from "../../../shared/components/BusSeatPlan";
import { ChefHoraireCreerForm } from "./ChefTrajetCreerPage";

const STATUT_COLORS = {
  PLANIFIE: { bg: "#1C3260", color: "#79C0FF" },
  EN_COURS: { bg: "#2D1F00", color: "#F0883E" },
  TERMINE:  { bg: "#112D1F", color: "#26C2A1" },
  ANNULE:   { bg: "#2D1117", color: "#E11D48" },
};

const STATUTS = [
  { val: "PLANIFIE", label: "Planifié" },
  { val: "EN_COURS", label: "En cours" },
  { val: "TERMINE",  label: "Terminé" },
  { val: "ANNULE",   label: "Annulé" },
];

function fmt(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtHeure(t) {
  if (!t) return "—";
  return String(t).slice(0, 5);
}

export default function ChefTrajetsPage() {
  const navigate = useNavigate();
  const [onglet, setOnglet] = useState("horaires");
  const [trajets, setTrajets] = useState([]);
  const [horaires, setHoraires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");
  const [filtre, setFiltre] = useState("TOUS");
  const [actionId, setActionId] = useState(null);
  const [editStatut, setEditStatut] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editHoraire, setEditHoraire] = useState(null);
  const [planTrajet, setPlanTrajet] = useState(null);
  const [plan, setPlan] = useState([]);
  const [planStats, setPlanStats] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const charger = useCallback(() => {
    setLoading(true);
    setErreur("");
    Promise.all([
      apiFetch("/transport/horaires/"),
      apiFetch("/transport/trajets/"),
    ])
      .then(([h, t]) => {
        setHoraires(Array.isArray(h) ? h : []);
        setTrajets(Array.isArray(t) ? t : []);
      })
      .catch((e) => setErreur(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  async function changerStatut(t, statut) {
    setActionId(t.id);
    try {
      await apiFetch(`/transport/trajets/${t.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ statut }),
      });
      setTrajets((prev) =>
        prev.map((x) =>
          x.id === t.id
            ? { ...x, statut, statut_display: STATUTS.find((s) => s.val === statut)?.label ?? statut }
            : x
        )
      );
      setEditStatut((p) => ({ ...p, [t.id]: undefined }));
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
      setTrajets((prev) => prev.filter((x) => x.id !== t.id));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setActionId(null);
    }
  }

  async function genererHoraire(h) {
    setActionId(`h-${h.id}`);
    try {
      const res = await apiFetch(`/transport/horaires/${h.id}/generer/`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setErreur("");
      alert(res.message || "Prochains départs prêts.");
      charger();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setActionId(null);
    }
  }

  async function toggleActif(h) {
    setActionId(`h-${h.id}`);
    try {
      await apiFetch(`/transport/horaires/${h.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ actif: !h.actif }),
      });
      charger();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setActionId(null);
    }
  }

  async function supprimerHoraire(h) {
    if (!window.confirm(`Supprimer cet horaire (${h.ligne_display} ${fmtHeure(h.heure_depart)}) ?\nLes trajets déjà générés restent.`)) return;
    setActionId(`h-${h.id}`);
    try {
      await apiFetch(`/transport/horaires/${h.id}/`, { method: "DELETE" });
      setHoraires((prev) => prev.filter((x) => x.id !== h.id));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setActionId(null);
    }
  }

  async function ouvrirPlan(t) {
    setPlanTrajet(t);
    setPlan([]);
    setPlanStats(null);
    setLoadingPlan(true);
    setErreur("");
    try {
      const data = await apiFetch(`/billets/trajets/${t.id}/plan/`);
      setPlan(data.plan ?? []);
      setPlanStats(data.stats ?? null);
    } catch (e) {
      setErreur(e.message);
      setPlanTrajet(null);
    } finally {
      setLoadingPlan(false);
    }
  }

  const trajetsFiltres = filtre === "TOUS" ? trajets : trajets.filter((t) => t.statut === filtre);

  return (
    <div style={st.page}>
      <main style={st.main}>
        <button style={st.btnBack} onClick={() => navigate("/chef")}>← Tableau de bord</button>

        <div style={st.onglets}>
          <button
            style={{ ...st.onglet, ...(onglet === "horaires" ? st.ongletActif : {}) }}
            onClick={() => setOnglet("horaires")}
          >
            Horaires ({horaires.length})
          </button>
          <button
            style={{ ...st.onglet, ...(onglet === "trajets" ? st.ongletActif : {}) }}
            onClick={() => setOnglet("trajets")}
          >
            Trajets générés ({trajets.length})
          </button>
        </div>

        <div style={st.topBar}>
          {onglet === "trajets" ? (
            <div style={st.filtres}>
              <button style={{ ...st.filtrBtn, ...(filtre === "TOUS" ? st.filtrActif : {}) }} onClick={() => setFiltre("TOUS")}>
                Tous ({trajets.length})
              </button>
              {STATUTS.map((f) => {
                const count = trajets.filter((t) => t.statut === f.val).length;
                return (
                  <button
                    key={f.val}
                    style={{ ...st.filtrBtn, ...(filtre === f.val ? st.filtrActif : {}) }}
                    onClick={() => setFiltre(f.val)}
                  >
                    {f.label} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={st.sub}>Définissez l&apos;heure et les jours sur une ligne (ex. 08:00 tous les jours). Heure locale Burkina Faso.</p>
          )}
          <button style={st.btnAdd} onClick={() => { setEditHoraire(null); setModalOpen(true); }}>
            + Nouvel horaire
          </button>
        </div>

        <Modal
          open={modalOpen}
          title={editHoraire ? "Modifier l'horaire" : "Nouvel horaire récurrent"}
          onClose={() => { setModalOpen(false); setEditHoraire(null); }}
        >
          <ChefHoraireCreerForm
            horaire={editHoraire}
            onCancel={() => { setModalOpen(false); setEditHoraire(null); }}
            onSuccess={() => {
              setModalOpen(false);
              setEditHoraire(null);
              setOnglet("horaires");
              charger();
            }}
          />
        </Modal>

        <Modal
          open={!!planTrajet}
          wide
          title={
            planTrajet
              ? `Plan du bus — ${planTrajet.bus_display || ""} · ${planTrajet.ligne_display || ""}`
              : "Plan du bus"
          }
          onClose={() => setPlanTrajet(null)}
        >
          {loadingPlan ? (
            <p style={{ color: "#6B7280", margin: 0 }}>Chargement du plan…</p>
          ) : (
            <BusSeatPlan plan={plan} stats={planStats} selectableOnlyLibre={false} />
          )}
        </Modal>

        {erreur && <div style={st.erreur}>{erreur}</div>}

        {onglet === "horaires" ? (
          <div style={st.card}>
            <table style={st.table}>
              <thead>
                <tr>
                  {["Ligne", "Heure", "Jours", "Type", "Bus défaut", "Actif", "Actions"].map((h) => (
                    <th key={h} style={st.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} style={st.empty}>Chargement…</td></tr>}
                {!loading && horaires.length === 0 && (
                  <tr><td colSpan={7} style={st.empty}>Aucun horaire. Créez-en un pour générer les trajets.</td></tr>
                )}
                {horaires.map((h) => {
                  const busy = actionId === `h-${h.id}`;
                  return (
                    <tr key={h.id} style={st.tr}>
                      <td style={st.td}>{h.ligne_display}</td>
                      <td style={st.td}><strong>{fmtHeure(h.heure_depart)}</strong></td>
                      <td style={st.td}>{(h.jours_labels || []).join(", ") || "—"}</td>
                      <td style={st.td}>{h.type_bus_display || h.type_bus}</td>
                      <td style={st.td}>{h.bus_defaut_display || "Auto"}</td>
                      <td style={st.td}>
                        <span style={{
                          ...st.badge,
                          backgroundColor: h.actif ? "#112D1F" : "#2D1117",
                          color: h.actif ? "#26C2A1" : "#E11D48",
                        }}>
                          {h.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td style={st.td}>
                        <div style={st.actions}>
                          <button
                            style={st.btnModif}
                            onClick={() => { setEditHoraire(h); setModalOpen(true); }}
                            disabled={busy}
                          >
                            Modifier
                          </button>
                          <button style={st.btnPlan} onClick={() => genererHoraire(h)} disabled={busy}>
                            Préparer départs
                          </button>
                          <button style={st.btnModif} onClick={() => toggleActif(h)} disabled={busy}>
                            {h.actif ? "Désactiver" : "Activer"}
                          </button>
                          <button style={st.btnDanger} onClick={() => supprimerHoraire(h)} disabled={busy}>
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={st.card}>
            <table style={st.table}>
              <thead>
                <tr>
                  {["Ligne", "Bus", "Départ prévu", "Arrivée prévue", "Statut", "Actions"].map((h) => (
                    <th key={h} style={st.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} style={st.empty}>Chargement…</td></tr>}
                {!loading && trajetsFiltres.length === 0 && (
                  <tr><td colSpan={6} style={st.empty}>Aucun trajet pour ce filtre.</td></tr>
                )}
                {trajetsFiltres.map((t) => {
                  const c = STATUT_COLORS[t.statut] ?? { bg: "#EEF2F7", color: "#1A1348" };
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
                          <button style={st.btnPlan} onClick={() => ouvrirPlan(t)}>Places</button>
                          {t.statut !== "TERMINE" && t.statut !== "ANNULE" && (
                            nouveauStatut !== undefined ? (
                              <span style={st.statutEdit}>
                                <select
                                  style={st.selectStatut}
                                  value={nouveauStatut}
                                  onChange={(e) => setEditStatut((p) => ({ ...p, [t.id]: e.target.value }))}
                                >
                                  {STATUTS.filter((s) => s.val !== t.statut).map((s) => (
                                    <option key={s.val} value={s.val}>{s.label}</option>
                                  ))}
                                </select>
                                <button style={st.btnOk} onClick={() => changerStatut(t, nouveauStatut)} disabled={en_cours}>✓</button>
                                <button style={st.btnAnnuler} onClick={() => setEditStatut((p) => ({ ...p, [t.id]: undefined }))}>✕</button>
                              </span>
                            ) : (
                              <button
                                style={st.btnModif}
                                onClick={() => setEditStatut((p) => ({
                                  ...p,
                                  [t.id]: STATUTS.find((s) => s.val !== t.statut)?.val,
                                }))}
                              >
                                Statut
                              </button>
                            )
                          )}
                          {t.statut !== "EN_COURS" && (
                            <button
                              style={{ ...st.btnDanger, opacity: en_cours ? 0.5 : 1 }}
                              onClick={() => supprimerTrajet(t)}
                              disabled={en_cours}
                            >
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
        )}
      </main>
    </div>
  );
}

const st = {
  page:       { fontFamily: "'Poppins', 'Segoe UI', sans-serif" },
  main:       { maxWidth: "1200px", margin: "0 auto", padding: "32px 20px" },
  onglets:    { display: "flex", gap: "8px", marginBottom: "16px" },
  onglet:     { padding: "10px 16px", fontSize: "13px", fontWeight: "700", borderRadius: "8px", border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", cursor: "pointer", fontFamily: "inherit" },
  ongletActif:{ background: "#EEF2F7", color: "#1A1348", borderColor: "#58A6FF" },
  topBar:     { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" },
  sub:        { margin: 0, fontSize: "13px", color: "#6B7280", maxWidth: "520px" },
  filtres:    { display: "flex", gap: "6px", flexWrap: "wrap" },
  filtrBtn:   { padding: "6px 12px", fontSize: "12px", fontWeight: "600", color: "#6B7280", backgroundColor: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  filtrActif: { backgroundColor: "#EEF2F7", color: "#1A1348", borderColor: "#58A6FF" },
  btnAdd:     { padding: "10px 20px", fontSize: "14px", fontWeight: "700", color: "#fff", backgroundColor: "#26C2A1", border: "none", borderRadius: "8px", cursor: "pointer", whiteSpace: "nowrap" },
  erreur:     { padding: "12px 16px", backgroundColor: "#2D1117", color: "#E11D48", borderRadius: "8px", fontSize: "14px", marginBottom: "16px" },
  card:       { backgroundColor: "#FFFFFF", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { padding: "14px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #E5E7EB", backgroundColor: "#F5F7FA" },
  tr:         { borderBottom: "1px solid #EEF2F7" },
  td:         { padding: "12px 16px", fontSize: "13px", color: "#1A1348" },
  empty:      { padding: "32px", textAlign: "center", color: "#6B7280", fontSize: "14px" },
  immat:      { fontFamily: "monospace", fontSize: "13px", color: "#79C0FF" },
  badge:      { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  btnBack:    { marginBottom: "16px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", color: "#6B7280", backgroundColor: "transparent", border: "1.5px solid #E5E7EB", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" },
  actions:    { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" },
  btnPlan:    { padding: "4px 10px", fontSize: "12px", fontWeight: "600", color: "#304FFE", backgroundColor: "#EEF0FF", border: "1.5px solid #304FFE", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  btnModif:   { padding: "4px 10px", fontSize: "12px", fontWeight: "600", color: "#79C0FF", backgroundColor: "transparent", border: "1.5px solid #1C3260", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  btnDanger:  { padding: "4px 10px", fontSize: "12px", fontWeight: "600", color: "#E11D48", backgroundColor: "transparent", border: "1.5px solid #E11D48", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  statutEdit: { display: "flex", alignItems: "center", gap: "4px" },
  selectStatut: { padding: "3px 6px", fontSize: "12px", borderRadius: "4px", border: "1px solid #E5E7EB", color: "#1A1348", outline: "none", fontFamily: "inherit" },
  btnOk:      { padding: "3px 8px", fontSize: "12px", fontWeight: "700", color: "#26C2A1", backgroundColor: "transparent", border: "1px solid #26C2A1", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" },
  btnAnnuler: { padding: "3px 8px", fontSize: "12px", fontWeight: "700", color: "#6B7280", backgroundColor: "transparent", border: "1px solid #E5E7EB", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" },
};
