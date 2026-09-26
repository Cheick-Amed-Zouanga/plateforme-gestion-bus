import { PageHeader } from "../../../shared/components/dashboard";
import DesactivationEmploye from "../../../components/desactivationEmploye";

function DesactivationSavPage() {
  return (
    <>
      <PageHeader
        title="Désactivation agent SAV"
        subtitle="Révoquez l'accès d'un agent SAV."
      />
      <DesactivationEmploye role="sav" titre="Désactiver un agent SAV" />
    </>
  );
}

export default DesactivationSavPage;
