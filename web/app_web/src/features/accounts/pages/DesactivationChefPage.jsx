import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import DesactivationEmploye from "../../../components/desactivationEmploye";

function DesactivationChefPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <Header />
      <SubHeader title="Désactivation Chef de compagnie" />
      <DesactivationEmploye role="chef_compagnie" titre="Désactiver un chef de compagnie" />
    </div>
  );
}

export default DesactivationChefPage;
