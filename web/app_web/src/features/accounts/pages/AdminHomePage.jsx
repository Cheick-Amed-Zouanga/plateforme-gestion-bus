import { useNavigate } from "react-router-dom";
import {
  ActionButton,
  PageHeader,
  Panel,
  ShortcutCard,
  StatCard,
} from "../../../shared/components/dashboard";

function AdminHomePage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Console administrateur"
        subtitle="Pilotez les comptes plateforme, les rôles et la supervision TERRASSO."
        actions={
          <ActionButton variant="green" onClick={() => navigate("/admin/inscriptionChef")}>
            + Nouveau chef
          </ActionButton>
        }
      />

      <div className="dash-stats">
        <StatCard label="Rôles gérés" value="3" hint="Chef · SAV · Comptable" accent="#2B7BBF" />
        <StatCard label="Actions RH" value="9" hint="Créer · Modifier · Désactiver" accent="#1FAA59" />
        <StatCard label="Modules ops" value="3" hint="Résa · SAV · Supervision" accent="#E08A2B" />
        <StatCard label="Statut" value="OK" hint="Plateforme opérationnelle" accent="#304FFE" />
      </div>

      <div className="dash-grid-2">
        <Panel
          title="Accès rapides"
          subtitle="Les actions les plus utilisées au quotidien"
        >
          <div className="dash-shortcuts">
            <ShortcutCard
              icon="C"
              title="Inscrire un chef"
              description="Créer une compagnie et son responsable"
              accent="#1FAA59"
              onClick={() => navigate("/admin/inscriptionChef")}
            />
            <ShortcutCard
              icon="S"
              title="Inscrire un SAV"
              description="Ajouter un agent support plateforme"
              accent="#2B7BBF"
              onClick={() => navigate("/admin/inscriptionSav")}
            />
            <ShortcutCard
              icon="$"
              title="Inscrire un comptable"
              description="Ouvrir un compte finance plateforme"
              accent="#7C5CBF"
              onClick={() => navigate("/admin/inscriptionComptable")}
            />
            <ShortcutCard
              icon="M"
              title="Modifier un profil"
              description="Mettre à jour un employé plateforme"
              accent="#2B7BBF"
              onClick={() => navigate("/admin/modificationChefCompagnie")}
            />
            <ShortcutCard
              icon="X"
              title="Désactiver un compte"
              description="Révoquer l'accès d'un employé"
              accent="#304FFE"
              onClick={() => navigate("/admin/desactivationChefCompagnie")}
            />
            <ShortcutCard
              icon="◉"
              title="Supervision"
              description="Tableau de bord et journaux"
              accent="#E08A2B"
              disabled
            />
          </div>
        </Panel>

        <Panel
          title="À venir"
          subtitle="Modules déjà prévus dans la roadmap"
          action={<span className="dash-badge soon">Roadmap</span>}
        >
          <div className="dash-list">
            <div className="dash-list-item">
              <div>
                <strong>Gestion des réservations</strong>
                <div style={{ color: "var(--dash-muted)", fontSize: 13 }}>
                  Historique, annulations, files d'attente
                </div>
              </div>
              <span className="dash-badge soon">Soon</span>
            </div>
            <div className="dash-list-item">
              <div>
                <strong>Service à la clientèle</strong>
                <div style={{ color: "var(--dash-muted)", fontSize: 13 }}>
                  Réclamations et tickets SAV
                </div>
              </div>
              <span className="dash-badge soon">Soon</span>
            </div>
            <div className="dash-list-item">
              <div>
                <strong>Journaux d'activité</strong>
                <div style={{ color: "var(--dash-muted)", fontSize: 13 }}>
                  Audit des actions administrateur
                </div>
              </div>
              <span className="dash-badge soon">Soon</span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Gestion des employés"
        subtitle="Création, modification et désactivation des comptes plateforme"
      >
        <div style={{ marginBottom: 18 }}>
          <p style={groupLabel}>Inscription</p>
          <div className="dash-actions">
            <ActionButton variant="green" onClick={() => navigate("/admin/inscriptionChef")}>
              Chef de compagnie
            </ActionButton>
            <ActionButton variant="green" onClick={() => navigate("/admin/inscriptionSav")}>
              Agent SAV
            </ActionButton>
            <ActionButton variant="green" onClick={() => navigate("/admin/inscriptionComptable")}>
              Comptable
            </ActionButton>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <p style={groupLabel}>Modification</p>
          <div className="dash-actions">
            <ActionButton variant="blue" onClick={() => navigate("/admin/modificationChefCompagnie")}>
              Chef de compagnie
            </ActionButton>
            <ActionButton variant="blue" onClick={() => navigate("/admin/modificationSav")}>
              Agent SAV
            </ActionButton>
            <ActionButton variant="blue" onClick={() => navigate("/admin/modificationComptable")}>
              Comptable
            </ActionButton>
          </div>
        </div>

        <div>
          <p style={groupLabel}>Désactivation</p>
          <div className="dash-actions">
            <ActionButton variant="red" onClick={() => navigate("/admin/desactivationChefCompagnie")}>
              Chef de compagnie
            </ActionButton>
            <ActionButton variant="red" onClick={() => navigate("/admin/desactivationSav")}>
              Agent SAV
            </ActionButton>
            <ActionButton variant="red" onClick={() => navigate("/admin/desactivationComptable")}>
              Comptable
            </ActionButton>
          </div>
        </div>
      </Panel>
    </>
  );
}

const groupLabel = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--dash-muted)",
  textTransform: "uppercase",
  letterSpacing: "1.1px",
  margin: "0 0 10px",
};

export default AdminHomePage;
