import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import ModificationEmploye from "../../../components/modificationEmploye";

function ModificationComptablePage() {
  return (
    <div>
      <Header />
      <SubHeader title="Modification Comptable" />
      <ModificationEmploye
        role="comptable"
        titre="Modifier un comptable"
      />
    </div>
  );
}

export default ModificationComptablePage;