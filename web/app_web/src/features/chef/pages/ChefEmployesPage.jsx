import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import { darkFormStyles } from "../../../shared/styles/darkTheme";
import apiFetch from "../../../shared/services/api";

const CHAMPS_INIT = {
  role: "RECEPTIONNISTE",
  nom: "", prenom: "", email: "", telephone: "",
  username: "", password: "", confirmation: "",
};

const ROLE_LABELS = {
  RECEPTIONNISTE: "Réceptionniste",
  CONTROLEUR:     "Contrôleur",
  CHEF_COMPAGNIE: "Chef de compagnie",
  COMPTABLE:      "Comptable",
};

export default function ChefEmployesPage() {
  const navigate = useNavigate();
  const s = darkFormStyles();

  const [onglet, setOnglet] = useState("inscrire"); // "inscrire" | "liste"

  // ── Inscription ──
  const [form, setForm]     = useState(CHAMPS_INIT);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // ── Liste ──
  const [employes, setEmployes]     = useState([]);
  const [loadingListe, setLoadingListe] = useState(false);
  const [erreurListe, setErreurListe]   = useState("");
  const [actionId, setActionId]         = useState(null);

  function chargerEmployes() {
    setLoadingListe(true);
    apiFetch("/accounts/employes/")
      .then(setEmployes)
      .catch(e => setErreurListe(e.message))
      .finally(() => setLoadingListe(false));
  }

  useEffect(() => {
    if (onglet === "liste") chargerEmployes();
  }, [onglet]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErreur("");
    setSucces("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom.trim() || !form.prenom.trim()) { setErreur("Le nom et le prénom sont obligatoires."); return; }
    if (!form.email.trim())   { setErreur("L'email est obligatoire."); return; }
    if (!form.username.trim()) { setErreur("Le nom d'utilisateur est obligatoire."); return; }
    if (form.password.length < 7) { setErreur("Le mot de passe doit contenir au moins 7 caractères."); return; }
    if (!/[A-Z]/.test(form.password)) { setErreur("Le mot de passe doit contenir au moins une majuscule."); return; }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) { setErreur("Le mot de passe doit contenir au moins un caractère spécial (!@#$%…)."); return; }
    if (form.password !== form.confirmation) { setErreur("Les mots de passe ne correspondent pas."); return; }

    setLoading(true);
    try {
      await apiFetch("/accounts/employes/creer/", {
        method: "POST",
        body: JSON.stringify({
          role:                 form.role,
          prenom:               form.prenom,
          nom:                  form.nom,
          email:                form.email,
          tel:                  form.telephone,
          username:             form.username,
          password:             form.password,
          confirmationPassword: form.confirmation,
        }),
      });
      const roleLabel = ROLE_LABELS[form.role] ?? form.role;
      setSucces(`${roleLabel} ${form.prenom} ${form.nom} inscrit(e) avec succès.`);
      setForm(CHAMPS_INIT);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function desactiverEmploye(emp) {
    if (!window.confirm(`Désactiver ${emp.first_name} ${emp.last_name} ?`)) return;
    setActionId(emp.id);
    try {
      await apiFetch(`/accounts/employes/${emp.id}/desactiver/`, { method: "POST" });
      setEmployes(prev => prev.filter(e => e.id !== emp.id));
    } catch (e) {
      setErreurListe(e.message);
    } finally {
      setActionId(null);
    }
  }

  const inputRow = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" };

  return (
    <div style={s.page}>
      <Header />
      <SubHeader title="Employés" />
      <main style={{ ...s.main, maxWidth: "720px" }}>

        <button style={s.btnBack} onClick={() => navigate("/chef")}>← Tableau de bord</button>

        {/* Onglets */}
        <div style={st.tabs}>
          <button style={{ ...st.tab, ...(onglet === "inscrire" ? st.tabActif : {}) }} onClick={() => setOnglet("inscrire")}>
            Inscrire un employé
          </button>
          <button style={{ ...st.tab, ...(onglet === "liste" ? st.tabActif : {}) }} onClick={() => setOnglet("liste")}>
            Liste des employés
          </button>
        </div>

        {/* ── Onglet Inscrire ── */}
        {onglet === "inscrire" && (
          <div style={s.card}>
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
                  <input style={s.input} name="prenom" placeholder="Jean" value={form.prenom} onChange={handleChange} />
                </div>
                <div>
                  <label style={s.label}>Nom</label>
                  <input style={s.input} name="nom" placeholder="Ouédraogo" value={form.nom} onChange={handleChange} />
                </div>
              </div>

              <div style={{ ...s.group, ...inputRow }}>
                <div>
                  <label style={s.label}>Email</label>
                  <input style={s.input} type="email" name="email" placeholder="jean@compagnie.bf" value={form.email} onChange={handleChange} />
                </div>
                <div>
                  <label style={s.label}>Téléphone</label>
                  <input style={s.input} type="tel" name="telephone" placeholder="+226 70 00 00 00" value={form.telephone} onChange={handleChange} />
                </div>
              </div>

              <div style={s.group}>
                <label style={s.label}>Nom d'utilisateur</label>
                <input style={s.input} name="username" placeholder="jean.ouedraogo" value={form.username} onChange={handleChange} autoComplete="off" />
              </div>

              <div style={{ ...s.group, ...inputRow }}>
                <div>
                  <label style={s.label}>Mot de passe</label>
                  <div style={st.pwdWrap}>
                    <input style={{ ...s.input, paddingRight: "48px" }}
                      type={showPwd ? "text" : "password"} name="password"
                      placeholder="Min. 7 car., 1 majuscule, 1 spécial" value={form.password} onChange={handleChange} autoComplete="new-password" />
                    <button type="button" style={st.eye} onClick={() => setShowPwd(v => !v)}>
                      {showPwd ? "Cacher" : "Voir"}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={s.label}>Confirmation</label>
                  <input style={s.input} type={showPwd ? "text" : "password"} name="confirmation"
                    placeholder="Répéter" value={form.confirmation} onChange={handleChange} autoComplete="new-password" />
                </div>
              </div>

              <div style={s.btnRow}>
                <button type="submit" style={{ ...s.btnSubmit, opacity: loading ? 0.6 : 1 }} disabled={loading}>
                  {loading ? "Inscription…" : "Inscrire"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Onglet Liste ── */}
        {onglet === "liste" && (
          <div style={st.card}>
            {erreurListe && <div style={st.erreur}>{erreurListe}</div>}
            <table style={st.table}>
              <thead>
                <tr>
                  {["Nom", "Username", "Rôle", "Téléphone", "Actions"].map(h => (
                    <th key={h} style={st.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingListe && <tr><td colSpan={5} style={st.empty}>Chargement…</td></tr>}
                {!loadingListe && employes.length === 0 && (
                  <tr><td colSpan={5} style={st.empty}>Aucun employé dans votre compagnie.</td></tr>
                )}
                {employes.map(emp => (
                  <tr key={emp.id} style={st.tr}>
                    <td style={st.td}>
                      <span style={st.nom}>{emp.first_name} {emp.last_name}</span>
                      <span style={st.email}>{emp.email}</span>
                    </td>
                    <td style={st.td}><span style={st.immat}>{emp.username}</span></td>
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
        )}

      </main>
    </div>
  );
}

const st = {
  tabs:      { display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid #21262D", paddingBottom: "0" },
  tab:       { padding: "8px 20px", fontSize: "14px", fontWeight: "600", color: "#8B949E", backgroundColor: "transparent", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", fontFamily: "inherit", marginBottom: "-1px" },
  tabActif:  { color: "#E6EDF3", borderBottomColor: "#58A6FF" },
  card:      { backgroundColor: "#161B22", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  erreur:    { padding: "10px 14px", backgroundColor: "#2D1117", color: "#FF7B72", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" },
  table:     { width: "100%", borderCollapse: "collapse" },
  th:        { padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#8B949E", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #30363D" },
  tr:        { borderBottom: "1px solid #21262D" },
  td:        { padding: "12px 14px", fontSize: "13px", color: "#E6EDF3", verticalAlign: "top" },
  empty:     { padding: "32px", textAlign: "center", color: "#6E7681", fontSize: "14px" },
  nom:       { display: "block", fontWeight: "600", color: "#E6EDF3" },
  email:     { display: "block", fontSize: "12px", color: "#8B949E" },
  immat:     { fontFamily: "monospace", fontSize: "13px", color: "#79C0FF" },
  roleBadge: { padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#1C2A3A", color: "#8B949E" },
  btnDanger: { padding: "4px 12px", fontSize: "12px", fontWeight: "600", color: "#FF7B72", backgroundColor: "transparent", border: "1.5px solid #FF7B72", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  pwdWrap:   { position: "relative" },
  eye:       { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#8B949E", fontSize: "12px", cursor: "pointer", padding: "2px 4px" },
};
