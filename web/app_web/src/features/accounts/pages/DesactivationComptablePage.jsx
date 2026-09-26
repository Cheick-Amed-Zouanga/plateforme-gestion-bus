import { PageHeader } from "../../../shared/components/dashboard";
import DesactivationEmploye from "../../../components/desactivationEmploye";

function DesactivationComptablePage() {
  return (
    <>
      <PageHeader
        title="Désactivation comptable"
        subtitle="Révoquez l'accès d'un comptable plateforme."
      />
      <DesactivationEmploye role="comptable" titre="Désactiver un comptable" />
    </>
  );
}

export default DesactivationComptablePage;
