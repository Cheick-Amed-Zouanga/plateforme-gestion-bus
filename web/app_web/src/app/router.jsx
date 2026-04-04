import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import SessionTimeout from "../components/SessionTimeOut";
import ProtectedRoute from "../components/ProtectedRoute";

import LoginPage from "../features/accounts/pages/LoginPage";
import AdminHomePage from "../features/accounts/pages/AdminHomePage";
import ChefHomePage from "../features/accounts/pages/ChefHomePage";
import SavHomePage from "../features/accounts/pages/SavHomePage";
import ControleurHomePage from "../features/accounts/pages/ControleurHomePage";
import ComptableHomePage from "../features/accounts/pages/ComptableHomePage";
import ReceptionnisteHomePage from "../features/accounts/pages/ReceptionnisteHomePage";

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
              <AdminHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chef"
          element={
            <ProtectedRoute roles={CHEF}>
              <ChefHomePage />
            </ProtectedRoute>
          }
        />

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

        <Route
          path="/admin/inscriptionChef"
          element={
            <ProtectedRoute roles={ADMIN}>
              <InscriptionChef />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/inscriptionSav"
          element={
            <ProtectedRoute roles={ADMIN}>
              <InscriptionSav />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/inscriptionComptable"
          element={
            <ProtectedRoute roles={ADMIN}>
              <InscriptionComptable />
            </ProtectedRoute>
          }
        />

        <Route path="/recuperationCompte" element={<RecuperationComptePage />} />
        <Route path="/verificationCode" element={<VerificationCodePage />} />
        <Route path="/reinitialisationCompte" element={<ReinitialisationComptePage />} />

        <Route
          path="/admin/modificationChefCompagnie"
          element={
            <ProtectedRoute roles={ADMIN}>
              <ModificationChefPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/modificationSav"
          element={
            <ProtectedRoute roles={ADMIN}>
              <ModificationSavPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/modificationComptable"
          element={
            <ProtectedRoute roles={ADMIN}>
              <ModificationComptablePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/desactivationChefCompagnie"
          element={
            <ProtectedRoute roles={ADMIN}>
              <DesactivationChefPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/desactivationSav"
          element={
            <ProtectedRoute roles={ADMIN}>
              <DesactivationSavPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/desactivationComptable"
          element={
            <ProtectedRoute roles={ADMIN}>
              <DesactivationComptablePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
