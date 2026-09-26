from django.urls import path

from .client_views import (
    ClientBilletDetailView,
    ClientCommanderView,
    ClientMesBilletsView,
    ClientPlanBusView,
    ClientTrajetDetailView,
    ClientTrajetsView,
    ClientVillesView,
)

urlpatterns = [
    path('villes/', ClientVillesView.as_view(), name='client-villes'),
    path('trajets/', ClientTrajetsView.as_view(), name='client-trajets'),
    path('trajets/<int:trajet_id>/', ClientTrajetDetailView.as_view(), name='client-trajet-detail'),
    path('trajets/<int:trajet_id>/plan/', ClientPlanBusView.as_view(), name='client-plan-bus'),
    path('commander/', ClientCommanderView.as_view(), name='client-commander'),
    path('mes-billets/', ClientMesBilletsView.as_view(), name='client-mes-billets'),
    path('mes-billets/<str:numero>/', ClientBilletDetailView.as_view(), name='client-billet-detail'),
]
