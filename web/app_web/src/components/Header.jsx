import { logoutUser } from "../features/accounts/services/authservice";

function Header() {
  async function gererDeconnexion() {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    } finally {
      localStorage.removeItem("username");
      localStorage.removeItem("role");
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
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E5E7EB",
    padding: "0 24px",
    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    height: "64px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#1A1348",
    letterSpacing: "2px",
  },
  logoutButton: {
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#304FFE",
    backgroundColor: "transparent",
    border: "1.5px solid rgba(48, 79, 254, 0.4)",
    borderRadius: "12px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

export default Header;
