import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";

function ReceptionnisteHomePage() {
  return (
    <div>
      <Header />
      <SubHeader title="Accueil Réceptionniste" />
      <div style={{ padding: "20px", textAlign: "center" }}>
        Bienvenue sur la page d’accueil du réceptionniste.
      </div>
    </div>
  );
}

export default ReceptionnisteHomePage;