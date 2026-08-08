import { PageHeader } from "../../../shared/components/dashboard";
import ModificationEmploye from "../../../components/modificationEmploye";

function ModificationSavPage() {
  return (
    <>
      <PageHeader
        title="Modification agent SAV"
        subtitle="Mettez à jour un compte service clientèle."
      />
      <ModificationEmploye role="sav" titre="Modifier un agent SAV" />
    </>
  );
}

export default ModificationSavPage;
