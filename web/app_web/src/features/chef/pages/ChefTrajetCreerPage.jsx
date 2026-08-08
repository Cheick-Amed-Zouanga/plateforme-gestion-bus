import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import { darkFormStyles } from "../../../shared/styles/darkTheme";
import apiFetch from "../../../shared/services/api";

export default function ChefTrajetCreerPage() {
  const navigate = useNavigate();
  const s = darkFormStyles();

  const [lignes, setLignes]   = useState([]);
  const [bus, setBus]         = useState([]);
  const [form, setForm]       = useState({ ligne: "", bus: "", depart_prevu: "", arrivee_prevue: "" });
  const [erreur, setErreur]   = useState("");
  const [succes, setSucces]   = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch("/transport/lignes/"),
      apiFetch("/transport/bus/"),
    ]).then(([l, b]) => {
      setLignes(l.filter(x => x.active));
      setBus(b.filter(x => x.actif));
    }).catch(e => setErreur(e.message));
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErreur("");
    setSucces("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.ligne)        { setErreur("Veuillez choisir une ligne."); return; }
    if (!form.bus)          { setErreur("Veuillez choisir un bus."); return; }
    if (!form.depart_prevu) { setErreur("La date de départ est obligatoire."); return; }
    if (form.arrivee_prevue && form.arrivee_prevue <= form.depart_prevu) {
      setErreur("L'heure d'arrivée doit être après l'heure de départ."); return;
    }

    setLoading(true);
    try {
      const body = {
        ligne:        Number(form.ligne),
        bus:          Number(form.bus),
        depart_prevu: form.depart_prevu,
      };
      if (form.arrivee_prevue) body.arrivee_prevue = form.arrivee_prevue;

      await apiFetch("/transport/trajets/", { method: "POST", body: JSON.stringify(body) });
      setSucces("Trajet créé avec succès.");
      setForm({ ligne: "", bus: "", depart_prevu: "", arrivee_prevue: "" });
    } catch (e) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <Header />
      <SubHeader title="Nouveau trajet" />
      <main style={s.main}>
        <div style={s.card}>
          <h2 style={st.title}>Planifier un trajet</h2>

          {erreur && <div style={s.error}>{erreur}</div>}
          {succes && <div style={s.success}>{succes}</div>}

          <form onSubmit={handleSubmit}>
            <div style={s.group}>
              <label style={s.label}>Ligne</label>
              <select style={s.input} name="ligne" value={form.ligne} onChange={handleChange}>
                <option value="">— Sélectionner une ligne —</option>
                {lignes.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.nom} {l.depart && l.arrivee ? `(${l.depart} → ${l.arrivee})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div style={s.group}>
              <label style={s.label}>Bus</label>
              <select style={s.input} name="bus" value={form.bus} onChange={handleChange}>
                <option value="">— Sélectionner un bus —</option>
                {bus.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.immatriculation} — {b.type_bus_display} ({b.capacite} places)
                  </option>
                ))}
              </select>
            </div>

            <div style={s.group}>
              <label style={s.label}>Date et heure de départ</label>
              <input style={s.input} type="datetime-local" name="depart_prevu"
                value={form.depart_prevu} onChange={handleChange} />
            </div>

            <div style={s.group}>
              <label style={s.label}>
                Date et heure d'arrivée prévue
                <span style={st.optionnel}> (optionnel)</span>
              </label>
              <input style={s.input} type="datetime-local" name="arrivee_prevue"
                value={form.arrivee_prevue} onChange={handleChange} />
            </div>

            <div style={s.btnRow}>
              <button type="button" style={s.btnBack} onClick={() => navigate("/chef/trajets")}>Retour</button>
              <button type="submit" style={{ ...s.btnSubmit, opacity: loading ? 0.6 : 1 }} disabled={loading}>
                {loading ? "Création…" : "Créer le trajet"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

const st = {
  title:     { fontSize: "18px", fontWeight: "700", color: "#E6EDF3", marginBottom: "24px" },
  optionnel: { fontSize: "11px", fontWeight: "400", color: "#6E7681", textTransform: "none", letterSpacing: "0" },
};
