import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { darkFormStyles } from "../../../shared/styles/darkTheme";
import apiFetch from "../../../shared/services/api";
import Modal from "../../../shared/components/Modal";

const JOURS = [
  { val: 0, label: "Lun" },
  { val: 1, label: "Mar" },
  { val: 2, label: "Mer" },
  { val: 3, label: "Jeu" },
  { val: 4, label: "Ven" },
  { val: 5, label: "Sam" },
  { val: 6, label: "Dim" },
];

const emptyForm = {
  ligne: "",
  heure_depart: "08:00",
  jours: [0, 1, 2, 3, 4, 5, 6],
  type_bus: "STANDARD",
  bus_defaut: "",
  duree_estimee_min: "",
  date_debut: "",
  date_fin: "",
  actif: true,
};

function formFromHoraire(h) {
  if (!h) return emptyForm;
  return {
    ligne: String(h.ligne ?? ""),
    heure_depart: String(h.heure_depart || "08:00").slice(0, 5),
    jours: Array.isArray(h.jours_list) && h.jours_list.length
      ? [...h.jours_list]
      : [0, 1, 2, 3, 4, 5, 6],
    type_bus: h.type_bus || "STANDARD",
    bus_defaut: h.bus_defaut ? String(h.bus_defaut) : "",
    duree_estimee_min: h.duree_estimee_min != null ? String(h.duree_estimee_min) : "",
    date_debut: h.date_debut || "",
    date_fin: h.date_fin || "",
    actif: h.actif !== false,
  };
}

/** Formulaire création / modification d'un horaire récurrent. */
export function ChefHoraireCreerForm({ onCancel, onSuccess, horaire = null }) {
  const s = darkFormStyles();
  const isEdit = !!horaire?.id;
  const [lignes, setLignes] = useState([]);
  const [bus, setBus] = useState([]);
  const [form, setForm] = useState(() => formFromHoraire(horaire));
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(formFromHoraire(horaire));
  }, [horaire]);

  useEffect(() => {
    Promise.all([apiFetch("/transport/lignes/"), apiFetch("/transport/bus/")])
      .then(([l, b]) => {
        setLignes(l.filter((x) => x.active));
        setBus(b.filter((x) => x.actif));
      })
      .catch((e) => setErreur(e.message));
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErreur("");
    setSucces("");
  }

  function toggleJour(val) {
    setForm((prev) => {
      const has = prev.jours.includes(val);
      const jours = has ? prev.jours.filter((j) => j !== val) : [...prev.jours, val].sort();
      return { ...prev, jours };
    });
    setErreur("");
  }

  function setTousLesJours() {
    setForm((prev) => ({ ...prev, jours: [0, 1, 2, 3, 4, 5, 6] }));
  }

  const busFiltres = bus.filter((b) => b.type_bus === form.type_bus);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.ligne) {
      setErreur("Veuillez choisir une ligne.");
      return;
    }
    if (!form.heure_depart) {
      setErreur("L'heure de départ est obligatoire.");
      return;
    }
    if (!form.jours.length) {
      setErreur("Sélectionnez au moins un jour.");
      return;
    }

    setLoading(true);
    try {
      const body = {
        ligne: Number(form.ligne),
        heure_depart: form.heure_depart.length === 5 ? `${form.heure_depart}:00` : form.heure_depart,
        jours: form.jours,
        type_bus: form.type_bus,
        actif: !!form.actif,
        bus_defaut: form.bus_defaut ? Number(form.bus_defaut) : null,
        duree_estimee_min: form.duree_estimee_min ? Number(form.duree_estimee_min) : null,
        date_debut: form.date_debut || null,
        date_fin: form.date_fin || null,
      };

      const res = isEdit
        ? await apiFetch(`/transport/horaires/${horaire.id}/`, {
            method: "PATCH",
            body: JSON.stringify(body),
          })
        : await apiFetch("/transport/horaires/", {
            method: "POST",
            body: JSON.stringify(body),
          });

      setSucces(res?.message || (isEdit ? "Horaire modifié." : "Horaire créé."));
      if (!isEdit) setForm(emptyForm);
      onSuccess?.(res);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {erreur && <div style={s.error}>{erreur}</div>}
      {succes && <div style={s.success}>{succes}</div>}

      <form onSubmit={handleSubmit}>
        <div style={s.group}>
          <label style={s.label}>Ligne</label>
          <select style={s.input} name="ligne" value={form.ligne} onChange={handleChange}>
            <option value="">— Sélectionner une ligne —</option>
            {lignes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.code} — {l.nom}{" "}
                {l.depart && l.arrivee ? `(${l.depart} → ${l.arrivee})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={s.group}>
          <label style={s.label}>Heure de départ</label>
          <input
            style={s.input}
            type="time"
            name="heure_depart"
            value={form.heure_depart}
            onChange={handleChange}
          />
        </div>

        <div style={s.group}>
          <label style={s.label}>Jours de circulation</label>
          <div style={st.joursRow}>
            {JOURS.map((j) => {
              const active = form.jours.includes(j.val);
              return (
                <button
                  key={j.val}
                  type="button"
                  onClick={() => toggleJour(j.val)}
                  style={{ ...st.jourBtn, ...(active ? st.jourActif : {}) }}
                >
                  {j.label}
                </button>
              );
            })}
            <button type="button" style={st.tousBtn} onClick={setTousLesJours}>
              Tous les jours
            </button>
          </div>
        </div>

        <div style={s.group}>
          <label style={s.label}>Type de bus</label>
          <select
            style={s.input}
            name="type_bus"
            value={form.type_bus}
            onChange={(e) => {
              handleChange(e);
              setForm((prev) => ({ ...prev, type_bus: e.target.value, bus_defaut: "" }));
            }}
          >
            <option value="STANDARD">Standard</option>
            <option value="VIP">VIP</option>
          </select>
        </div>

        <div style={s.group}>
          <label style={s.label}>
            Bus par défaut
            <span style={st.optionnel}> (optionnel)</span>
          </label>
          <select style={s.input} name="bus_defaut" value={form.bus_defaut} onChange={handleChange}>
            <option value="">— Auto (premier bus {form.type_bus}) —</option>
            {busFiltres.map((b) => (
              <option key={b.id} value={b.id}>
                {b.immatriculation} — {b.type_bus_display} ({b.capacite} places)
              </option>
            ))}
          </select>
        </div>

        <div style={s.group}>
          <label style={s.label}>
            Durée estimée (minutes)
            <span style={st.optionnel}> (optionnel)</span>
          </label>
          <input
            style={s.input}
            type="number"
            min="1"
            name="duree_estimee_min"
            value={form.duree_estimee_min}
            onChange={handleChange}
            placeholder="Ex. 270"
          />
        </div>

        <div style={st.datesRow}>
          <div style={{ ...s.group, flex: 1 }}>
            <label style={s.label}>
              Valide à partir du
              <span style={st.optionnel}> (optionnel)</span>
            </label>
            <input style={s.input} type="date" name="date_debut" value={form.date_debut} onChange={handleChange} />
          </div>
          <div style={{ ...s.group, flex: 1 }}>
            <label style={s.label}>
              Valide jusqu&apos;au
              <span style={st.optionnel}> (optionnel)</span>
            </label>
            <input style={s.input} type="date" name="date_fin" value={form.date_fin} onChange={handleChange} />
          </div>
        </div>

        {isEdit && (
          <div style={s.group}>
            <label style={st.checkLabel}>
              <input type="checkbox" name="actif" checked={!!form.actif} onChange={handleChange} />
              Horaire actif
            </label>
          </div>
        )}

        <p style={st.hint}>
          Ex. : départ à 08:00 tous les jours sur cette ligne (heure locale Burkina Faso).
          Les départs apparaissent automatiquement à la recherche et à la vente.
        </p>

        <div style={s.btnRow}>
          <button type="button" style={s.btnBack} onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" style={{ ...s.btnSubmit, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer l'horaire"}
          </button>
        </div>
      </form>
    </>
  );
}

/** @deprecated alias pour compatibilité imports existants */
export const ChefTrajetCreerForm = ChefHoraireCreerForm;

export default function ChefTrajetCreerPage() {
  const navigate = useNavigate();
  const close = () => navigate("/chef/trajets");

  return (
    <Modal open title="Nouvel horaire récurrent" onClose={close}>
      <ChefHoraireCreerForm onCancel={close} onSuccess={close} />
    </Modal>
  );
}

const st = {
  optionnel: {
    fontSize: "11px",
    fontWeight: "400",
    color: "#6B7280",
    textTransform: "none",
    letterSpacing: "0",
  },
  joursRow: { display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" },
  jourBtn: {
    padding: "8px 10px",
    fontSize: "12px",
    fontWeight: "600",
    borderRadius: "8px",
    border: "1.5px solid #E5E7EB",
    background: "#fff",
    color: "#6B7280",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  jourActif: {
    background: "#EEF2F7",
    color: "#1A1348",
    borderColor: "#58A6FF",
  },
  tousBtn: {
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: "600",
    borderRadius: "8px",
    border: "none",
    background: "#26C2A1",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  datesRow: { display: "flex", gap: "12px", flexWrap: "wrap" },
  hint: { fontSize: "12px", color: "#6B7280", margin: "0 0 16px" },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#1A1348",
    cursor: "pointer",
  },
};
