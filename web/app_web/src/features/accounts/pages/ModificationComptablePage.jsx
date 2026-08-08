import { PageHeader } from "../../../shared/components/dashboard";
import ModificationEmploye from "../../../components/modificationEmploye";

function ModificationComptablePage() {
  return (
    <>
      <PageHeader
        title="Modification comptable"
        subtitle="Mettez à jour un compte comptable plateforme."
      />
      <ModificationEmploye role="comptable" titre="Modifier un comptable" />
    </>
  );
}

export default ModificationComptablePage;
