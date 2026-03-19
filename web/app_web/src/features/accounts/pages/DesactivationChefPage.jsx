import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import DesactivationEmploye from "../../../components/desactivationEmploye";

function DesactivationChefPage() {
  return (
    <div>
      <Header />
      <SubHeader title="Désactivation Chef de compagnie" />
      <DesactivationEmploye
        role="chef_compagnie"
        titre="Désactiver un chef de compagnie"
      />
    </div>
  );
}

export default DesactivationChefPage;