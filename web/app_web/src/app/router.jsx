import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import SessionTimeout from "../components/SessionTimeOut";
import ProtectedRoute from "../components/ProtectedRoute";

import LoginPage from "../features/accounts/pages/LoginPage";
import AdminLayout from "../features/accounts/layouts/AdminLayout";
import AdminHomePage from "../features/accounts/pages/AdminHomePage";
import ChefLayout from "../features/chef/layouts/ChefLayout";
import ChefHomePage from "../features/accounts/pages/ChefHomePage";
import SavHomePage from "../features/accounts/pages/SavHomePage";
import ComptableHomePage from "../features/accounts/pages/ComptableHomePage";

// Pages réceptionniste
import ReceptionnisteHomePage             from "../features/receptionniste/pages/ReceptionnisteHomePage";
import ReceptionnisteVenteBilletPage      from "../features/receptionniste/pages/ReceptionnisteVenteBilletPage";
import ReceptionnisteListePassagersPage   from "../features/receptionniste/pages/ReceptionnisteListePassagersPage";
import ReceptionnisteRechercheReservationPage from "../features/receptionniste/pages/ReceptionnisteRechercheReservationPage";
import ReceptionnisteDetailBilletPage        from "../features/receptionniste/pages/ReceptionnisteDetailBilletPage";
import ReceptionnisteCommandesEnLignePage    from "../features/receptionniste/pages/ReceptionnisteCommandesEnLignePage";
import ReceptionnisteHistoriquePage          from "../features/receptionniste/pages/ReceptionnisteHistoriquePage";

// Pages contrôleur
import ControleurHomePage          from "../features/controleur/pages/ControleurHomePage";
import ControleurValidationBilletPage from "../features/controleur/pages/ControleurValidationBilletPage";
import ControleurSuiviPage         from "../features/controleur/pages/ControleurSuiviPage";
import ControleurIncidentsPage     from "../features/controleur/pages/ControleurIncidentsPage";
import ControleurRapportPage        from "../features/controleur/pages/ControleurRapportPage";
import ControleurEmbarquementPage   from "../features/controleur/pages/ControleurEmbarquementPage";

import InscriptionChef from "../features/accounts/pages/InscriptionChef";
import InscriptionSav from "../features/accounts/pages/InscriptionSav";
import InscriptionComptable from "../features/accounts/pages/InscriptionComptable";

import RecuperationComptePage from "../features/accounts/pages/RecuperationComptePage";
import VerificationCodePage from "../features/accounts/pages/VerificationCodePage";
import ReinitialisationComptePage from "../features/accounts/pages/ReinitialisationComptePage";

import ModificationChefPage from "../features/accounts/pages/ModificationChefCompagniePage";
import ModificationComptablePage from "../features/accounts/pages/ModificationComptablePage";
import ModificationSavPage from "../features/accounts/pages/ModificationSavPage";

import DesactivationChefPage from "../features/accounts/pages/DesactivationChefPage";
import DesactivationComptablePage from "../features/accounts/pages/DesactivationComptablePage";
import DesactivationSavPage from "../features/accounts/pages/DesactivationSavPage";

// Pages chef — module transport
import ChefBusPage         from "../features/chef/pages/ChefBusPage";
import ChefBusCreerPage    from "../features/chef/pages/ChefBusCreerPage";
import ChefLignesPage      from "../features/chef/pages/ChefLignesPage";
import ChefLigneCreerPage  from "../features/chef/pages/ChefLigneCreerPage";
import ChefTrajetsPage     from "../features/chef/pages/ChefTrajetsPage";
import ChefTrajetCreerPage from "../features/chef/pages/ChefTrajetCreerPage";
import ChefEmployesPage    from "../features/chef/pages/ChefEmployesPage";
import ChefTarifsPage      from "../features/chef/pages/ChefTarifsPage";
import ChefTarifsCreerPage   from "../features/chef/pages/ChefTarifsCreerPage";
import ChefHistoriquePage    from "../features/chef/pages/ChefHistoriquePage";

const ADMIN = ["ADMIN_PLATEFORME"];
const CHEF = ["CHEF_COMPAGNIE"];
const SAV = ["SAV"];
const CONTROLEUR = ["CONTROLEUR"];
const COMPTABLE = ["COMPTABLE"];
const RECEPTIONNISTE = ["RECEPTIONNISTE"];

function Router() {
  return (
    <BrowserRouter>
      <SessionTimeout />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={ADMIN}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHomePage />} />
          <Route path="inscriptionChef" element={<InscriptionChef />} />
          <Route path="inscriptionSav" element={<InscriptionSav />} />
          <Route path="inscriptionComptable" element={<InscriptionComptable />} />
          <Route path="modificationChefCompagnie" element={<ModificationChefPage />} />
          <Route path="modificationSav" element={<ModificationSavPage />} />
          <Route path="modificationComptable" element={<ModificationComptablePage />} />
          <Route path="desactivationChefCompagnie" element={<DesactivationChefPage />} />
          <Route path="desactivationSav" element={<DesactivationSavPage />} />
          <Route path="desactivationComptable" element={<DesactivationComptablePage />} />
        </Route>

        <Route
          path="/chef"
          element={
            <ProtectedRoute roles={CHEF}>
              <ChefLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ChefHomePage />} />
          <Route path="bus" element={<ChefBusPage />} />
          <Route path="bus/creer" element={<ChefBusCreerPage />} />
          <Route path="lignes" element={<ChefLignesPage />} />
          <Route path="lignes/creer" element={<ChefLigneCreerPage />} />
          <Route path="trajets" element={<ChefTrajetsPage />} />
          <Route path="trajets/creer" element={<ChefTrajetCreerPage />} />
          <Route path="employes" element={<ChefEmployesPage />} />
          <Route path="employes/inscrire" element={<ChefEmployesPage />} />
          <Route path="tarifs" element={<ChefTarifsPage />} />
          <Route path="tarifs/creer" element={<ChefTarifsCreerPage />} />
          <Route path="historique" element={<ChefHistoriquePage />} />
        </Route>

        <Route
          path="/sav"
          element={
            <ProtectedRoute roles={SAV}>
              <SavHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/controleur"
          element={
            <ProtectedRoute roles={CONTROLEUR}>
              <ControleurHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/comptable"
          element={
            <ProtectedRoute roles={COMPTABLE}>
              <ComptableHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionniste"
          element={
            <ProtectedRoute roles={RECEPTIONNISTE}>
              <ReceptionnisteHomePage />
            </ProtectedRoute>
          }
        />

        {/* ── Routes Réceptionniste ── */}
        <Route path="/receptionniste/vente"      element={<ProtectedRoute roles={RECEPTIONNISTE}><ReceptionnisteVenteBilletPage /></ProtectedRoute>} />
        <Route path="/receptionniste/passagers"  element={<ProtectedRoute roles={RECEPTIONNISTE}><ReceptionnisteListePassagersPage /></ProtectedRoute>} />
        <Route path="/receptionniste/recherche"  element={<ProtectedRoute roles={RECEPTIONNISTE}><ReceptionnisteRechercheReservationPage /></ProtectedRoute>} />
        <Route path="/receptionniste/billet/:numero"  element={<ProtectedRoute roles={RECEPTIONNISTE}><ReceptionnisteDetailBilletPage /></ProtectedRoute>} />
        <Route path="/receptionniste/commandes"        element={<ProtectedRoute roles={RECEPTIONNISTE}><ReceptionnisteCommandesEnLignePage /></ProtectedRoute>} />
        <Route path="/receptionniste/historique"      element={<ProtectedRoute roles={RECEPTIONNISTE}><ReceptionnisteHistoriquePage /></ProtectedRoute>} />

        {/* ── Routes Contrôleur ── */}
        <Route path="/controleur/valider"                  element={<ProtectedRoute roles={CONTROLEUR}><ControleurValidationBilletPage /></ProtectedRoute>} />
        <Route path="/controleur/suivi/:trajetId"          element={<ProtectedRoute roles={CONTROLEUR}><ControleurSuiviPage /></ProtectedRoute>} />
        <Route path="/controleur/incidents/:trajetId"      element={<ProtectedRoute roles={CONTROLEUR}><ControleurIncidentsPage /></ProtectedRoute>} />
        <Route path="/controleur/rapport/:trajetId"          element={<ProtectedRoute roles={CONTROLEUR}><ControleurRapportPage /></ProtectedRoute>} />
        <Route path="/controleur/embarquement/:trajetId"    element={<ProtectedRoute roles={CONTROLEUR}><ControleurEmbarquementPage /></ProtectedRoute>} />

        <Route path="/recuperationCompte" element={<RecuperationComptePage />} />
        <Route path="/verificationCode" element={<VerificationCodePage />} />
        <Route path="/reinitialisationCompte" element={<ReinitialisationComptePage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default Router;
