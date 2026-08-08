from django.urls import path

from .views import (
    CsrfTokenView,
    InscriptionClientView,
    ConnexionView,
    DeconnexionView,
    TokenRefreshCookieView,
    ProfilConnecteView,
    CreationChefCompagnieView,
    CreationSAVView,
    CreationComptablePlateformeView,
    CreationEmployeCompagnieView,
    ListeEmployesCompagnieView,
    ModifierClientView,
    ModifierMonProfilChefView,
    ModifierEmployeCompagnieView,
    ModifierEmployePlateformeView,
    DesactiverMonCompteClientView,
    DesactiverEmployeCompagnieView,
    DesactiverEmployePlateformeView,
    DemandeReinitialisationView,
    VerifierCodeReinitialisationView,
    ReinitialiserCompteView,
)

urlpatterns = [
    # Auth
    path("csrf/",          CsrfTokenView.as_view(),         name="csrf-token"),
    path("connexion/",     ConnexionView.as_view(),          name="connexion"),
    path("deconnexion/",   DeconnexionView.as_view(),        name="deconnexion"),
    path("token/refresh/", TokenRefreshCookieView.as_view(), name="token-refresh"),

    # Inscription & profil
    path("inscription/client/", InscriptionClientView.as_view(), name="inscription-client"),
    path("me/",                  ProfilConnecteView.as_view(),    name="profil-connecte"),

    # Liste & création de comptes employés
    path("employes/",         ListeEmployesCompagnieView.as_view(),     name="liste-employes-compagnie"),
    path("chefs/creer/",      CreationChefCompagnieView.as_view(),      name="creer-chef-compagnie"),
    path("sav/creer/",        CreationSAVView.as_view(),                name="creer-sav"),
    path("comptables/creer/", CreationComptablePlateformeView.as_view(), name="creer-comptable-plateforme"),
    path("employes/creer/",   CreationEmployeCompagnieView.as_view(),   name="creer-employe-compagnie"),

    # Modification de profils
    path("client/modifier/",                         ModifierClientView.as_view(),            name="modifier-client"),
    path("chef/modifier-mon-profil/",                ModifierMonProfilChefView.as_view(),      name="modifier-mon-profil-chef"),
    path("employes/<int:employe_id>/modifier/",      ModifierEmployeCompagnieView.as_view(),   name="modifier-employe-compagnie"),
    path("plateforme/employes/modifier/",            ModifierEmployePlateformeView.as_view(),  name="modifier-employe-plateforme"),

    # Désactivation de comptes
    path("client/desactiver/",                       DesactiverMonCompteClientView.as_view(),    name="desactiver-mon-compte-client"),
    path("employes/<int:employe_id>/desactiver/",    DesactiverEmployeCompagnieView.as_view(),   name="desactiver-employe-compagnie"),
    path("plateforme/employes/desactiver/",          DesactiverEmployePlateformeView.as_view(),  name="desactiver-employe-plateforme"),

    # Réinitialisation de compte (flux 3 étapes)
    path("demande-reinitialisation/", DemandeReinitialisationView.as_view(),      name="demande-reinitialisation"),
    path("verifier-code/",            VerifierCodeReinitialisationView.as_view(), name="verifier-code-reinitialisation"),
    path("reinitialiser-compte/",     ReinitialiserCompteView.as_view(),          name="reinitialiser-compte"),
]
