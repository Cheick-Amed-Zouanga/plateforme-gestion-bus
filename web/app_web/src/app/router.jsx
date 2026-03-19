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
            <ProtectedRoute>
              <AdminHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chef"
          element={
            <ProtectedRoute>
              <ChefHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sav"
          element={
            <ProtectedRoute>
              <SavHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/controleur"
          element={
            <ProtectedRoute>
              <ControleurHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/comptable"
          element={
            <ProtectedRoute>
              <ComptableHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionniste"
          element={
            <ProtectedRoute>
              <ReceptionnisteHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/inscriptionChef"
          element={
            <ProtectedRoute>
              <InscriptionChef />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/inscriptionSav"
          element={
            <ProtectedRoute>
              <InscriptionSav />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/inscriptionComptable"
          element={
            <ProtectedRoute>
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
            <ProtectedRoute>
              <ModificationChefPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/modificationSav"
          element={
            <ProtectedRoute>
              <ModificationSavPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/modificationComptable"
          element={
            <ProtectedRoute>
              <ModificationComptablePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/desactivationChefCompagnie"
          element={
            <ProtectedRoute>
              <DesactivationChefPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/desactivationSav"
          element={
            <ProtectedRoute>
              <DesactivationSavPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/desactivationComptable"
          element={
            <ProtectedRoute>
              <DesactivationComptablePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;