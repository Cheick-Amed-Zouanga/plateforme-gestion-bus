import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";

function SavHomePage() {
  return (
    <div>
      <Header />
      <SubHeader title="Accueil Service à la clientèle" />
      <div style={{ padding: "20px", textAlign: "center" }}>
        Bienvenue sur la page d’accueil du SAV.
      </div>
    </div>
  );
}

export default SavHomePage;