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
        <span style={styles.title}>TERRASSO</span>
        <button onClick={gererDeconnexion} style={styles.logoutButton}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: "#161B22",
    borderBottom: "1px solid #30363D",
    padding: "0 24px",
  },
  container: {
    maxWidth: "960px",
    margin: "0 auto",
    height: "60px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#E6EDF3",
    letterSpacing: "2px",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  logoutButton: {
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#FF7B72",
    backgroundColor: "transparent",
    border: "1.5px solid #C41E3A",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

export default Header;
