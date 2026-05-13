from django.urls import path
from .views import (
    ReceptionnisteDashboardView,
    ReceptionnisteTrajetsView,
    PlanBusView,
    VenteBilletView,
    PassagersView,
    RechercheView,
    BilletDetailView,
    AnnulerBilletView,
    HistoriqueBilletsView,
    CommandesEnLigneView,
    ControleurMonTrajetView,
    ControleurValiderBilletView,
    ControleurListeEmbarquementView,
    ControleurEscalePasseeView,
    ControleurIncidentsView,
    ControleurIncidentDetailView,
    ControleurRapportView,
)

urlpatterns = [
    # ── Réceptionniste ────────────────────────────────────────────────────────
    path('dashboard/',                          ReceptionnisteDashboardView.as_view(),  name='receptionniste-dashboard'),
    path('trajets/',                            ReceptionnisteTrajetsView.as_view(),    name='receptionniste-trajets'),
    path('trajets/<int:trajet_id>/plan/',       PlanBusView.as_view(),                  name='plan-bus'),
    path('trajets/<int:trajet_id>/passagers/',  PassagersView.as_view(),                name='passagers'),
    path('vendre/',                             VenteBilletView.as_view(),              name='vendre-billet'),
    path('recherche/',                          RechercheView.as_view(),                name='recherche-billet'),
    path('historique/',                         HistoriqueBilletsView.as_view(),        name='historique-billets'),
    path('commandes-en-ligne/',                 CommandesEnLigneView.as_view(),         name='commandes-en-ligne'),
    path('commandes-en-ligne/<str:numero>/',    CommandesEnLigneView.as_view(),         name='commande-detail'),
    path('<str:numero>/',                       BilletDetailView.as_view(),             name='billet-detail'),
    path('<str:numero>/annuler/',               AnnulerBilletView.as_view(),            name='annuler-billet'),

    # ── Contrôleur ────────────────────────────────────────────────────────────
    path('controleur/mon-trajet/',                           ControleurMonTrajetView.as_view(),            name='controleur-mon-trajet'),
    path('controleur/valider/',                              ControleurValiderBilletView.as_view(),         name='controleur-valider'),
    path('controleur/<int:trajet_id>/embarquement/',         ControleurListeEmbarquementView.as_view(),     name='controleur-embarquement'),
    path('controleur/<int:trajet_id>/escale-passee/',        ControleurEscalePasseeView.as_view(),          name='controleur-escale'),
    path('controleur/<int:trajet_id>/incidents/',            ControleurIncidentsView.as_view(),       name='controleur-incidents'),
    path('controleur/incidents/<int:incident_id>/',          ControleurIncidentDetailView.as_view(),  name='controleur-incident-detail'),
    path('controleur/<int:trajet_id>/rapport/',              ControleurRapportView.as_view(),         name='controleur-rapport'),
]
