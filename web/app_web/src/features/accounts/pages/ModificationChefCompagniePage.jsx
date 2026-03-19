import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import ModificationEmploye from "../../../components/modificationEmploye";

function ModificationChefPage() {
  return (
    <div>
      <Header />
      <SubHeader title="Modification Chef de compagnie" />
      <ModificationEmploye
        role="chef_compagnie"
        titre="Modifier un chef de compagnie"
      />
    </div>
  );
}

export default ModificationChefPage;