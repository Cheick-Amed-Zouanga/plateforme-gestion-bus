"""API SAV pour clients mobile (JWT + ProfilClient)."""
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import ProfilClient
from apps.iam.models import Company
from apps.reservation_billets.models import Billet
from .models import TicketSAV, MessageSAV
from .serializers import TicketSAVSerializer, MessageSAVSerializer


def _profil_client(user):
    try:
        return user.profil_client
    except ProfilClient.DoesNotExist:
        return None


def _fill_contact(ticket, user, profil):
    if not ticket.client_nom:
        ticket.client_nom = f"{user.first_name} {user.last_name}".strip() or user.username
    if not ticket.client_email:
        ticket.client_email = user.email or ''
    if not ticket.client_telephone:
        ticket.client_telephone = profil.telephone or ''
    ticket.save(update_fields=['client_nom', 'client_email', 'client_telephone', 'mis_a_jour_le'])


def _resolve_company(profil, numero_billet=None, company_id=None):
    if numero_billet:
        billet = (
            Billet.objects
            .select_related('trajet__company')
            .filter(
                numero_billet=numero_billet,
                reservation__profil_client=profil,
            )
            .first()
        )
        if not billet:
            return None, 'Billet introuvable ou ne vous appartient pas.'
        if not billet.trajet or not billet.trajet.company_id:
            return None, 'Ce billet n\'est lié à aucune compagnie.'
        return billet.trajet.company, None

    if company_id:
        try:
            return Company.objects.get(id=company_id, is_active=True), None
        except (Company.DoesNotExist, ValueError, TypeError):
            return None, 'Compagnie introuvable.'

    # Fallback : dernière compagnie d'un billet client
    last = (
        Billet.objects
        .filter(reservation__profil_client=profil, trajet__company__isnull=False)
        .select_related('trajet__company')
        .order_by('-emis_le')
        .first()
    )
    if last and last.trajet and last.trajet.company:
        return last.trajet.company, None

    # Sinon première compagnie active (SaaS mono-tenant fréquent en démo)
    company = Company.objects.filter(is_active=True).order_by('name').first()
    if company:
        return company, None
    return None, 'Aucune compagnie disponible. Indiquez un numéro de billet.'


class ClientSavTicketListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profil = _profil_client(request.user)
        if not profil:
            return Response(
                {'message': 'Compte client requis.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        qs = (
            TicketSAV.objects
            .filter(profil_client=profil)
            .prefetch_related('messages')
            .order_by('-cree_le')
        )
        return Response({
            'tickets': TicketSAVSerializer(qs, many=True).data,
        })

    def post(self, request):
        profil = _profil_client(request.user)
        if not profil:
            return Response(
                {'message': 'Compte client requis.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        sujet = (request.data.get('sujet') or '').strip()
        description = (request.data.get('description') or '').strip()
        if not sujet or not description:
            return Response(
                {'message': 'sujet et description sont obligatoires.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        numero_billet = (request.data.get('numero_billet') or '').strip()
        company_id = request.data.get('company_id') or request.data.get('company')
        priorite = request.data.get('priorite') or TicketSAV.Priorite.MOYENNE
        if priorite not in {c[0] for c in TicketSAV.Priorite.choices}:
            priorite = TicketSAV.Priorite.MOYENNE

        company, err = _resolve_company(profil, numero_billet or None, company_id)
        if err:
            return Response({'message': err}, status=status.HTTP_400_BAD_REQUEST)

        ticket = TicketSAV.objects.create(
            company=company,
            profil_client=profil,
            sujet=sujet,
            description=description,
            priorite=priorite,
            numero_billet=numero_billet,
            statut=TicketSAV.Statut.OUVERT,
        )
        _fill_contact(ticket, request.user, profil)

        # Premier message = description → démarre la conversation
        MessageSAV.objects.create(
            ticket=ticket,
            auteur_client=True,
            contenu=description,
        )

        ticket = TicketSAV.objects.prefetch_related('messages').get(pk=ticket.pk)
        return Response(
            TicketSAVSerializer(ticket).data,
            status=status.HTTP_201_CREATED,
        )


class ClientSavTicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_ticket(self, request, ticket_id):
        profil = _profil_client(request.user)
        if not profil:
            return None, Response(
                {'message': 'Compte client requis.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            ticket = (
                TicketSAV.objects
                .prefetch_related('messages')
                .get(id=ticket_id, profil_client=profil)
            )
            return ticket, None
        except TicketSAV.DoesNotExist:
            return None, Response(
                {'message': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND,
            )

    def get(self, request, ticket_id):
        ticket, err = self._get_ticket(request, ticket_id)
        if err:
            return err
        return Response(TicketSAVSerializer(ticket).data)


class ClientSavTicketMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id):
        profil = _profil_client(request.user)
        if not profil:
            return Response(
                {'message': 'Compte client requis.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            ticket = TicketSAV.objects.get(id=ticket_id, profil_client=profil)
        except TicketSAV.DoesNotExist:
            return Response({'message': 'Ticket introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if ticket.statut == TicketSAV.Statut.FERME:
            return Response(
                {'message': 'Ce ticket est fermé. Ouvrez un nouveau ticket si besoin.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        contenu = (request.data.get('contenu') or '').strip()
        if not contenu:
            return Response({'message': 'contenu requis.'}, status=status.HTTP_400_BAD_REQUEST)

        msg = MessageSAV.objects.create(
            ticket=ticket,
            auteur_client=True,
            contenu=contenu,
        )
        if ticket.statut == TicketSAV.Statut.RESOLU:
            ticket.statut = TicketSAV.Statut.OUVERT
            ticket.save(update_fields=['statut', 'mis_a_jour_le'])

        return Response(MessageSAVSerializer(msg).data, status=status.HTTP_201_CREATED)
