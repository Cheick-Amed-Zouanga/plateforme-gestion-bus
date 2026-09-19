from django.urls import path
from .client_views import (
    ClientSavTicketListCreateView,
    ClientSavTicketDetailView,
    ClientSavTicketMessagesView,
)

urlpatterns = [
    path('tickets/', ClientSavTicketListCreateView.as_view(), name='client-sav-tickets'),
    path('tickets/<int:ticket_id>/', ClientSavTicketDetailView.as_view(), name='client-sav-ticket-detail'),
    path(
        'tickets/<int:ticket_id>/messages/',
        ClientSavTicketMessagesView.as_view(),
        name='client-sav-ticket-messages',
    ),
]
