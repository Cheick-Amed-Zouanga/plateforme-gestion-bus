import { useState, useEffect, useCallback } from "react";
import { darkFormStyles } from "../../../shared/styles/darkTheme";
import apiFetch from "../../../shared/services/api";
import Modal from "../../../shared/components/Modal";
import { ActionButton, PageHeader } from "../../../shared/components/dashboard";

const CHAMPS_INIT = {
  role: "RECEPTIONNISTE",
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  username: "",
  password: "",
  confirmation: "",
};

const ROLE_LABELS = {
  RECEPTIONNISTE: "Réceptionniste",
  CONTROLEUR: "Contrôleur",
  CHEF_COMPAGNIE: "Chef de compagnie",
  COMPTABLE: "Comptable",
};

function EmployeInscrireForm({ onCancel, onSuccess }) {
  const s = darkFormStyles();
  const [form, setForm] = useState(CHAMPS_INIT);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErreur("");
    setSucces("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom.trim() || !form.prenom.trim()) {
      setErreur("Le nom et le prénom sont obligatoires.");
      return;
    }
    if (!form.email.trim()) {
      setErreur("L'email est obligatoire.");
      return;
    }
    if (!form.username.trim()) {
      setErreur("Le nom d'utilisateur est obligatoire.");
      return;
    }
    if (form.password.length < 7) {
      setErreur("Le mot de passe doit contenir au moins 7 caractères.");
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setErreur("Le mot de passe doit contenir au moins une majuscule.");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
      setErreur("Le mot de passe doit contenir au moins un caractère spécial (!@#$%…).");
      return;
    }
    if (form.password !== form.confirmation) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/accounts/employes/creer/", {
        method: "POST",
        body: JSON.stringify({
          role: form.role,
          prenom: form.prenom,
          nom: form.nom,
          email: form.email,
          tel: form.telephone,
          username: form.username,
          password: form.password,
          confirmationPassword: form.confirmation,
        }),
      });
      const roleLabel = ROLE_LABELS[form.role] ?? form.role;
      setSucces(`${roleLabel} ${form.prenom} ${form.nom} inscrit(e) avec succès.`);
      setForm(CHAMPS_INIT);
      onSuccess?.();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputRow = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" };

  return (
    <>
      {erreur && <div style={s.error}>{erreur}</div>}
      {succes && <div style={s.success}>{succes}</div>}

      <form onSubmit={handleSubmit}>
        <div style={s.group}>
          <label style={s.label}>Rôle</label>
          <select style={s.input} name="role" value={form.role} onChange={handleChange}>
            <option value="RECEPTIONNISTE">Réceptionniste</option>
            <option value="CONTROLEUR">Contrôleur</option>
          </select>
        </div>

        <div style={{ ...s.group, ...inputRow }}>
          <div>
            <label style={s.label}>Prénom</label>
            <input
              style={s.input}
              name="prenom"
              placeholder="Jean"
              value={form.prenom}
              onChange={handleChange}
            />
          </div>
          <div>
            <label style={s.label}>Nom</label>
            <input
              style={s.input}
              name="nom"
              placeholder="Ouédraogo"
              value={form.nom}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={{ ...s.group, ...inputRow }}>
          <div>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              name="email"
              placeholder="jean@compagnie.bf"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label style={s.label}>Téléphone</label>
            <input
              style={s.input}
              type="tel"
              name="telephone"
              placeholder="+226 70 00 00 00"
              value={form.telephone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={s.group}>
          <label style={s.label}>Nom d'utilisateur</label>
          <input
            style={s.input}
            name="username"
            placeholder="jean.ouedraogo"
            value={form.username}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>

        <div style={{ ...s.group, ...inputRow }}>
          <div>
            <label style={s.label}>Mot de passe</label>
            <div style={st.pwdWrap}>
              <input
                style={{ ...s.input, paddingRight: "48px" }}
                type={showPwd ? "text" : "password"}
                name="password"
                placeholder="Min. 7 car., 1 majuscule, 1 spécial"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button type="button" style={st.eye} onClick={() => setShowPwd((v) => !v)}>
                {showPwd ? "Cacher" : "Voir"}
              </button>
            </div>
          </div>
          <div>
            <label style={s.label}>Confirmation</label>
            <input
              style={s.input}
              type={showPwd ? "text" : "password"}
              name="confirmation"
              placeholder="Répéter"
              value={form.confirmation}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div style={s.btnRow}>
          <button type="button" style={s.btnBack} onClick={onCancel}>
            Annuler
          </button>
          <button
            type="submit"
            style={{ ...s.btnSubmit, opacity: loading ? 0.6 : 1 }}
            disabled={loading}
          >
            {loading ? "Inscription…" : "Inscrire"}
          </button>
        </div>
      </form>
    </>
  );
}

export default function ChefEmployesPage() {
  const [employes, setEmployes] = useState([]);
  const [loadingListe, setLoadingListe] = useState(true);
  const [erreurListe, setErreurListe] = useState("");
  const [actionId, setActionId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const charger = useCallback(() => {
    setLoadingListe(true);
    apiFetch("/accounts/employes/")
      .then(setEmployes)
      .catch((e) => setErreurListe(e.message))
      .finally(() => setLoadingListe(false));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function desactiverEmploye(emp) {
    if (!window.confirm(`Désactiver ${emp.first_name} ${emp.last_name} ?`)) return;
    setActionId(emp.id);
    try {
      await apiFetch(`/accounts/employes/${emp.id}/desactiver/`, { method: "POST" });
      setEmployes((prev) => prev.filter((e) => e.id !== emp.id));
    } catch (e) {
      setErreurListe(e.message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div style={st.page}>
      <PageHeader
        title="Employés"
        subtitle="Gérez les comptes de votre compagnie."
        actions={
          <ActionButton variant="green" onClick={() => setModalOpen(true)}>
            + Inscrire un employé
          </ActionButton>
        }
      />

      <Modal
        open={modalOpen}
        wide
        title="Inscrire un employé"
        onClose={() => setModalOpen(false)}
      >
        <EmployeInscrireForm
          onCancel={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            charger();
          }}
        />
      </Modal>

      {erreurListe && <div style={st.erreur}>{erreurListe}</div>}

      <div style={st.card}>
        <table style={st.table}>
          <thead>
            <tr>
              {["Nom", "Username", "Rôle", "Téléphone", "Actions"].map((h) => (
                <th key={h} style={st.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loadingListe && (
              <tr>
                <td colSpan={5} style={st.empty}>
                  Chargement…
                </td>
              </tr>
            )}
            {!loadingListe && employes.length === 0 && (
              <tr>
                <td colSpan={5} style={st.empty}>
                  Aucun employé dans votre compagnie.
                </td>
              </tr>
            )}
            {employes.map((emp) => (
              <tr key={emp.id} style={st.tr}>
                <td style={st.td}>
                  <span style={st.nom}>
                    {emp.first_name} {emp.last_name}
                  </span>
                  <span style={st.email}>{emp.email}</span>
                </td>
                <td style={st.td}>
                  <span style={st.immat}>{emp.username}</span>
                </td>
                <td style={st.td}>
                  <span style={st.roleBadge}>{ROLE_LABELS[emp.role] ?? emp.role}</span>
                </td>
                <td style={st.td}>{emp.telephone || "—"}</td>
                <td style={st.td}>
                  <button
                    style={{ ...st.btnDanger, opacity: actionId === emp.id ? 0.5 : 1 }}
                    onClick={() => desactiverEmploye(emp)}
                    disabled={actionId === emp.id}
                  >
                    Désactiver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const st = {
  page: { fontFamily: "'Poppins', 'Segoe UI', sans-serif" },
  erreur: {
    padding: "10px 14px",
    backgroundColor: "#FEF2F2",
    color: "#E11D48",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "14px",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    padding: "8px 0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    border: "1px solid #E5E7EB",
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 14px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    borderBottom: "1px solid #E5E7EB",
    backgroundColor: "#F5F7FA",
  },
  tr: { borderBottom: "1px solid #EEF2F7" },
  td: { padding: "12px 14px", fontSize: "13px", color: "#1A1348", verticalAlign: "top" },
  empty: { padding: "32px", textAlign: "center", color: "#6B7280", fontSize: "14px" },
  nom: { display: "block", fontWeight: "600", color: "#1A1348" },
  email: { display: "block", fontSize: "12px", color: "#6B7280" },
  immat: { fontFamily: "monospace", fontSize: "13px", color: "#304FFE" },
  roleBadge: {
    padding: "2px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#EEF0FF",
    color: "#304FFE",
  },
  btnDanger: {
    padding: "4px 12px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#E11D48",
    backgroundColor: "transparent",
    border: "1.5px solid #E11D48",
    borderRadius: "6px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  pwdWrap: { position: "relative" },
  eye: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#6B7280",
    fontSize: "12px",
    cursor: "pointer",
    padding: "2px 4px",
  },
};
