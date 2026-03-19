import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";

function ComptableHomePage() {
  return (
    <div>
      <Header />
      <SubHeader title="Accueil Comptable" />
      <div style={{ padding: "20px", textAlign: "center" }}>
        Bienvenue sur la page d’accueil du comptable.
      </div>
    </div>
  );
}

export default ComptableHomePage;