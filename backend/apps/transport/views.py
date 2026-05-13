from datetime import timedelta

from django.db.models import Count, Sum
from django.db.models.deletion import ProtectedError
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.accounts.models import ProfilEmploye
from .models import Bus, Siege, Ligne, ArretLigne, Trajet, Tarif
from .serializers import (
    BusSerializer, CreationBusSerializer, ModificationBusSerializer,
    LigneListSerializer, LigneDetailSerializer,
    CreationLigneCompleteSerializer, ModificationLigneSerializer,
    AjoutArretSerializer, ModificationArretSerializer,
    TrajetSerializer, CreationTrajetSerializer, ModificationTrajetSerializer,
    TarifSerializer, CreationTarifSerializer, ModificationTarifSerializer,
)
from .services import coordonnees_ville, calculer_segment, trouver_arrets_potentiels


#  Helpers 
def get_chef_compagnie(request):
    try:
        profil = request.user.profil_employe
    except ProfilEmploye.DoesNotExist:
        return None, None
    if profil.role != ProfilEmploye.Role.CHEF_COMPAGNIE or profil.compagnie is None:
        return None, None
    return profil, profil.compagnie


def _auto_annuler_trajets_vides(compagnie):
    """Annule les trajets dont l'heure de départ est passée et qui n'ont aucun billet."""
    from apps.reservation_billets.models import Billet
    trajets_depasses = Trajet.objects.filter(
        compagnie=compagnie,
        statut__in=[Trajet.Statut.PLANIFIE, Trajet.Statut.EN_COURS],
        depart_prevu__lte=timezone.now(),
    )
    for t in trajets_depasses:
        nb = Billet.objects.filter(
            trajet=t, statut_billet__in=['CONFIRME', 'UTILISE']
        ).count()
        if nb == 0:
            t.statut = Trajet.Statut.ANNULE
            t.save()


def _acces_refuse():
    return Response(
        {'message': 'Accès réservé au chef de compagnie.'},
        status=status.HTTP_403_FORBIDDEN,
    )


def _generer_code_ligne(compagnie):
    mots    = compagnie.nom.split()
    prefixe = ''.join(m[0].upper() for m in mots[:3])
    n       = Ligne.objects.filter(compagnie=compagnie).count() + 1
    code    = f"{prefixe}-{n:03d}"
    while Ligne.objects.filter(code=code).exists():
        n   += 1
        code = f"{prefixe}-{n:03d}"
    return code


def _get_ligne_chef(request, ligne_id):
    _, compagnie = get_chef_compagnie(request)
    if not compagnie:
        return None, _acces_refuse()
    try:
        ligne = Ligne.objects.prefetch_related('arrets').get(id=ligne_id, compagnie=compagnie)
        return ligne, None
    except Ligne.DoesNotExist:
        return None, Response({'message': 'Ligne introuvable.'}, status=status.HTTP_404_NOT_FOUND)


# ─── Bus ─────────────────────────────────────────────────────────────────────

class BusListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return _acces_refuse()
        bus = Bus.objects.filter(compagnie=compagnie).order_by('immatriculation')
        return Response(BusSerializer(bus, many=True).data)

    def post(self, request):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return _acces_refuse()
        serializer = CreationBusSerializer(data=request.data)
        if serializer.is_valid():
            bus = Bus.objects.create(compagnie=compagnie, **serializer.validated_data)
            Siege.objects.bulk_create(
                [Siege(bus=bus, numero=str(i)) for i in range(1, bus.capacite + 1)]
            )
            return Response(
                {'message': f"Bus {bus.immatriculation} créé avec {bus.capacite} sièges.", 'id': bus.id},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BusDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_bus(self, request, bus_id):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return None, _acces_refuse()
        try:
            return Bus.objects.get(id=bus_id, compagnie=compagnie), None
        except Bus.DoesNotExist:
            return None, Response({'message': 'Bus introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, bus_id):
        bus, err = self._get_bus(request, bus_id)
        if err:
            return err
        return Response(BusSerializer(bus).data)

    def patch(self, request, bus_id):
        bus, err = self._get_bus(request, bus_id)
        if err:
            return err
        serializer = ModificationBusSerializer(data=request.data, partial=True, context={'bus': bus})
        if serializer.is_valid():
            for attr, val in serializer.validated_data.items():
                setattr(bus, attr, val)
            bus.save()
            return Response({'message': 'Bus modifié.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, bus_id):
        bus, err = self._get_bus(request, bus_id)
        if err:
            return err
        if Trajet.objects.filter(bus=bus, statut__in=['PLANIFIE', 'EN_COURS']).exists():
            return Response(
                {'message': 'Impossible de désactiver un bus avec des trajets planifiés ou en cours.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        bus.actif = False
        bus.save()
        return Response({'message': 'Bus désactivé.'})


#Lignes 

class ArretsPotentielsView(APIView):
    """
    Retourne les villes situées sur ou à proximité de l'itinéraire départ→arrivée.
    Le frontend les affiche pour que le chef choisisse ses arrêts intermédiaires.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return _acces_refuse()

        ville_dep = request.data.get('ville_depart', '').strip()
        ville_arr = request.data.get('ville_arrivee', '').strip()

        if not ville_dep or not ville_arr:
            return Response(
                {'message': 'ville_depart et ville_arrivee sont obligatoires.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not coordonnees_ville(ville_dep):
            return Response(
                {'message': f"Ville « {ville_dep} » introuvable."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not coordonnees_ville(ville_arr):
            return Response(
                {'message': f"Ville « {ville_arr} » introuvable."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if ville_dep == ville_arr:
            return Response(
                {'message': 'Départ et arrivée doivent être différents.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        arrets = trouver_arrets_potentiels(ville_dep, ville_arr)

        # Ajouter la distance et durée estimées depuis le départ pour chaque arrêt
        lat_d, lon_d = coordonnees_ville(ville_dep)
        for arret in arrets:
            seg = calculer_segment(lat_d, lon_d, arret['latitude'], arret['longitude'])
            arret['distance_depuis_depart_km'] = seg['distance_km']
            arret['duree_depuis_depart_min']   = seg['duree_minutes']

        return Response({
            'ville_depart':  ville_dep,
            'ville_arrivee': ville_arr,
            'arrets_potentiels': arrets,
        })


class LigneListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return _acces_refuse()
        lignes = Ligne.objects.filter(compagnie=compagnie).prefetch_related('arrets').order_by('-date_creation')
        return Response(LigneListSerializer(lignes, many=True).data)

    def post(self, request):
        """
        Crée une ligne complète en une seule requête :
        ville_depart + ville_arrivee + arrêts intermédiaires optionnels.
        """
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return _acces_refuse()

        serializer = CreationLigneCompleteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data      = serializer.validated_data
        ville_dep = data['ville_depart']
        ville_arr = data['ville_arrivee']

        coords_dep = coordonnees_ville(ville_dep)
        coords_arr = coordonnees_ville(ville_arr)
        if not coords_dep:
            return Response(
                {'message': f"Ville de départ « {ville_dep} » introuvable."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not coords_arr:
            return Response(
                {'message': f"Ville d'arrivée « {ville_arr} » introuvable."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Valider les coordonnées de tous les arrêts intermédiaires
        arrets_data = data.get('arrets', [])
        coords_arrets = []
        for a in arrets_data:
            c = coordonnees_ville(a['ville'])
            if not c:
                return Response(
                    {'message': f"Arrêt intermédiaire « {a['ville']} » introuvable."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            coords_arrets.append(c)

        # Création de la ligne
        code  = _generer_code_ligne(compagnie)
        ligne = Ligne.objects.create(
            compagnie=compagnie,
            code=code,
            nom=data['nom'],
            description=data.get('description', ''),
        )

        # Construction de la séquence complète : départ → intermédiaires → arrivée
        sequence = [
            {'ville': ville_dep, 'coords': coords_dep,
             'duree_montee': 0, 'duree_descente': 0, 'duree_pause': 0},
            *[
                {'ville': a['ville'], 'coords': c,
                 'duree_montee':   a.get('duree_montee_passagers', 0),
                 'duree_descente': a.get('duree_descente_passagers', 0),
                 'duree_pause':    a.get('duree_pause', 0)}
                for a, c in zip(arrets_data, coords_arrets)
            ],
            {'ville': ville_arr, 'coords': coords_arr,
             'duree_montee': 0, 'duree_descente': 0, 'duree_pause': 0},
        ]

        arrets_a_creer = []
        prev_coords = None
        n = len(sequence)
        for i, stop in enumerate(sequence, start=1):
            lat, lon = stop['coords']
            dist_km  = 0.0
            duree    = 0
            if prev_coords:
                seg      = calculer_segment(prev_coords[0], prev_coords[1], lat, lon)
                dist_km  = seg['distance_km']
                duree    = seg['duree_minutes']
            arrets_a_creer.append(ArretLigne(
                ligne=ligne, ordre=i,
                ville=stop['ville'], latitude=lat, longitude=lon,
                distance_depuis_precedent=dist_km,
                duree_route_depuis_precedent=duree,
                duree_montee_passagers=stop['duree_montee'],
                duree_descente_passagers=stop['duree_descente'],
                duree_pause=stop['duree_pause'],
                est_depart=(i == 1),
                est_arrivee=(i == n),
            ))
            prev_coords = (lat, lon)

        # bulk_create ne déclenche pas les signaux → recalcul manuel
        ArretLigne.objects.bulk_create(arrets_a_creer)
        ligne.recalculer_temps()

        return Response({
            'message':   'Ligne créée avec succès.',
            'id':        ligne.id,
            'code':      code,
            'nb_arrets': len(arrets_a_creer),
        }, status=status.HTTP_201_CREATED)


class LigneDetailModifierView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ligne_id):
        ligne, err = _get_ligne_chef(request, ligne_id)
        if err:
            return err
        return Response(LigneDetailSerializer(ligne).data)

    def patch(self, request, ligne_id):
        ligne, err = _get_ligne_chef(request, ligne_id)
        if err:
            return err
        serializer = ModificationLigneSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            for attr, val in serializer.validated_data.items():
                setattr(ligne, attr, val)
            ligne.save()
            return Response({'message': 'Ligne modifiée.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, ligne_id):
        ligne, err = _get_ligne_chef(request, ligne_id)
        if err:
            return err
        if Trajet.objects.filter(ligne=ligne, statut__in=['PLANIFIE', 'EN_COURS']).exists():
            return Response(
                {'message': 'Impossible de supprimer une ligne avec des trajets planifiés ou en cours.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            ligne.delete()
        except ProtectedError:
            return Response(
                {'message': 'Cette ligne a des trajets associés. Supprimez tous les trajets de cette ligne avant de la supprimer.'},
                status=status.HTTP_409_CONFLICT,
            )
        return Response({'message': 'Ligne supprimée.'})


class LigneDesactiverView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ligne_id):
        ligne, err = _get_ligne_chef(request, ligne_id)
        if err:
            return err
        ligne.active = False
        ligne.save()
        return Response({'message': 'Ligne désactivée.'})


# Arrêts

class ArretAjouterView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ligne_id):
        ligne, err = _get_ligne_chef(request, ligne_id)
        if err:
            return err

        serializer = AjoutArretSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data  = serializer.validated_data
        ville = data['ville']

        coords = coordonnees_ville(ville)
        if not coords:
            return Response(
                {'message': f"Ville « {ville} » introuvable. Vérifiez l'orthographe."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        lat, lon = coords

        arrets_existants = list(ligne.arrets.order_by('ordre'))
        ordre       = len(arrets_existants) + 1
        est_depart  = (ordre == 1)
        distance_km = 0.0
        duree_route = 0

        if arrets_existants:
            prev = arrets_existants[-1]
            seg         = calculer_segment(prev.latitude, prev.longitude, lat, lon)
            distance_km = seg['distance_km']
            duree_route = seg['duree_minutes']
            ArretLigne.objects.filter(ligne=ligne, est_arrivee=True).update(est_arrivee=False)

        arret = ArretLigne.objects.create(
            ligne=ligne, ordre=ordre,
            ville=ville, latitude=lat, longitude=lon,
            distance_depuis_precedent=distance_km,
            duree_route_depuis_precedent=duree_route,
            duree_montee_passagers=data.get('duree_montee_passagers', 0),
            duree_descente_passagers=data.get('duree_descente_passagers', 0),
            duree_pause=data.get('duree_pause', 0),
            est_depart=est_depart,
            est_arrivee=True,
        )

        return Response({
            'message':          f"Arrêt « {ville} » ajouté (position {ordre}).",
            'id':               arret.id,
            'ordre':            arret.ordre,
            'distance_km':      distance_km,
            'duree_route_min':  duree_route,
            'temps_depuis_dep': arret.temps_depuis_depart,
        }, status=status.HTTP_201_CREATED)


class ArretDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_arret(self, request, ligne_id, ordre):
        ligne, err = _get_ligne_chef(request, ligne_id)
        if err:
            return None, err
        try:
            arret = ArretLigne.objects.get(ligne=ligne, ordre=ordre)
            return arret, None
        except ArretLigne.DoesNotExist:
            return None, Response({'message': 'Arrêt introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, ligne_id, ordre):
        arret, err = self._get_arret(request, ligne_id, ordre)
        if err:
            return err
        serializer = ModificationArretSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            for attr, val in serializer.validated_data.items():
                setattr(arret, attr, val)
            arret.save()
            return Response({'message': 'Arrêt modifié.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, ligne_id, ordre):
        arret, err = self._get_arret(request, ligne_id, ordre)
        if err:
            return err
        ligne = arret.ligne
        arret.delete()

        arrets = list(ArretLigne.objects.filter(ligne=ligne).order_by('ordre'))
        for i, a in enumerate(arrets, start=1):
            a.ordre       = i
            a.est_depart  = (i == 1)
            a.est_arrivee = (i == len(arrets))
        if arrets:
            ArretLigne.objects.bulk_update(arrets, ['ordre', 'est_depart', 'est_arrivee'])
            ligne.recalculer_temps()

        return Response({'message': 'Arrêt supprimé et positions recalculées.'})


#  Segment ORS (prévisualisation) 

class CalculerSegmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return _acces_refuse()

        ville_dep = request.data.get('ville_depart', '').strip()
        ville_arr = request.data.get('ville_arrivee', '').strip()

        if not ville_dep or not ville_arr:
            return Response(
                {'message': 'ville_depart et ville_arrivee sont obligatoires.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        coords_dep = coordonnees_ville(ville_dep)
        coords_arr = coordonnees_ville(ville_arr)

        if not coords_dep:
            return Response({'message': f"Ville « {ville_dep} » introuvable."}, status=status.HTTP_400_BAD_REQUEST)
        if not coords_arr:
            return Response({'message': f"Ville « {ville_arr} » introuvable."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(calculer_segment(*coords_dep, *coords_arr))


#  Trajets 

class TrajetListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return _acces_refuse()
        _auto_annuler_trajets_vides(compagnie)
        trajets = (
            Trajet.objects
            .filter(compagnie=compagnie)
            .select_related('ligne', 'bus', 'controleur__utilisateur')
            .order_by('-depart_prevu')
        )
        return Response(TrajetSerializer(trajets, many=True).data)

    def post(self, request):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return _acces_refuse()
        serializer = CreationTrajetSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            if data['bus'].compagnie != compagnie:
                return Response(
                    {'message': "Ce bus n'appartient pas à votre compagnie."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            controleur = data.get('controleur')
            if controleur and controleur.compagnie != compagnie:
                return Response({'message': "Ce contrôleur n'appartient pas à votre compagnie."},
                                status=status.HTTP_400_BAD_REQUEST)
            trajet = Trajet.objects.create(
                compagnie=compagnie,
                ligne=data['ligne'],
                bus=data['bus'],
                controleur=controleur,
                depart_prevu=data['depart_prevu'],
                arrivee_prevue=data.get('arrivee_prevue'),
            )
            return Response({'message': 'Trajet créé.', 'id': trajet.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TrajetDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_trajet(self, request, trajet_id):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return None, _acces_refuse()
        try:
            trajet = Trajet.objects.select_related('ligne', 'bus').get(
                id=trajet_id, compagnie=compagnie
            )
            return trajet, None
        except Trajet.DoesNotExist:
            return None, Response({'message': 'Trajet introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, trajet_id):
        trajet, err = self._get_trajet(request, trajet_id)
        if err:
            return err
        return Response(TrajetSerializer(trajet).data)

    def patch(self, request, trajet_id):
        trajet, err = self._get_trajet(request, trajet_id)
        if err:
            return err
        serializer = ModificationTrajetSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            data = serializer.validated_data
            # Vérifie que le nouveau bus appartient à la compagnie
            if 'bus' in data and data['bus'].compagnie != trajet.compagnie:
                return Response(
                    {'message': "Ce bus n'appartient pas à votre compagnie."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            for attr, val in data.items():
                setattr(trajet, attr, val)
            trajet.save()
            return Response({'message': 'Trajet modifié.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, trajet_id):
        trajet, err = self._get_trajet(request, trajet_id)
        if err:
            return err
        if trajet.statut == 'EN_COURS':
            return Response(
                {'message': 'Impossible de supprimer un trajet en cours.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            trajet.delete()
        except ProtectedError:
            return Response(
                {'message': 'Ce trajet a des billets ou réservations attachés. Annulez-le plutôt que de le supprimer.'},
                status=status.HTTP_409_CONFLICT,
            )
        return Response({'message': 'Trajet supprimé.'})


# ─── Historique trajets ───────────────────────────────────────────────────────

class HistoriqueTrajetsView(APIView):
    """Trajets terminés ou annulés avec stats billets — chef de compagnie."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return _acces_refuse()

        from apps.reservation_billets.models import Billet

        # Paramètre optionnel : limiter aux N derniers jours (défaut 180)
        jours = int(request.query_params.get('jours', 180))
        depuis = timezone.now() - timedelta(days=jours)

        trajets = (
            Trajet.objects
            .filter(compagnie=compagnie, statut__in=['TERMINE', 'ANNULE'], depart_prevu__gte=depuis)
            .select_related('ligne', 'bus', 'controleur__utilisateur')
            .order_by('-depart_prevu')
        )

        data = []
        for t in trajets:
            billets_qs = Billet.objects.filter(trajet=t, statut_billet__in=['CONFIRME', 'UTILISE'])
            nb_billets = billets_qs.count()
            recettes   = billets_qs.filter(statut_paiement='PAYE').aggregate(s=Sum('prix'))['s'] or 0
            capacite   = t.bus.capacite or 1
            data.append({
                'id':            t.id,
                'ligne_display': str(t.ligne),
                'bus_display':   t.bus.immatriculation,
                'depart_prevu':  t.depart_prevu.isoformat(),
                'arrivee_prevue': t.arrivee_prevue.isoformat() if t.arrivee_prevue else None,
                'statut':        t.statut,
                'statut_display': t.get_statut_display(),
                'controleur':    (
                    f"{t.controleur.utilisateur.first_name} {t.controleur.utilisateur.last_name}".strip()
                    if t.controleur else None
                ),
                'capacite':      t.bus.capacite,
                'nb_billets':    nb_billets,
                'recettes':      recettes,
                'taux_occupation': round(nb_billets * 100 / capacite) if capacite else 0,
            })

        total_recettes = sum(d['recettes'] for d in data)
        return Response({
            'trajets':       data,
            'total_trajets': len(data),
            'total_recettes': total_recettes,
        })


# ─── Tableau de bord ──────────────────────────────────────────────────────────

class TableauDeBordView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return _acces_refuse()

        _auto_annuler_trajets_vides(compagnie)

        aujourd_hui = timezone.now().date()

        bus_actifs   = Bus.objects.filter(compagnie=compagnie, actif=True).count()
        bus_inactifs = Bus.objects.filter(compagnie=compagnie, actif=False).count()

        total_employes = (
            ProfilEmploye.objects
            .filter(compagnie=compagnie, actif=True)
            .exclude(role=ProfilEmploye.Role.CHEF_COMPAGNIE)
            .count()
        )

        trajets_du_jour_qs = (
            Trajet.objects
            .filter(compagnie=compagnie, depart_prevu__date=aujourd_hui)
            .select_related('ligne', 'bus')
            .order_by('depart_prevu')
        )

        statuts_counts = {
            s['statut']: s['total']
            for s in Trajet.objects
                .filter(compagnie=compagnie)
                .values('statut')
                .annotate(total=Count('id'))
        }

        horaires = []
        for t in trajets_du_jour_qs:
            arrets_ligne = list(t.ligne.arrets.order_by('ordre'))
            arrets_detail = [
                {
                    'ville':       a.ville,
                    'heure':       (t.depart_prevu + timedelta(minutes=a.temps_depuis_depart)).strftime('%H:%M'),
                    'est_depart':  a.est_depart,
                    'est_arrivee': a.est_arrivee,
                }
                for a in arrets_ligne
            ]

            tarifs_detail = [
                {
                    'depart_ville':  tarif.arret_depart.ville,
                    'arrivee_ville': tarif.arret_arrivee.ville,
                    'prix':          tarif.prix,
                    'devise':        tarif.devise,
                }
                for tarif in (
                    Tarif.objects
                    .filter(compagnie=compagnie, ligne=t.ligne, type_bus=t.bus.type_bus)
                    .select_related('arret_depart', 'arret_arrivee')
                    .order_by('arret_depart__ordre')
                )
            ]

            heure_arrivee = (
                t.arrivee_prevue.strftime('%H:%M')
                if t.arrivee_prevue
                else (arrets_detail[-1]['heure'] if arrets_detail else '—')
            )

            horaires.append({
                'id':              t.id,
                'bus':             t.bus.immatriculation,
                'type_bus':        t.bus.type_bus,
                'type_bus_display':t.bus.get_type_bus_display(),
                'capacite':        t.bus.capacite,
                'ligne':           str(t.ligne),
                'ligne_id':        t.ligne.id,
                'depart':          t.depart_prevu.strftime('%H:%M'),
                'arrivee':         heure_arrivee,
                'statut':          t.statut,
                'arrets':          arrets_detail,
                'tarifs':          tarifs_detail,
            })

        employes = [
            {
                'nom':          (
                    f"{e.utilisateur.first_name} {e.utilisateur.last_name}".strip()
                    or e.utilisateur.username
                ),
                'role':         e.role,
                'role_display': e.get_role_display(),
            }
            for e in (
                ProfilEmploye.objects
                .filter(compagnie=compagnie, actif=True)
                .exclude(role=ProfilEmploye.Role.CHEF_COMPAGNIE)
                .select_related('utilisateur')
                .order_by('role', 'utilisateur__last_name')
            )
        ]

        return Response({
            'stats': {
                'bus_actifs':      bus_actifs,
                'total_employes':  total_employes,
                'trajets_du_jour': len(horaires),
                'planifies':       statuts_counts.get('PLANIFIE', 0),
            },
            'etat_flotte': [
                {'statut': 'Actifs',   'count': bus_actifs,   'couleur': '#56D364'},
                {'statut': 'Inactifs', 'count': bus_inactifs, 'couleur': '#FF7B72'},
            ],
            'horaires_du_jour': horaires,
            'employes':         employes,
        })


#  Tarifs

class TarifListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return _acces_refuse()
        tarifs = Tarif.objects.filter(compagnie=compagnie).select_related('ligne', 'arret_depart', 'arret_arrivee')
        return Response(TarifSerializer(tarifs, many=True).data)

    def post(self, request):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return _acces_refuse()
        serializer = CreationTarifSerializer(data=request.data, context={'compagnie': compagnie})
        if serializer.is_valid():
            data  = serializer.validated_data
            tarif = Tarif.objects.create(
                compagnie=compagnie,
                ligne=data['ligne'],
                arret_depart=data['arret_depart'],
                arret_arrivee=data['arret_arrivee'],
                type_bus=data['type_bus'],
                prix=data['prix'],
                devise=data.get('devise', 'XOF'),
            )
            return Response({'message': 'Tarif défini.', 'id': tarif.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TarifDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_tarif(self, request, tarif_id):
        _, compagnie = get_chef_compagnie(request)
        if not compagnie:
            return None, _acces_refuse()
        try:
            return Tarif.objects.get(id=tarif_id, compagnie=compagnie), None
        except Tarif.DoesNotExist:
            return None, Response({'message': 'Tarif introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, tarif_id):
        tarif, err = self._get_tarif(request, tarif_id)
        if err:
            return err
        serializer = ModificationTarifSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            for attr, val in serializer.validated_data.items():
                setattr(tarif, attr, val)
            tarif.save()
            return Response({'message': 'Tarif modifié.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, tarif_id):
        tarif, err = self._get_tarif(request, tarif_id)
        if err:
            return err
        tarif.delete()
        return Response({'message': 'Tarif supprimé.'})
