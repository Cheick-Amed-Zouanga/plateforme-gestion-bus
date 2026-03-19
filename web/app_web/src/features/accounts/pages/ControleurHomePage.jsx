import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";

function ControleurHomePage() {
  return (
    <div>
      <Header />
      <SubHeader title="Accueil Contrôleur" />
      <div style={{ padding: "20px", textAlign: "center" }}>
        Bienvenue sur la page d’accueil du contrôleur.
      </div>
    </div>
  );
}

export default ControleurHomePage;