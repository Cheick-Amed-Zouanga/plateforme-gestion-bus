import { logoutUser } from "../features/accounts/services/authservice";

function Header() {
  async function gererDeconnexion() {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <h1 style={styles.title}>TERRASO</h1>
        <button onClick={gererDeconnexion} style={styles.logoutButton}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: "#1f0101",
    color: "white",
    padding: "20px",
  },
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
  },
  logoutButton: {
    padding: "10px 14px",
    cursor: "pointer",
  },
};

export default Header;