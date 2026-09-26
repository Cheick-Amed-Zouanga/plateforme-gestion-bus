from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import TicketSAV, MessageSAV
from .serializers import TicketSAVSerializer, MessageSAVSerializer


def _company_for_sav(request, permission_name='sav.read'):
    user = request.user
    company = getattr(user, 'company', None)
    if company is None:
        return None
    if user.has_permission(permission_name) or user.has_permission('billet.read'):
        return company
    return None


class TicketSAVViewSet(viewsets.ModelViewSet):
    """CRUD tickets support client — isolé par company (tenant)."""
    serializer_class = TicketSAVSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'priorite']
    search_fields = ['sujet', 'client_nom', 'client_telephone', 'client_email', 'numero_billet']
    ordering_fields = ['cree_le', 'mis_a_jour_le', 'priorite']
    ordering = ['-cree_le']

    def get_queryset(self):
        company = _company_for_sav(self.request, 'sav.read')
        if company is None:
            return TicketSAV.objects.none()
        return TicketSAV.objects.filter(company=company).prefetch_related('messages')

    def create(self, request, *args, **kwargs):
        company = _company_for_sav(request, 'sav.create')
        if company is None and not _company_for_sav(request, 'sav.update'):
            company = _company_for_sav(request, 'billet.update')
        if company is None:
            return Response(
                {'message': 'Permission sav.create (ou billet.update) requise.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(company=company)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        company = _company_for_sav(request, 'sav.update')
        if company is None:
            company = _company_for_sav(request, 'billet.update')
        if company is None:
            return Response(
                {'message': 'Permission sav.update requise.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        company = _company_for_sav(request, 'sav.delete')
        if company is None:
            return Response(
                {'message': 'Permission sav.delete requise.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def messages(self, request, pk=None):
        """Ajouter une réponse SAV (auteur_client=false)."""
        company = _company_for_sav(request, 'sav.update')
        if company is None:
            company = _company_for_sav(request, 'billet.update')
        if company is None:
            return Response({'message': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

        ticket = self.get_object()
        contenu = (request.data.get('contenu') or '').strip()
        if not contenu:
            return Response({'message': 'contenu requis.'}, status=status.HTTP_400_BAD_REQUEST)

        msg = MessageSAV.objects.create(
            ticket=ticket,
            auteur_client=False,
            contenu=contenu,
        )
        if ticket.statut == TicketSAV.Statut.OUVERT:
            ticket.statut = TicketSAV.Statut.EN_COURS
            ticket.save(update_fields=['statut', 'mis_a_jour_le'])

        return Response(MessageSAVSerializer(msg).data, status=status.HTTP_201_CREATED)
