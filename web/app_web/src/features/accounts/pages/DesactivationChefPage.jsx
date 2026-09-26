import { PageHeader } from "../../../shared/components/dashboard";
import DesactivationEmploye from "../../../components/desactivationEmploye";

function DesactivationChefPage() {
  return (
    <>
      <PageHeader
        title="Désactivation chef de compagnie"
        subtitle="Révoquez l'accès d'un chef de compagnie."
      />
      <DesactivationEmploye role="chef_compagnie" titre="Désactiver un chef de compagnie" />
    </>
  );
}

export default DesactivationChefPage;
