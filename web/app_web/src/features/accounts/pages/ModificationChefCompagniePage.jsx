import { PageHeader } from "../../../shared/components/dashboard";
import ModificationEmploye from "../../../components/modificationEmploye";

function ModificationChefPage() {
  return (
    <>
      <PageHeader
        title="Modification chef de compagnie"
        subtitle="Mettez à jour les informations d'un chef existant."
      />
      <ModificationEmploye role="chef_compagnie" titre="Modifier un chef de compagnie" />
    </>
  );
}

export default ModificationChefPage;
