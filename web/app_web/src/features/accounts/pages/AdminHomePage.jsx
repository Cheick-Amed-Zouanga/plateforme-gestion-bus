import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import { useNavigate } from "react-router-dom";

function AdminHomePage() {

  const navigate = useNavigate();

  return (
    <div>

      <Header />
      <SubHeader title="Accueil Administrateur" />

      <div style={{ padding: "20px", textAlign: "center" }}>
        Bienvenue sur la page d’accueil de l’administrateur.
      </div>

      {/* ======================= */}
      {/* GESTION DES EMPLOYÉS */}
      {/* ======================= */}

      <div style={{ marginTop: "40px", textAlign: "center" }}>

        <h2>Gestion des employés</h2>

        {/* INSCRIPTION */}
        <div style={{ marginTop: "20px" }}>

          <h3>Inscription</h3>

          <div>
            <button onClick={() => navigate("/admin/inscriptionChef")}>
              Inscription Chef de compagnie
            </button>
          </div>

          <div>
            <button onClick={() => navigate("/admin/inscriptionSav")}>
              Inscription Agent SAV
            </button>
          </div>

          <div>
            <button onClick={() => navigate("/admin/inscriptionComptable")}>
              Inscription Comptable
            </button>
          </div>

        </div>


        {/* MODIFICATION */}
        <div style={{ marginTop: "30px" }}>

          <h3>Modification</h3>

          <div>
            <button onClick={() => navigate("/admin/modificationChefCompagnie")}>
                Modification Chef Compagnie
            </button>
          </div>

          <div>
            <button onClick={() => navigate("/admin/modificationSav")}>
              Modification Agent SAV
            </button>
          </div>

          <div>
            <button onClick={() => navigate("/admin/modificationComptable")}>
              Modification comptable
            </button>
          </div>

        </div>


        {/* DÉSACTIVATION */}
        <div style={{ marginTop: "30px" }}>

          <h3>Désactivation</h3>

          <div>
            <button onClick={() => navigate("/admin/desactivationChefCompagnie")}>
              Désactivation Chef Compagnie
            </button>
          </div>

          <div>
            <button onClick={() => navigate("/admin/desactivationSav")}>
              Désactivation Sav
            </button>
          </div>

          <div>
            <button onClick={() => navigate("/admin/desactivationComptable")}>
              Désactivation Comptable
            </button>
          </div>

        </div>

      </div>


      {/* ======================= */}
      {/* GESTION DES RÉSERVATIONS */}
      {/* ======================= */}

      <div style={{ marginTop: "50px", textAlign: "center" }}>

        <h2>Gestion des réservations</h2>

        <div>
          <button>
            Consulter l'historique des réservations
          </button>
        </div>

        <div>
          <button>
            Consulter les billets annulés
          </button>
        </div>

        <div>
          <button>
            Consulter les réservations en attente
          </button>
        </div>

      </div>


      {/* ======================= */}
      {/* SERVICE À LA CLIENTÈLE */}
      {/* ======================= */}

      <div style={{ marginTop: "50px", textAlign: "center" }}>

        <h2>Service à la clientèle</h2>

        <div>
          <button>
            Accéder à la page du service à la clientèle
          </button>
        </div>

        <div>
          <button>
            Consulter les réclamations
          </button>
        </div>

      </div>


      {/* ======================= */}
      {/* SUPERVISION */}
      {/* ======================= */}

      <div style={{ marginTop: "50px", textAlign: "center" }}>

        <h2>Supervision</h2>

        <div>
          <button>
            Tableau de bord
          </button>
        </div>

        <div>
          <button>
            Journaux d’activité
          </button>
        </div>

      </div>

    </div>
  );
}

export default AdminHomePage;