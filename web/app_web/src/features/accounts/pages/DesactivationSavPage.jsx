import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import DesactivationEmploye from "../../../components/desactivationEmploye";

function DesactivationSavPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <Header />
      <SubHeader title="Désactivation Agent SAV" />
      <DesactivationEmploye role="SAV" titre="Désactiver un agent SAV" />
    </div>
  );
}

export default DesactivationSavPage;
