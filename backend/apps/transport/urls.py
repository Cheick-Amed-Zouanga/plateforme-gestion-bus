from django.urls import path
from .views import (
    BusListCreateView, BusDetailView,
    ArretsPotentielsView,
    LigneListCreateView, LigneDetailModifierView, LigneDesactiverView,
    ArretAjouterView, ArretDetailView,
    CalculerSegmentView,
    TrajetListCreateView, TrajetDetailView,
    TarifListCreateView, TarifDetailView,
    TableauDeBordView,
    HistoriqueTrajetsView,
)

urlpatterns = [
    # ── Tableau de bord ───────────────────────────────────────────────────────
    path('tableau-de-bord/', TableauDeBordView.as_view(), name='tableau-de-bord'),

    # ── Bus ──────────────────────────────────────────────────────────────────
    path('bus/',            BusListCreateView.as_view(), name='bus-list-create'),
    path('bus/<int:bus_id>/', BusDetailView.as_view(),   name='bus-detail'),

    # ── Lignes ───────────────────────────────────────────────────────────────
    path('lignes/',                                       LigneListCreateView.as_view(),    name='ligne-list-create'),
    path('lignes/arrets-potentiels/',                     ArretsPotentielsView.as_view(),   name='arrets-potentiels'),
    path('lignes/calculer-segment/',                      CalculerSegmentView.as_view(),    name='calculer-segment'),
    path('lignes/<int:ligne_id>/',                        LigneDetailModifierView.as_view(), name='ligne-detail'),
    path('lignes/<int:ligne_id>/desactiver/',              LigneDesactiverView.as_view(),    name='ligne-desactiver'),
    path('lignes/<int:ligne_id>/arrets/',                  ArretAjouterView.as_view(),       name='arret-ajouter'),
    path('lignes/<int:ligne_id>/arrets/<int:ordre>/',      ArretDetailView.as_view(),        name='arret-detail'),

    # ── Trajets ──────────────────────────────────────────────────────────────
    path('trajets/',                    TrajetListCreateView.as_view(),  name='trajet-list-create'),
    path('trajets/<int:trajet_id>/',    TrajetDetailView.as_view(),      name='trajet-detail'),
    path('historique/',                 HistoriqueTrajetsView.as_view(), name='historique-trajets'),

    # ── Tarifs ───────────────────────────────────────────────────────────────
    path('tarifs/',               TarifListCreateView.as_view(), name='tarif-list-create'),
    path('tarifs/<int:tarif_id>/', TarifDetailView.as_view(),    name='tarif-detail'),
]
