import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import DesactivationEmploye from "../../../components/desactivationEmploye";

function DesactivationComptablePage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <Header />
      <SubHeader title="Désactivation Comptable" />
      <DesactivationEmploye role="Comptable" titre="Désactiver un comptable" />
    </div>
  );
}

export default DesactivationComptablePage;
