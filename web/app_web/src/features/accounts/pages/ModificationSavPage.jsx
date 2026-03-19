import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import ModificationEmploye from "../../../components/modificationEmploye";

function ModificationSavPage() {
  return (
    <div>
      <Header />
      <SubHeader title="Modification Agent SAV" />
      <ModificationEmploye
        role="sav"
        titre="Modifier un agent SAV"
      />
    </div>
  );
}

export default ModificationSavPage;