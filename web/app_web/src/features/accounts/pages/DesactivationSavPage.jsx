import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import DesactivationEmploye from "../../../components/desactivationEmploye";

function DesactivationSavPage() {
  return (
    <div>
      <Header />
      <SubHeader title="Désactivation Agent SAV" />
      <DesactivationEmploye
        role="SAV"
        titre="Désactiver un agent SAV"
      />
    </div>
  );
}

export default DesactivationSavPage;