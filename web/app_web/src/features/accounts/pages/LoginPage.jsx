import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import { loginUser, getConnectedProfile } from "../services/authservice";

function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [messageErreur, setMessageErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessageErreur("");
    setChargement(true);

    try {
      await loginUser({ username, password });
      console.log("Données envoyées :",{ username, password});
      const profil = await getConnectedProfile();

      redirigerSelonRole(profil, navigate);
    } catch (error) {
      setMessageErreur(error.message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div>
      <Header />
      <SubHeader title="Connexion" />

      <div style={styles.page}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label htmlFor="username">Nom d’utilisateur</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.group}>
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={styles.input}
              required
            />
          </div>

          {messageErreur && <p style={styles.error}>{messageErreur}</p>}

          <button type="submit" style={styles.button} disabled={chargement}>
            {chargement ? "Connexion..." : "Connexion"}
          </button>
          <div style={{ marginTop: "15px", textAlign: "center" }}>
         <button
          type="button"
              onClick={() => navigate("/recuperationCompte")}
              style={{
                background: "none",
                border: "none",
                color: "blue",
                textDecoration: "underline",
                cursor: "pointer",
              }
          }
  >
    Nom d'utilisateur ou mot de passe oublié ?
  </button>
</div>
        </form>
      </div>
    </div>
  );
}

function redirigerSelonRole(profil, navigate) {
  const role = profil.role;

  if (role === "ADMIN_PLATEFORME") {
    navigate("/admin");
    return;
  }

  if (role === "CHEF_COMPAGNIE") {
    navigate("/chef");
    return;
  }

  if (role === "SAV") {
    navigate("/sav");
    return;
  }

  if (role === "CONTROLEUR") {
    navigate("/controleur");
    return;
  }

  if (role === "COMPTABLE") {
    navigate("/comptable");
    return;
  }

  if (role === "RECEPTIONNISTE") {
    navigate("/receptionniste");
    return;
  }

  setTimeout(() => {
    navigate("/login");
  }, 0);

  alert("Rôle non reconnu.");
}

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
  },
  form: {
    width: "100%",
    maxWidth: "420px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "24px",
    backgroundColor: "#fff",
  },
  group: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "16px",
  },
  input: {
    marginTop: "8px",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    marginBottom: "12px",
  },
};

export default LoginPage;