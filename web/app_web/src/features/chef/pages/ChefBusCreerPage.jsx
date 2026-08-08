import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { darkFormStyles } from "../../../shared/styles/darkTheme";
import apiFetch from "../../../shared/services/api";
import Modal from "../../../shared/components/Modal";

export function ChefBusCreerForm({ onCancel, onSuccess }) {
  const s = darkFormStyles();
  const [form, setForm] = useState({ immatriculation: "", type_bus: "STANDARD", capacite: "" });
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErreur("");
    setSucces("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.immatriculation.trim()) {
      setErreur("L'immatriculation est obligatoire.");
      return;
    }
    if (!form.capacite || Number(form.capacite) < 1) {
      setErreur("La capacité doit être au moins 1.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch("/transport/bus/", {
        method: "POST",
        body: JSON.stringify({
          immatriculation: form.immatriculation.trim(),
          type_bus: form.type_bus,
          capacite: Number(form.capacite),
        }),
      });
      setSucces(data.message);
      setForm({ immatriculation: "", type_bus: "STANDARD", capacite: "" });
      onSuccess?.(data);
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
          <label style={s.label}>Immatriculation</label>
          <input
            style={s.input}
            name="immatriculation"
            placeholder="Ex: BF-1234-A"
            value={form.immatriculation}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>

        <div style={s.group}>
          <label style={s.label}>Type de bus</label>
          <select style={s.input} name="type_bus" value={form.type_bus} onChange={handleChange}>
            <option value="STANDARD">Standard</option>
            <option value="VIP">VIP</option>
          </select>
        </div>

        <div style={s.group}>
          <label style={s.label}>Capacité (nombre de places)</label>
          <input
            style={s.input}
            name="capacite"
            type="number"
            min={1}
            max={200}
            placeholder="Ex: 45"
            value={form.capacite}
            onChange={handleChange}
          />
        </div>

        {form.capacite > 0 && (
          <p style={st.hint}>{form.capacite} sièges seront créés automatiquement.</p>
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

export default function ChefBusCreerPage() {
  const navigate = useNavigate();
  const close = () => navigate("/chef/bus");

  return (
    <Modal open title="Nouveau bus" onClose={close}>
      <ChefBusCreerForm onCancel={close} onSuccess={close} />
    </Modal>
  );
}

const st = {
  hint: { fontSize: "13px", color: "#26C2A1", marginTop: "-10px", marginBottom: "16px" },
};
