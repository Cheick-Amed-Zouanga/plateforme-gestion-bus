import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import DesactivationEmploye from "../../../components/desactivationEmploye";

function DesactivationSavPage() {
  return (
    <div>
      <Header />
      <SubHeader title="Désactivation Chef d'un employe service a la clientele" />
      <DesactivationEmploye
        role="Sav"
        titre="Désactiver sav"
      />
    </div>
  );
}

export default DesactivationSavPage;