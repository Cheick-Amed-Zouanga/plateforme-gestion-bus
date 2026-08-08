"""
API client mobile : recherche publique, commande authentifiée, mes billets.
"""
from datetime import datetime, time

from django.db.models import Prefetch
from django.db.models.functions import Cast
from django.db.models import IntegerField as DjIntegerField
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import ProfilClient
from apps.transport.models import ArretLigne, Siege, Tarif, Trajet
from .models import Billet, Reservation
from .serializers import BilletSerializer
from .views import _generer_barcode_image, _generer_qr_image, _sieges_occupes


def _profil_client(user):
    try:
        return user.profil_client
    except ProfilClient.DoesNotExist:
        return None


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError:
        return None


def _segment_sur_ligne(ligne, ville_depart, ville_arrivee):
    """Retourne (arret_dep, arret_arr) si la ligne couvre le segment demandé."""
    arrets = list(ligne.arrets.order_by('ordre'))
    dep = next((a for a in arrets if a.ville.lower() == ville_depart.lower()), None)
    arr = next((a for a in arrets if a.ville.lower() == ville_arrivee.lower()), None)
    if not dep or not arr or arr.ordre <= dep.ordre:
        return None, None
    return dep, arr


def _prix_segment(trajet, arret_dep, arret_arr):
    tarif = Tarif.objects.filter(
        compagnie=trajet.compagnie,
        ligne=trajet.ligne,
        arret_depart=arret_dep,
        arret_arrivee=arret_arr,
        type_bus=trajet.bus.type_bus,
    ).first()
    return tarif.prix if tarif else 0


def _places_restantes(trajet, arret_dep, arret_arr):
    total = trajet.bus.sieges.count()
    occupes = _sieges_occupes(trajet, arret_dep.ordre, arret_arr.ordre)
    return max(0, total - len(occupes))


def _serialize_trajet_client(trajet, arret_dep, arret_arr):
    prix = _prix_segment(trajet, arret_dep, arret_arr)
    places = _places_restantes(trajet, arret_dep, arret_arr)
    return {
        'id': trajet.id,
        'compagnie': trajet.compagnie.nom,
        'compagnie_id': trajet.compagnie_id,
        'ligne': str(trajet.ligne),
        'ligne_id': trajet.ligne_id,
        'bus': trajet.bus.immatriculation,
        'type_bus': trajet.bus.type_bus,
        'capacite': trajet.bus.capacite,
        'depart_prevu': trajet.depart_prevu.isoformat(),
        'arrivee_prevue': trajet.arrivee_prevue.isoformat() if trajet.arrivee_prevue else None,
        'statut': trajet.statut,
        'ville_depart': arret_dep.ville,
        'ville_arrivee': arret_arr.ville,
        'arret_depart_id': arret_dep.id,
        'arret_arrivee_id': arret_arr.id,
        'prix': prix,
        'devise': 'XOF',
        'places_disponibles': places,
    }


class ClientVillesView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        villes = (
            ArretLigne.objects
            .values_list('ville', flat=True)
            .distinct()
            .order_by('ville')
        )
        return Response({'villes': list(villes)})


class ClientTrajetsView(APIView):
    """Recherche multi-compagnies : ?depart=&arrivee=&date=YYYY-MM-DD"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        depart = (request.query_params.get('depart') or '').strip()
        arrivee = (request.query_params.get('arrivee') or '').strip()
        date = _parse_date(request.query_params.get('date'))

        if not depart or not arrivee:
            return Response(
                {'message': 'Paramètres depart et arrivee requis.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if depart.lower() == arrivee.lower():
            return Response(
                {'message': 'La ville de départ et d\'arrivée doivent être différentes.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        qs = (
            Trajet.objects
            .filter(
                depart_prevu__gt=now,
                statut__in=['PLANIFIE', 'EN_COURS'],
                ligne__active=True,
                bus__actif=True,
            )
            .select_related('compagnie', 'ligne', 'bus')
            .prefetch_related(
                Prefetch('ligne__arrets', queryset=ArretLigne.objects.order_by('ordre'))
            )
            .order_by('depart_prevu')
        )
        if date:
            start = timezone.make_aware(datetime.combine(date, time.min))
            end = timezone.make_aware(datetime.combine(date, time.max))
            qs = qs.filter(depart_prevu__gte=start, depart_prevu__lte=end)

        resultats = []
        for trajet in qs:
            arret_dep, arret_arr = _segment_sur_ligne(trajet.ligne, depart, arrivee)
            if not arret_dep:
                continue
            resultats.append(_serialize_trajet_client(trajet, arret_dep, arret_arr))

        return Response({'trajets': resultats, 'total': len(resultats)})


class ClientTrajetDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, trajet_id):
        try:
            trajet = (
                Trajet.objects
                .select_related('compagnie', 'ligne', 'bus')
                .prefetch_related('ligne__arrets')
                .get(id=trajet_id, statut__in=['PLANIFIE', 'EN_COURS'])
            )
        except Trajet.DoesNotExist:
            return Response({'message': 'Trajet introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        arrets = [
            {
                'id': a.id,
                'ordre': a.ordre,
                'ville': a.ville,
                'est_depart': a.est_depart,
                'est_arrivee': a.est_arrivee,
                'temps_depuis_depart': a.temps_depuis_depart,
            }
            for a in trajet.ligne.arrets.order_by('ordre')
        ]

        depart = (request.query_params.get('depart') or '').strip()
        arrivee = (request.query_params.get('arrivee') or '').strip()
        arret_dep = arret_arr = None
        segment = None
        if depart and arrivee:
            arret_dep, arret_arr = _segment_sur_ligne(trajet.ligne, depart, arrivee)
            if arret_dep:
                segment = _serialize_trajet_client(trajet, arret_dep, arret_arr)

        return Response({
            'id': trajet.id,
            'compagnie': trajet.compagnie.nom,
            'ligne': str(trajet.ligne),
            'bus': trajet.bus.immatriculation,
            'type_bus': trajet.bus.type_bus,
            'capacite': trajet.bus.capacite,
            'depart_prevu': trajet.depart_prevu.isoformat(),
            'arrivee_prevue': trajet.arrivee_prevue.isoformat() if trajet.arrivee_prevue else None,
            'statut': trajet.statut,
            'arrets': arrets,
            'segment': segment,
        })


class ClientPlanBusView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, trajet_id):
        try:
            trajet = Trajet.objects.select_related('bus', 'ligne').get(
                id=trajet_id, statut__in=['PLANIFIE', 'EN_COURS']
            )
        except Trajet.DoesNotExist:
            return Response({'message': 'Trajet introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        dep_id = request.query_params.get('arret_depart')
        arr_id = request.query_params.get('arret_arrivee')
        dep_ordre, arr_ordre = 0, 99999

        if dep_id:
            try:
                dep_ordre = ArretLigne.objects.get(id=dep_id, ligne=trajet.ligne).ordre
            except ArretLigne.DoesNotExist:
                pass
        if arr_id:
            try:
                arr_ordre = ArretLigne.objects.get(id=arr_id, ligne=trajet.ligne).ordre
            except ArretLigne.DoesNotExist:
                pass

        sieges = list(
            trajet.bus.sieges
            .annotate(num_int=Cast('numero', DjIntegerField()))
            .order_by('num_int')
        )
        occupes = _sieges_occupes(trajet, dep_ordre, arr_ordre)

        plan = []
        for s in sieges:
            b = occupes.get(s.id)
            etat = 'occupe' if b else 'disponible'
            plan.append({'id': s.id, 'numero': int(s.numero), 'etat': etat})

        return Response({
            'bus': trajet.bus.immatriculation,
            'type_bus': trajet.bus.type_bus,
            'capacite': trajet.bus.capacite,
            'plan': plan,
            'disponibles': sum(1 for x in plan if x['etat'] == 'disponible'),
        })


class ClientCommanderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profil = _profil_client(request.user)
        if not profil:
            return Response(
                {'message': 'Seuls les clients peuvent commander via l\'application.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            trajet_id = int(request.data.get('trajet'))
            siege_id = int(request.data.get('siege'))
            arret_depart_id = int(request.data.get('arret_depart'))
            arret_arrivee_id = int(request.data.get('arret_arrivee'))
        except (TypeError, ValueError):
            return Response(
                {'message': 'Paramètres trajet, siege, arret_depart et arret_arrivee requis.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mode_paiement = request.data.get('mode_paiement', Billet.ModePaiement.ESPECES)
        modes_valides = {c[0] for c in Billet.ModePaiement.choices}
        if mode_paiement not in modes_valides:
            return Response({'message': 'Mode de paiement invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            trajet = Trajet.objects.select_related('bus', 'ligne', 'compagnie').get(id=trajet_id)
            siege = Siege.objects.get(id=siege_id)
            arret_dep = ArretLigne.objects.get(id=arret_depart_id)
            arret_arr = ArretLigne.objects.get(id=arret_arrivee_id)
        except (Trajet.DoesNotExist, Siege.DoesNotExist, ArretLigne.DoesNotExist):
            return Response({'message': 'Ressource introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if siege.bus_id != trajet.bus_id:
            return Response({'message': "Ce siège n'appartient pas au bus de ce trajet."}, status=status.HTTP_400_BAD_REQUEST)
        if arret_dep.ligne_id != trajet.ligne_id or arret_arr.ligne_id != trajet.ligne_id:
            return Response({'message': "Les arrêts n'appartiennent pas à la ligne."}, status=status.HTTP_400_BAD_REQUEST)
        if arret_arr.ordre <= arret_dep.ordre:
            return Response({'message': "L'arrêt d'arrivée doit être après le départ."}, status=status.HTTP_400_BAD_REQUEST)
        if trajet.statut in ('TERMINE', 'ANNULE'):
            return Response({'message': 'Ce trajet n\'est plus disponible.'}, status=status.HTTP_400_BAD_REQUEST)
        if trajet.depart_prevu <= timezone.now():
            return Response({'message': "L'heure de départ est dépassée."}, status=status.HTTP_400_BAD_REQUEST)

        occupe = Billet.objects.filter(
            trajet=trajet,
            siege=siege,
            statut_billet__in=[Billet.StatutBillet.CONFIRME, Billet.StatutBillet.UTILISE],
            arret_depart__ordre__lt=arret_arr.ordre,
            arret_arrivee__ordre__gt=arret_dep.ordre,
        ).exists()
        if occupe:
            return Response(
                {'message': f'Le siège {siege.numero} est déjà occupé pour ce segment.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prix = _prix_segment(trajet, arret_dep, arret_arr)
        user = request.user

        reservation = Reservation.objects.create(
            profil_client=profil,
            trajet=trajet,
            statut=Reservation.Statut.EN_ATTENTE,
            montant_total=prix,
        )

        billet = Billet.objects.create(
            reservation=reservation,
            trajet=trajet,
            siege=siege,
            arret_depart=arret_dep,
            arret_arrivee=arret_arr,
            passager_nom=user.last_name or user.username,
            passager_prenom=user.first_name or '',
            passager_telephone=profil.telephone or '',
            mode_paiement=mode_paiement,
            statut_paiement=Billet.StatutPaiement.EN_ATTENTE,
            source=Billet.Source.APP,
            statut_billet=Billet.StatutBillet.CONFIRME,
            prix=prix,
        )

        return Response({
            'message': 'Commande créée. Paiement à régler au guichet.',
            'numero_billet': billet.numero_billet,
            'prix': prix,
            'devise': 'XOF',
            'qr_image': _generer_qr_image(billet.numero_billet),
            'barcode_image': _generer_barcode_image(billet.numero_billet),
            'billet': BilletSerializer(billet).data,
        }, status=status.HTTP_201_CREATED)


class ClientMesBilletsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profil = _profil_client(request.user)
        if not profil:
            return Response(
                {'message': 'Profil client requis.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        billets = (
            Billet.objects
            .filter(reservation__profil_client=profil)
            .select_related(
                'trajet__ligne', 'trajet__bus', 'trajet__compagnie',
                'siege', 'arret_depart', 'arret_arrivee',
            )
            .order_by('-emis_le')
        )
        return Response({'billets': BilletSerializer(billets, many=True).data})


class ClientBilletDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, numero):
        profil = _profil_client(request.user)
        if not profil:
            return Response(
                {'message': 'Profil client requis.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            billet = (
                Billet.objects
                .select_related(
                    'trajet__ligne', 'trajet__bus', 'trajet__compagnie',
                    'siege', 'arret_depart', 'arret_arrivee',
                )
                .get(numero_billet=numero, reservation__profil_client=profil)
            )
        except Billet.DoesNotExist:
            return Response({'message': 'Billet introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'billet': BilletSerializer(billet).data,
            'qr_image': _generer_qr_image(billet.numero_billet),
            'barcode_image': _generer_barcode_image(billet.numero_billet),
        })
