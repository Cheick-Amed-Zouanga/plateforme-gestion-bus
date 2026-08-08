import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../../../shared/services/api";
import Modal from "../../../shared/components/Modal";

const VILLES = [
  "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya",
  "Fada N'Gourma", "Dédougou", "Kaya", "Tenkodogo", "Gaoua",
  "Ziniaré", "Kongoussi", "Réo", "Houndé", "Diébougou",
  "Léo", "Manga", "Toma", "Nouna", "Tougan", "Pô", "Bogandé", "Gayéri",
  "Sebba", "Titao",
].sort();

function fmtMin(min) {
  if (!min && min !== 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m} min`;
}

function EtapeInfos({ onSuivant, onCancel }) {
  const [form, setForm] = useState({ nom: "", description: "", ville_depart: "", ville_arrivee: "" });
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(false);

  function set(name, val) {
    setForm((p) => ({ ...p, [name]: val }));
    setErreur("");
  }

  async function handleSuivant(e) {
    e.preventDefault();
    if (!form.nom.trim()) {
      setErreur("Le nom est obligatoire.");
      return;
    }
    if (!form.ville_depart) {
      setErreur("Choisissez la ville de départ.");
      return;
    }
    if (!form.ville_arrivee) {
      setErreur("Choisissez la ville d'arrivée.");
      return;
    }
    if (form.ville_depart === form.ville_arrivee) {
      setErreur("Départ et arrivée doivent être différents.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch("/transport/lignes/arrets-potentiels/", {
        method: "POST",
        body: JSON.stringify({
          ville_depart: form.ville_depart,
          ville_arrivee: form.ville_arrivee,
        }),
      });
      onSuivant(form, data.arrets_potentiels);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }

  const villesArrivee = VILLES.filter((v) => v !== form.ville_depart);
  const villesDepart = VILLES.filter((v) => v !== form.ville_arrivee);

  return (
    <div style={st.card}>
      <h2 style={st.cardTitle}>Informations de la ligne</h2>
      {erreur && <div style={st.erreur}>{erreur}</div>}
      <form onSubmit={handleSuivant}>
        <div style={st.group}>
          <label style={st.label}>Nom de la ligne</label>
          <input
            style={st.input}
            name="nom"
            placeholder="Ex: Ouaga–Bobo Express"
            value={form.nom}
            onChange={(e) => set("nom", e.target.value)}
          />
        </div>
        <div style={st.group}>
          <label style={st.label}>
            Description <span style={st.hint}>(optionnel)</span>
          </label>
          <textarea
            style={{ ...st.input, minHeight: "72px", resize: "vertical" }}
            name="description"
            placeholder="Description de la ligne…"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div style={st.row2}>
          <div style={st.group}>
            <label style={st.label}>Ville de départ</label>
            <select
              style={st.input}
              value={form.ville_depart}
              onChange={(e) => set("ville_depart", e.target.value)}
            >
              <option value="">— Sélectionner —</option>
              {villesDepart.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div style={st.groupArrow}>→</div>
          <div style={st.group}>
            <label style={st.label}>Ville d'arrivée</label>
            <select
              style={st.input}
              value={form.ville_arrivee}
              onChange={(e) => set("ville_arrivee", e.target.value)}
            >
              <option value="">— Sélectionner —</option>
              {villesArrivee.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={st.btnRow}>
          <button type="button" style={st.btnBack} onClick={onCancel}>
            Annuler
          </button>
          <button
            type="submit"
            style={{ ...st.btnPrimary, opacity: loading ? 0.6 : 1 }}
            disabled={loading}
          >
            {loading ? "Recherche des arrêts…" : "Rechercher les arrêts →"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EtapeArrets({ infos, arretsPotentiels, onRetour, onSuccess }) {
  const [selection, setSelection] = useState(() => {
    const init = {};
    arretsPotentiels.forEach((a) => {
      init[a.ville] = { selected: false, montee: 5, descente: 5, pause: 0 };
    });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");

  function toggle(ville) {
    setSelection((p) => ({
      ...p,
      [ville]: { ...p[ville], selected: !p[ville].selected },
    }));
    setErreur("");
  }

  function setDuree(ville, champ, val) {
    setSelection((p) => ({
      ...p,
      [ville]: { ...p[ville], [champ]: Math.max(0, Number(val)) },
    }));
  }

  const arretsChoisis = arretsPotentiels.filter((a) => selection[a.ville]?.selected);
  const etapes = [infos.ville_depart, ...arretsChoisis.map((a) => a.ville), infos.ville_arrivee];

  async function creerLigne() {
    setLoading(true);
    setErreur("");
    try {
      const arrets = arretsChoisis.map((a) => ({
        ville: a.ville,
        duree_montee_passagers: selection[a.ville].montee,
        duree_descente_passagers: selection[a.ville].descente,
        duree_pause: selection[a.ville].pause,
      }));
      await apiFetch("/transport/lignes/", {
        method: "POST",
        body: JSON.stringify({
          nom: infos.nom,
          description: infos.description,
          ville_depart: infos.ville_depart,
          ville_arrivee: infos.ville_arrivee,
          arrets,
        }),
      });
      onSuccess?.();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={st.itineraireBar}>
        {etapes.map((e, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={
                i === 0 ? st.badgeDep : i === etapes.length - 1 ? st.badgeArr : st.badgeMid
              }
            >
              {e}
            </span>
            {i < etapes.length - 1 && <span style={st.fleche}>→</span>}
          </span>
        ))}
      </div>

      {erreur && <div style={st.erreur}>{erreur}</div>}

      <div style={st.card}>
        <h3 style={st.cardTitle}>
          Arrêts potentiels sur la route
          <span style={st.subtitle}> — cochez ceux que vous souhaitez inclure</span>
        </h3>

        {arretsPotentiels.length === 0 && (
          <p style={st.vide}>Aucun arrêt intermédiaire trouvé sur cet itinéraire.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {arretsPotentiels.map((arret) => {
            const sel = selection[arret.ville];
            return (
              <div
                key={arret.ville}
                style={{ ...st.arretCard, ...(sel.selected ? st.arretCardActif : {}) }}
              >
                <div style={st.arretHeader} onClick={() => toggle(arret.ville)}>
                  <div style={st.checkboxWrap}>
                    <div style={{ ...st.checkbox, ...(sel.selected ? st.checkboxActif : {}) }}>
                      {sel.selected && <span style={st.checkMark}>✓</span>}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={st.arretNom}>{arret.ville}</span>
                  </div>
                  <div style={st.arretMeta}>
                    <span style={st.metaItem}>
                      <span style={st.metaLabel}>Distance</span>
                      <span style={st.metaVal}>{arret.distance_depuis_depart_km} km</span>
                    </span>
                    <span style={st.metaItem}>
                      <span style={st.metaLabel}>Durée route</span>
                      <span style={st.metaVal}>{fmtMin(arret.duree_depuis_depart_min)}</span>
                    </span>
                  </div>
                </div>

                {sel.selected && (
                  <div style={st.dureesGrid}>
                    <div>
                      <label style={st.labelSmall}>Montée passagers (min)</label>
                      <input
                        style={st.inputSmall}
                        type="number"
                        min={0}
                        value={sel.montee}
                        onChange={(e) => setDuree(arret.ville, "montee", e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={st.labelSmall}>Descente passagers (min)</label>
                      <input
                        style={st.inputSmall}
                        type="number"
                        min={0}
                        value={sel.descente}
                        onChange={(e) => setDuree(arret.ville, "descente", e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={st.labelSmall}>Pause à l'arrêt (min)</label>
                      <input
                        style={st.inputSmall}
                        type="number"
                        min={0}
                        value={sel.pause}
                        onChange={(e) => setDuree(arret.ville, "pause", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {arretsChoisis.length > 0 && (
        <div style={st.recapBox}>
          <span style={st.recapLabel}>Arrêts sélectionnés :</span>
          {arretsChoisis.map((a) => (
            <span key={a.ville} style={st.recapTag}>
              {a.ville}
            </span>
          ))}
        </div>
      )}

      <div style={st.btnRow}>
        <button type="button" style={st.btnBack} onClick={onRetour}>
          ← Modifier
        </button>
        <button
          type="button"
          style={{ ...st.btnPrimary, opacity: loading ? 0.6 : 1 }}
          onClick={creerLigne}
          disabled={loading}
        >
          {loading ? "Création en cours…" : `Créer la ligne (${etapes.length} arrêts)`}
        </button>
      </div>
    </div>
  );
}

export function ChefLigneCreerForm({ onCancel, onSuccess }) {
  const [etape, setEtape] = useState(1);
  const [infos, setInfos] = useState(null);
  const [arrets, setArrets] = useState([]);

  function handleSuivant(form, arretsPotentiels) {
    setInfos(form);
    setArrets(arretsPotentiels);
    setEtape(2);
  }

  return (
    <div style={st.main}>
      <div style={st.stepper}>
        {["1. Infos & itinéraire", "2. Arrêts intermédiaires"].map((label, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ ...st.step, ...(etape >= i + 1 ? st.stepActif : {}) }}>{label}</span>
            {i === 0 && <span style={st.stepSep}>→</span>}
          </span>
        ))}
      </div>

      {etape === 1 && <EtapeInfos onSuivant={handleSuivant} onCancel={onCancel} />}
      {etape === 2 && (
        <EtapeArrets
          infos={infos}
          arretsPotentiels={arrets}
          onRetour={() => setEtape(1)}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}

export default function ChefLigneCreerPage() {
  const navigate = useNavigate();
  const close = () => navigate("/chef/lignes");

  return (
    <Modal open wide title="Créer une ligne" onClose={close}>
      <ChefLigneCreerForm onCancel={close} onSuccess={close} />
    </Modal>
  );
}

const st = {
  main: { display: "flex", flexDirection: "column", gap: "16px" },

  stepper: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  step: {
    padding: "5px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6B7280",
    backgroundColor: "#F5F7FA",
    border: "1.5px solid #E5E7EB",
  },
  stepActif: {
    color: "#304FFE",
    borderColor: "#304FFE",
    backgroundColor: "#EEF0FF",
  },
  stepSep: { color: "#E5E7EB" },

  card: {
    backgroundColor: "#F8FAFC",
    borderRadius: "12px",
    padding: "18px 20px",
    border: "1px solid #E5E7EB",
  },
  cardTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#1A1348",
    margin: "0 0 18px",
    paddingBottom: "10px",
    borderBottom: "1px solid #EEF2F7",
  },
  subtitle: { fontSize: "12px", fontWeight: "400", color: "#6B7280" },

  group: { marginBottom: "16px", flex: 1 },
  row2: { display: "flex", gap: "12px", alignItems: "flex-end", marginBottom: "16px" },
  groupArrow: {
    color: "#9CA3AF",
    fontSize: "20px",
    paddingBottom: "10px",
    whiteSpace: "nowrap",
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "6px",
  },
  hint: {
    fontWeight: "400",
    textTransform: "none",
    letterSpacing: 0,
    color: "#6B7280",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1.5px solid #E5E7EB",
    color: "#1A1348",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    background: "#fff",
  },
  inputSmall: {
    width: "100%",
    padding: "7px 10px",
    fontSize: "13px",
    borderRadius: "6px",
    border: "1.5px solid #E5E7EB",
    color: "#1A1348",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    background: "#fff",
  },
  labelSmall: { display: "block", fontSize: "11px", color: "#6B7280", marginBottom: "4px" },

  erreur: {
    padding: "10px 14px",
    backgroundColor: "#FEF2F2",
    color: "#E11D48",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "12px",
  },
  vide: { color: "#6B7280", fontSize: "13px", textAlign: "center", padding: "24px 0" },

  btnRow: { display: "flex", gap: "12px", justifyContent: "flex-end" },
  btnBack: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#6B7280",
    backgroundColor: "transparent",
    border: "1.5px solid #E5E7EB",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnPrimary: {
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "#304FFE",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  itineraireBar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "6px",
    padding: "12px 16px",
    backgroundColor: "#F8FAFC",
    borderRadius: "10px",
    border: "1px solid #EEF2F7",
  },
  badgeDep: {
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "700",
    backgroundColor: "#E6F9F4",
    color: "#0E7490",
  },
  badgeArr: {
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "700",
    backgroundColor: "#FEE2E2",
    color: "#E11D48",
  },
  badgeMid: {
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#EEF0FF",
    color: "#304FFE",
  },
  fleche: { color: "#9CA3AF", fontSize: "14px" },

  arretCard: { border: "1.5px solid #E5E7EB", borderRadius: "10px", overflow: "hidden", background: "#fff" },
  arretCardActif: { borderColor: "#304FFE", backgroundColor: "#F5F7FF" },
  arretHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    cursor: "pointer",
  },
  checkboxWrap: { flexShrink: 0 },
  checkbox: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    border: "2px solid #E5E7EB",
    backgroundColor: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActif: { backgroundColor: "#304FFE", borderColor: "#304FFE" },
  checkMark: { color: "#fff", fontSize: "13px", lineHeight: 1 },
  arretNom: { fontSize: "14px", fontWeight: "600", color: "#1A1348" },
  arretMeta: { display: "flex", gap: "16px", flexShrink: 0 },
  metaItem: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  metaLabel: {
    fontSize: "10px",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  metaVal: { fontSize: "13px", fontWeight: "600", color: "#6B7280" },
  dureesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
    padding: "12px 16px",
    borderTop: "1px solid #E5E7EB",
    backgroundColor: "#F8FAFC",
  },

  recapBox: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    backgroundColor: "#E6F9F4",
    borderRadius: "8px",
    border: "1px solid #A7F3D0",
  },
  recapLabel: { fontSize: "12px", fontWeight: "700", color: "#0E7490" },
  recapTag: {
    padding: "2px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#CCFBF1",
    color: "#0E7490",
  },
};
