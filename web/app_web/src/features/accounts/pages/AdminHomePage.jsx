import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";

function AdminHomePage() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <Header />
      <SubHeader title="Accueil Administrateur" />

      <main style={styles.main}>

        {/* Gestion des employés */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Gestion des employés</h2>

          <div style={styles.actionGroup}>
            <p style={styles.groupLabel}>Inscription</p>
            <div style={styles.btnRow}>
              <ActionBtn label="Chef de compagnie" onClick={() => navigate("/admin/inscriptionChef")}      variant="green" />
              <ActionBtn label="Agent SAV"          onClick={() => navigate("/admin/inscriptionSav")}       variant="green" />
              <ActionBtn label="Comptable"          onClick={() => navigate("/admin/inscriptionComptable")} variant="green" />
            </div>
          </div>

          <div style={styles.actionGroup}>
            <p style={styles.groupLabel}>Modification</p>
            <div style={styles.btnRow}>
              <ActionBtn label="Chef de compagnie" onClick={() => navigate("/admin/modificationChefCompagnie")} variant="blue" />
              <ActionBtn label="Agent SAV"          onClick={() => navigate("/admin/modificationSav")}           variant="blue" />
              <ActionBtn label="Comptable"          onClick={() => navigate("/admin/modificationComptable")}     variant="blue" />
            </div>
          </div>

          <div style={{ ...styles.actionGroup, marginBottom: 0 }}>
            <p style={styles.groupLabel}>Désactivation</p>
            <div style={styles.btnRow}>
              <ActionBtn label="Chef de compagnie" onClick={() => navigate("/admin/desactivationChefCompagnie")} variant="red" />
              <ActionBtn label="Agent SAV"          onClick={() => navigate("/admin/desactivationSav")}           variant="red" />
              <ActionBtn label="Comptable"          onClick={() => navigate("/admin/desactivationComptable")}     variant="red" />
            </div>
          </div>
        </section>

        {/* Gestion des réservations */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Gestion des réservations</h2>
          <div style={styles.btnRow}>
            <ActionBtn label="Historique des réservations"   variant="neutral" />
            <ActionBtn label="Billets annulés"               variant="neutral" />
            <ActionBtn label="Réservations en attente"       variant="neutral" />
          </div>
        </section>

        {/* Service à la clientèle */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Service à la clientèle</h2>
          <div style={styles.btnRow}>
            <ActionBtn label="Page service clientèle"  variant="neutral" />
            <ActionBtn label="Consulter les réclamations" variant="neutral" />
          </div>
        </section>

        {/* Supervision */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Supervision</h2>
          <div style={styles.btnRow}>
            <ActionBtn label="Tableau de bord"      variant="neutral" />
            <ActionBtn label="Journaux d'activité"  variant="neutral" />
          </div>
        </section>

      </main>
    </div>
  );
}

// Bouton réutilisable avec variante de couleur
function ActionBtn({ label, onClick, variant }) {
  const colors = {
    green:   { backgroundColor: "#009A44", color: "#fff", border: "none" },
    blue:    { backgroundColor: "#1B6CA8", color: "#fff", border: "none" },
    red:     { backgroundColor: "#C41E3A", color: "#fff", border: "none" },
    neutral: { backgroundColor: "#21262D", color: "#E6EDF3", border: "1.5px solid #30363D" },
  };
  return (
    <button onClick={onClick} style={{ ...styles.btn, ...colors[variant] }}>
      {label}
    </button>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0D1117",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },

  main: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "32px 20px 48px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  card: {
    backgroundColor: "#161B22",
    borderRadius: "14px",
    padding: "28px 30px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    borderLeft: "4px solid #C41E3A",
  },

  sectionTitle: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#E6EDF3",
    margin: "0 0 20px 0",
  },

  actionGroup: {
    marginBottom: "18px",
  },

  groupLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6E7681",
    textTransform: "uppercase",
    letterSpacing: "1.2px",
    margin: "0 0 10px 0",
  },

  btnRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },

  btn: {
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: "600",
    borderRadius: "8px",
    cursor: "pointer",
    letterSpacing: "0.2px",
    fontFamily: "inherit",
  },
};

export default AdminHomePage;
