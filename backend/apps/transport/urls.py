from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import BusViewSet, LigneViewSet, TrajetViewSet, TarifViewSet

# Enregistrer les ViewSets avec le router
router = DefaultRouter()
router.register(r'bus', BusViewSet, basename='bus')
router.register(r'lignes', LigneViewSet, basename='ligne')
router.register(r'trajets', TrajetViewSet, basename='trajet')
router.register(r'tarifs', TarifViewSet, basename='tarif')

urlpatterns = [
    # ── API ViewSets ─────────────────────────────────────────────────────
    path('', include(router.urls)),
]
