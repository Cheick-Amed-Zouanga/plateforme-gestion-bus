import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";

function AdminHomePage() {
  return (
    <div>
      <Header />
      <SubHeader title="Accueil Administrateur" />
      <div style={{ padding: "20px", textAlign: "center" }}>
        Bienvenue sur la page d’accueil de l’administrateur.
      </div>
    </div>
  );
}

export default AdminHomePage;