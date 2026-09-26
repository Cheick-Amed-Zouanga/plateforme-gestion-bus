import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { darkFormStyles } from "../../../shared/styles/darkTheme";
import apiFetch from "../../../shared/services/api";
import Modal from "../../../shared/components/Modal";

export function ChefTarifsCreerForm({ onCancel, onSuccess }) {
  const s = darkFormStyles();
  const [lignes, setLignes] = useState([]);
  const [arrets, setArrets] = useState([]);
  const [loadingArrets, setLoadingArrets] = useState(false);
  const [form, setForm] = useState({
    ligne: "",
    arret_depart: "",
    arret_arrivee: "",
    type_bus: "STANDARD",
    prix: "",
    devise: "XOF",
  });
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/transport/lignes/")
      .then((l) => setLignes(l.filter((x) => x.active)))
      .catch((e) => setErreur(e.message));
  }, []);

  async function handleLigneChange(e) {
    const ligneId = e.target.value;
    setForm((prev) => ({ ...prev, ligne: ligneId, arret_depart: "", arret_arrivee: "" }));
    setArrets([]);
    setErreur("");
    setSucces("");
    if (!ligneId) return;
    setLoadingArrets(true);
    try {
      const detail = await apiFetch(`/transport/lignes/${ligneId}/`);
      setArrets(detail.arrets || []);
    } catch (err) {
      setErreur("Impossible de charger les arrêts : " + err.message);
    } finally {
      setLoadingArrets(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "arret_depart") next.arret_arrivee = "";
      return next;
    });
    setErreur("");
    setSucces("");
  }

  const arretsArrivee = form.arret_depart
    ? arrets.filter(
        (a) => a.ordre > arrets.find((x) => String(x.id) === form.arret_depart)?.ordre,
      )
    : [];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.ligne) {
      setErreur("Veuillez choisir une ligne.");
      return;
    }
    if (!form.arret_depart) {
      setErreur("Veuillez choisir une ville de départ.");
      return;
    }
    if (!form.arret_arrivee) {
      setErreur("Veuillez choisir une ville d'arrivée.");
      return;
    }
    if (!form.prix || Number(form.prix) < 0) {
      setErreur("Le prix est obligatoire et doit être ≥ 0.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/transport/tarifs/", {
        method: "POST",
        body: JSON.stringify({
          ligne: Number(form.ligne),
          arret_depart: Number(form.arret_depart),
          arret_arrivee: Number(form.arret_arrivee),
          type_bus: form.type_bus,
          prix: Number(form.prix),
          devise: form.devise || "XOF",
        }),
      });
      setSucces("Tarif enregistré.");
      setForm({
        ligne: "",
        arret_depart: "",
        arret_arrivee: "",
        type_bus: "STANDARD",
        prix: "",
        devise: "XOF",
      });
      setArrets([]);
      onSuccess?.();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p style={st.desc}>
        Sélectionnez la ligne, puis la ville de départ et d'arrivée du segment à tarifer.
      </p>

      {erreur && <div style={s.error}>{erreur}</div>}
      {succes && <div style={s.success}>{succes}</div>}

      <form onSubmit={handleSubmit}>
        <div style={s.group}>
          <label style={s.label}>Ligne</label>
          <select style={s.input} name="ligne" value={form.ligne} onChange={handleLigneChange}>
            <option value="">— Sélectionner une ligne —</option>
            {lignes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.code} — {l.nom}{" "}
                {l.depart && l.arrivee ? `(${l.depart} → ${l.arrivee})` : ""}
              </option>
            ))}
          </select>
        </div>

        {loadingArrets && <p style={st.hint}>Chargement des arrêts…</p>}

        {arrets.length > 0 && (
          <>
            <div style={s.group}>
              <label style={s.label}>Ville de départ</label>
              <select
                style={s.input}
                name="arret_depart"
                value={form.arret_depart}
                onChange={handleChange}
              >
                <option value="">— Sélectionner la ville de départ —</option>
                {arrets.slice(0, -1).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.ordre}. {a.ville}
                  </option>
                ))}
              </select>
            </div>

            <div style={s.group}>
              <label style={s.label}>Ville d'arrivée</label>
              <select
                style={{ ...s.input, opacity: form.arret_depart ? 1 : 0.5 }}
                name="arret_arrivee"
                value={form.arret_arrivee}
                onChange={handleChange}
                disabled={!form.arret_depart}
              >
                <option value="">— Sélectionner la ville d'arrivée —</option>
                {arretsArrivee.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.ordre}. {a.ville}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div style={s.group}>
          <label style={s.label}>Type de bus</label>
          <select style={s.input} name="type_bus" value={form.type_bus} onChange={handleChange}>
            <option value="STANDARD">Standard</option>
            <option value="VIP">VIP</option>
          </select>
        </div>

        <div style={{ ...s.group, display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
          <div>
            <label style={s.label}>Prix</label>
            <input
              style={s.input}
              type="number"
              min={0}
              name="prix"
              placeholder="Ex: 5000"
              value={form.prix}
              onChange={handleChange}
            />
          </div>
          <div>
            <label style={s.label}>Devise</label>
            <input
              style={s.input}
              name="devise"
              placeholder="XOF"
              value={form.devise}
              onChange={handleChange}
              maxLength={10}
            />
          </div>
        </div>

        {form.prix > 0 && (
          <p style={st.hint}>
            Tarif : {Number(form.prix).toLocaleString("fr-FR")} {form.devise || "XOF"}
          </p>
        )}

        <div style={s.btnRow}>
          <button type="button" style={s.btnBack} onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" style={{ ...s.btnSubmit, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </>
  );
}

export default function ChefTarifsCreerPage() {
  const navigate = useNavigate();
  const close = () => navigate("/chef/tarifs");

  return (
    <Modal open title="Nouveau tarif" onClose={close}>
      <ChefTarifsCreerForm onCancel={close} onSuccess={close} />
    </Modal>
  );
}

const st = {
  desc: { fontSize: "13px", color: "#6B7280", marginBottom: "18px", marginTop: 0 },
  hint: { fontSize: "13px", color: "#26C2A1", marginTop: "-10px", marginBottom: "16px" },
};
