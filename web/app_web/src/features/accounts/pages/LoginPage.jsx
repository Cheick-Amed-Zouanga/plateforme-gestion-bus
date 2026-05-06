import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, getConnectedProfile } from "../services/authservice";
import { darkFormStyles } from "../../../shared/styles/darkTheme";

const s = darkFormStyles();

function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername]           = useState("");
  const [password, setPassword]           = useState("");
  const [messageErreur, setMessageErreur] = useState("");
  const [chargement, setChargement]       = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessageErreur("");
    setChargement(true);
    try {
      await loginUser({ username, password });
      const profil = await getConnectedProfile();
      redirigerSelonRole(profil, navigate);
    } catch (error) {
      setMessageErreur(error.message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.main}>
        <div style={s.card}>

          <h1 style={styles.title}>Terrasso</h1>
          <p style={styles.subtitle}>Plateforme de gestion des bus</p>

          <form onSubmit={handleSubmit}>
            <div style={s.group}>
              <label style={s.label} htmlFor="username">Nom d'utilisateur</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={s.input}
                placeholder="Entrez votre nom d'utilisateur"
                autoComplete="username"
                required
              />
            </div>

            <div style={s.group}>
              <label style={s.label} htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={s.input}
                placeholder="Entrez votre mot de passe"
                autoComplete="current-password"
                required
              />
            </div>

            {messageErreur && <div style={s.error}>{messageErreur}</div>}

            <button
              type="submit"
              style={chargement ? { ...s.btnSubmit, ...styles.btnDisabled } : s.btnSubmit}
              disabled={chargement}
            >
              {chargement ? "Connexion en cours…" : "Se connecter"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/recuperationCompte")}
              style={styles.forgotLink}
            >
              Nom d'utilisateur ou mot de passe oublié ?
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function redirigerSelonRole(profil, navigate) {
  const role = profil.role;

  if (role === "ADMIN_PLATEFORME")  { navigate("/admin");          return; }
  if (role === "CHEF_COMPAGNIE")    { navigate("/chef");           return; }
  if (role === "SAV")               { navigate("/sav");            return; }
  if (role === "CONTROLEUR")        { navigate("/controleur");     return; }
  if (role === "COMPTABLE")         { navigate("/comptable");      return; }
  if (role === "RECEPTIONNISTE")    { navigate("/receptionniste"); return; }

  if (role === "client") {
    alert("Cette interface est réservée aux employés. Veuillez utiliser l'application mobile.");
  } else {
    alert("Rôle non reconnu. Contactez l'administrateur.");
  }
  navigate("/login");
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0D1117",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    padding: "20px",
  },
  main: {
    width: "100%",
    maxWidth: "480px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#E6EDF3",
    margin: "0 0 4px 0",
  },
  subtitle: {
    fontSize: "12px",
    color: "#6E7681",
    textTransform: "uppercase",
    letterSpacing: "1px",
    margin: "0 0 24px 0",
  },
  btnDisabled: {
    backgroundColor: "#1E5C35",
    cursor: "not-allowed",
  },
  forgotLink: {
    display: "block",
    width: "100%",
    textAlign: "center",
    background: "none",
    border: "none",
    color: "#6E7681",
    fontSize: "13px",
    cursor: "pointer",
    textDecoration: "underline",
    padding: "14px 0 0",
    fontFamily: "inherit",
    marginTop: "12px",
  },
};

export default LoginPage;
