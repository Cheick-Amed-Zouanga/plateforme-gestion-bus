import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import ModificationEmploye from "../../../components/modificationEmploye";

function ModificationChefPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <Header />
      <SubHeader title="Modification Chef de compagnie" />
      <ModificationEmploye role="chef_compagnie" titre="Modifier un chef de compagnie" />
    </div>
  );
}

export default ModificationChefPage;
