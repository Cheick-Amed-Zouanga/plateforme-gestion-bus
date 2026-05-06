import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";

function ComptableHomePage() {
  return (
    <div style={styles.page}>
      <Header />
      <SubHeader title="Accueil Comptable" />
      <main style={styles.main}>
        <div style={styles.card}>
          <p style={styles.text}>Bienvenue sur la page d'accueil du comptable.</p>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" },
  main: { maxWidth: "960px", margin: "0 auto", padding: "32px 20px" },
  card: { backgroundColor: "#161B22", borderRadius: "14px", padding: "28px 30px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", borderLeft: "4px solid #C41E3A" },
  text: { color: "#8B949E", fontSize: "15px", margin: 0 },
};

export default ComptableHomePage;
