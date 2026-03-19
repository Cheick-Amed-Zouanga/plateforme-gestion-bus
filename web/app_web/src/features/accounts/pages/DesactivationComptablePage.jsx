import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import DesactivationEmploye from "../../../components/desactivationEmploye";

function DesactivationComptablePage() {
  return (
    <div>
      <Header />
      <SubHeader title="Désactivation Comptable" />
      <DesactivationEmploye
        role="Comptable"
        titre="Désactiver un comptable"
      />
    </div>
  );
}

export default DesactivationComptablePage;