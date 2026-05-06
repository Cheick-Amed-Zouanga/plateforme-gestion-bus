import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import ModificationEmploye from "../../../components/modificationEmploye";

function ModificationComptablePage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <Header />
      <SubHeader title="Modification Comptable" />
      <ModificationEmploye role="comptable" titre="Modifier un comptable" />
    </div>
  );
}

export default ModificationComptablePage;
