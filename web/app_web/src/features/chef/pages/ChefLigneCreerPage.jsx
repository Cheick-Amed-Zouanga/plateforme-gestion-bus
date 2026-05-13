import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

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

// ─── Étape 1 : infos + départ / arrivée ──────────────────────────────────────

function EtapeInfos({ onSuivant }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: "", description: "", ville_depart: "", ville_arrivee: "" });
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(false);

  function set(name, val) {
    setForm(p => ({ ...p, [name]: val }));
    setErreur("");
  }

  async function handleSuivant(e) {
    e.preventDefault();
    if (!form.nom.trim())         { setErreur("Le nom est obligatoire."); return; }
    if (!form.ville_depart)       { setErreur("Choisissez la ville de départ."); return; }
    if (!form.ville_arrivee)      { setErreur("Choisissez la ville d'arrivée."); return; }
    if (form.ville_depart === form.ville_arrivee) { setErreur("Départ et arrivée doivent être différents."); return; }

    setLoading(true);
    try {
      const data = await apiFetch("/transport/lignes/arrets-potentiels/", {
        method: "POST",
        body: JSON.stringify({ ville_depart: form.ville_depart, ville_arrivee: form.ville_arrivee }),
      });
      onSuivant(form, data.arrets_potentiels);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  }

  const villesArrivee = VILLES.filter(v => v !== form.ville_depart);
  const villesDepart  = VILLES.filter(v => v !== form.ville_arrivee);

  return (
    <div style={st.card}>
      <h2 style={st.cardTitle}>Informations de la ligne</h2>
      {erreur && <div style={st.erreur}>{erreur}</div>}
      <form onSubmit={handleSuivant}>
        <div style={st.group}>
          <label style={st.label}>Nom de la ligne</label>
          <input style={st.input} name="nom" placeholder="Ex: Ouaga–Bobo Express"
            value={form.nom} onChange={e => set("nom", e.target.value)} />
        </div>
        <div style={st.group}>
          <label style={st.label}>Description <span style={st.hint}>(optionnel)</span></label>
          <textarea style={{ ...st.input, minHeight: "72px", resize: "vertical" }}
            name="description" placeholder="Description de la ligne…"
            value={form.description} onChange={e => set("description", e.target.value)} />
        </div>
        <div style={st.row2}>
          <div style={st.group}>
            <label style={st.label}>Ville de départ</label>
            <select style={st.input} value={form.ville_depart} onChange={e => set("ville_depart", e.target.value)}>
              <option value="">— Sélectionner —</option>
              {villesDepart.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div style={st.groupArrow}>→</div>
          <div style={st.group}>
            <label style={st.label}>Ville d'arrivée</label>
            <select style={st.input} value={form.ville_arrivee} onChange={e => set("ville_arrivee", e.target.value)}>
              <option value="">— Sélectionner —</option>
              {villesArrivee.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div style={st.btnRow}>
          <button type="button" style={st.btnBack} onClick={() => navigate("/chef/lignes")}>Retour</button>
          <button type="submit" style={{ ...st.btnPrimary, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? "Recherche des arrêts…" : "Rechercher les arrêts →"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Étape 2 : sélection des arrêts ──────────────────────────────────────────

function EtapeArrets({ infos, arretsPotentiels, onRetour }) {
  const navigate = useNavigate();

  // { [ville]: { selected, montee, descente, pause } }
  const [selection, setSelection] = useState(() => {
    const init = {};
    arretsPotentiels.forEach(a => {
      init[a.ville] = { selected: false, montee: 5, descente: 5, pause: 0 };
    });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur]   = useState("");

  function toggle(ville) {
    setSelection(p => ({ ...p, [ville]: { ...p[ville], selected: !p[ville].selected } }));
    setErreur("");
  }

  function setDuree(ville, champ, val) {
    setSelection(p => ({ ...p, [ville]: { ...p[ville], [champ]: Math.max(0, Number(val)) } }));
  }

  // Arrêts sélectionnés dans l'ordre de la route
  const arretsChoisis = arretsPotentiels.filter(a => selection[a.ville]?.selected);

  // Résumé de l'itinéraire
  const etapes = [infos.ville_depart, ...arretsChoisis.map(a => a.ville), infos.ville_arrivee];

  async function creerLigne() {
    setLoading(true);
    setErreur("");
    try {
      const arrets = arretsChoisis.map(a => ({
        ville:                    a.ville,
        duree_montee_passagers:   selection[a.ville].montee,
        duree_descente_passagers: selection[a.ville].descente,
        duree_pause:              selection[a.ville].pause,
      }));
      await apiFetch("/transport/lignes/", {
        method: "POST",
        body: JSON.stringify({
          nom:          infos.nom,
          description:  infos.description,
          ville_depart: infos.ville_depart,
          ville_arrivee:infos.ville_arrivee,
          arrets,
        }),
      });
      navigate("/chef/lignes");
    } catch (e) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Résumé itinéraire */}
      <div style={st.itineraireBar}>
        {etapes.map((e, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={i === 0 ? st.badgeDep : i === etapes.length - 1 ? st.badgeArr : st.badgeMid}>
              {e}
            </span>
            {i < etapes.length - 1 && <span style={st.fleche}>→</span>}
          </span>
        ))}
      </div>

      {erreur && <div style={st.erreur}>{erreur}</div>}

      {/* Arrêts potentiels */}
      <div style={st.card}>
        <h3 style={st.cardTitle}>
          Arrêts potentiels sur la route
          <span style={st.subtitle}> — cochez ceux que vous souhaitez inclure</span>
        </h3>

        {arretsPotentiels.length === 0 && (
          <p style={st.vide}>Aucun arrêt intermédiaire trouvé sur cet itinéraire.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {arretsPotentiels.map(arret => {
            const sel = selection[arret.ville];
            return (
              <div key={arret.ville} style={{ ...st.arretCard, ...(sel.selected ? st.arretCardActif : {}) }}>
                {/* En-tête de la carte */}
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

                {/* Formulaire durées (visible si sélectionné) */}
                {sel.selected && (
                  <div style={st.dureesGrid}>
                    <div>
                      <label style={st.labelSmall}>Montée passagers (min)</label>
                      <input style={st.inputSmall} type="number" min={0} value={sel.montee}
                        onChange={e => setDuree(arret.ville, "montee", e.target.value)} />
                    </div>
                    <div>
                      <label style={st.labelSmall}>Descente passagers (min)</label>
                      <input style={st.inputSmall} type="number" min={0} value={sel.descente}
                        onChange={e => setDuree(arret.ville, "descente", e.target.value)} />
                    </div>
                    <div>
                      <label style={st.labelSmall}>Pause à l'arrêt (min)</label>
                      <input style={st.inputSmall} type="number" min={0} value={sel.pause}
                        onChange={e => setDuree(arret.ville, "pause", e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Récap sélection */}
      {arretsChoisis.length > 0 && (
        <div style={st.recapBox}>
          <span style={st.recapLabel}>Arrêts sélectionnés :</span>
          {arretsChoisis.map(a => (
            <span key={a.ville} style={st.recapTag}>{a.ville}</span>
          ))}
        </div>
      )}

      <div style={st.btnRow}>
        <button style={st.btnBack} onClick={onRetour}>← Modifier</button>
        <button
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

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ChefLigneCreerPage() {
  const [etape, setEtape]   = useState(1);
  const [infos, setInfos]   = useState(null);
  const [arrets, setArrets] = useState([]);

  function handleSuivant(form, arretsPotentiels) {
    setInfos(form);
    setArrets(arretsPotentiels);
    setEtape(2);
  }

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title={etape === 1 ? "Créer une ligne" : "Choisir les arrêts"} />
      <main style={st.main}>

        <div style={st.stepper}>
          {["1. Infos & itinéraire", "2. Arrêts intermédiaires"].map((label, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ ...st.step, ...(etape >= i + 1 ? st.stepActif : {}) }}>{label}</span>
              {i === 0 && <span style={st.stepSep}>→</span>}
            </span>
          ))}
        </div>

        {etape === 1 && <EtapeInfos onSuivant={handleSuivant} />}
        {etape === 2 && (
          <EtapeArrets
            infos={infos}
            arretsPotentiels={arrets}
            onRetour={() => setEtape(1)}
          />
        )}

      </main>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = {
  page:        { minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" },
  main:        { maxWidth: "820px", margin: "0 auto", padding: "28px 20px 60px", display: "flex", flexDirection: "column", gap: "20px" },

  stepper:     { display: "flex", alignItems: "center", gap: "8px" },
  step:        { padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", color: "#6E7681", backgroundColor: "#161B22", border: "1.5px solid #30363D" },
  stepActif:   { color: "#79C0FF", borderColor: "#1C3260", backgroundColor: "#0D1F35" },
  stepSep:     { color: "#30363D" },

  card:        { backgroundColor: "#161B22", borderRadius: "12px", padding: "24px 26px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  cardTitle:   { fontSize: "15px", fontWeight: "700", color: "#E6EDF3", margin: "0 0 18px", paddingBottom: "10px", borderBottom: "1px solid #21262D" },
  subtitle:    { fontSize: "12px", fontWeight: "400", color: "#6E7681" },

  group:       { marginBottom: "16px", flex: 1 },
  row2:        { display: "flex", gap: "12px", alignItems: "flex-end", marginBottom: "16px" },
  groupArrow:  { color: "#30363D", fontSize: "20px", paddingBottom: "10px", whiteSpace: "nowrap" },
  label:       { display: "block", fontSize: "11px", fontWeight: "700", color: "#8B949E", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" },
  hint:        { fontWeight: "400", textTransform: "none", letterSpacing: 0, color: "#6E7681" },
  input:       { width: "100%", padding: "10px 14px", fontSize: "14px", borderRadius: "8px", border: "1.5px solid #30363D", backgroundColor: "#0D1117", color: "#E6EDF3", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  inputSmall:  { width: "100%", padding: "7px 10px", fontSize: "13px", borderRadius: "6px", border: "1.5px solid #30363D", backgroundColor: "#0D1117", color: "#E6EDF3", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  labelSmall:  { display: "block", fontSize: "11px", color: "#8B949E", marginBottom: "4px" },

  erreur:      { padding: "10px 14px", backgroundColor: "#2D1117", color: "#FF7B72", borderRadius: "8px", fontSize: "13px" },
  vide:        { color: "#6E7681", fontSize: "13px", textAlign: "center", padding: "24px 0" },

  btnRow:      { display: "flex", gap: "12px", justifyContent: "flex-end" },
  btnBack:     { padding: "10px 20px", fontSize: "14px", fontWeight: "600", color: "#8B949E", backgroundColor: "transparent", border: "1.5px solid #30363D", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" },
  btnPrimary:  { padding: "10px 24px", fontSize: "14px", fontWeight: "700", color: "#fff", backgroundColor: "#0E7490", border: "none", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" },

  itineraireBar: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", padding: "12px 16px", backgroundColor: "#161B22", borderRadius: "10px", border: "1px solid #21262D" },
  badgeDep:    { padding: "4px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", backgroundColor: "#112D1F", color: "#56D364" },
  badgeArr:    { padding: "4px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", backgroundColor: "#2D1117", color: "#FF7B72" },
  badgeMid:    { padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", backgroundColor: "#1C2A3A", color: "#79C0FF" },
  fleche:      { color: "#30363D", fontSize: "14px" },

  arretCard:   { border: "1.5px solid #30363D", borderRadius: "10px", backgroundColor: "#0D1117", overflow: "hidden" },
  arretCardActif: { borderColor: "#1C3260", backgroundColor: "#0A1628" },
  arretHeader: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", cursor: "pointer" },
  checkboxWrap:{ flexShrink: 0 },
  checkbox:    { width: "20px", height: "20px", borderRadius: "4px", border: "2px solid #30363D", backgroundColor: "#161B22", display: "flex", alignItems: "center", justifyContent: "center" },
  checkboxActif: { backgroundColor: "#0E7490", borderColor: "#0E7490" },
  checkMark:   { color: "#fff", fontSize: "13px", lineHeight: 1 },
  arretNom:    { fontSize: "14px", fontWeight: "600", color: "#E6EDF3" },
  arretMeta:   { display: "flex", gap: "16px", flexShrink: 0 },
  metaItem:    { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  metaLabel:   { fontSize: "10px", color: "#6E7681", textTransform: "uppercase", letterSpacing: "0.5px" },
  metaVal:     { fontSize: "13px", fontWeight: "600", color: "#8B949E" },
  dureesGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", padding: "12px 16px", borderTop: "1px solid #1C2A3A", backgroundColor: "#050D1A" },

  recapBox:    { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", padding: "10px 14px", backgroundColor: "#112D1F", borderRadius: "8px", border: "1px solid #1B4332" },
  recapLabel:  { fontSize: "12px", fontWeight: "700", color: "#56D364" },
  recapTag:    { padding: "2px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", backgroundColor: "#1B4332", color: "#56D364" },
};
