from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketSAVViewSet

router = DefaultRouter()
router.register('tickets', TicketSAVViewSet, basename='sav-tickets')

urlpatterns = [
    path('', include(router.urls)),
]
