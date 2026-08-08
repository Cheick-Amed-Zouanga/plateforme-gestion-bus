"""
Vues guichet (Réceptionniste) et contrôle (Contrôleur).
"""
from datetime import timedelta

from django.db import models
from django.db.models import Count, Sum
from django.db.models.functions import Cast
from django.db.models import IntegerField as DjIntegerField
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.accounts.models import ProfilEmploye
from apps.transport.models import Trajet, ArretLigne, Siege, Tarif, Ligne, Bus
from .models import Billet, Incident, RapportTrajet
from .serializers import (
    BilletSerializer, VenteBilletSerializer, BilletModificationSerializer,
    IncidentSerializer, IncidentCreationSerializer, IncidentResolutionSerializer,
    RapportCreationSerializer, RapportTrajetSerializer,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_role(request, role):
    try:
        p = request.user.profil_employe
    except ProfilEmploye.DoesNotExist:
        return None, None
    if p.role != role or not p.compagnie:
        return None, None
    return p, p.compagnie


def _receptionniste(request):
    return _get_role(request, ProfilEmploye.Role.RECEPTIONNISTE)


def _controleur(request):
    return _get_role(request, ProfilEmploye.Role.CONTROLEUR)


def _chef(request):
    return _get_role(request, ProfilEmploye.Role.CHEF_COMPAGNIE)


def _staff_compagnie(request):
    """Réceptionniste, contrôleur ou chef de la même compagnie."""
    for getter in (_receptionniste, _controleur, _chef):
        profil, compagnie = getter(request)
        if compagnie:
            return profil, compagnie
    return None, None


def _acces_refuse(msg='Accès refusé.'):
    return Response({'message': msg}, status=status.HTTP_403_FORBIDDEN)


def _get_trajet(trajet_id, compagnie):
    try:
        return Trajet.objects.select_related('bus', 'ligne', 'controleur__utilisateur').get(
            id=trajet_id, compagnie=compagnie
        ), None
    except Trajet.DoesNotExist:
        return None, Response({'message': 'Trajet introuvable.'}, status=status.HTTP_404_NOT_FOUND)


def _sieges_occupes(trajet, dep_ordre, arr_ordre):
    """Dict siege_id → Billet pour les sièges occupés sur le segment [dep_ordre, arr_ordre[."""
    return {
        b.siege_id: b
        for b in Billet.objects.filter(
            trajet=trajet,
            statut_billet__in=[Billet.StatutBillet.CONFIRME, Billet.StatutBillet.UTILISE],
            siege__isnull=False,
            arret_depart__ordre__lt=arr_ordre,
            arret_arrivee__ordre__gt=dep_ordre,
        ).select_related('siege', 'arret_depart', 'arret_arrivee')
    }


def _verifier_conflit(bus, controleur, depart_prevu, arrivee_prevue, exclude_id=None):
    """Retourne un message d'erreur si conflit détecté, sinon None."""
    if not arrivee_prevue:
        return None
    base_qs = Trajet.objects.filter(statut__in=['PLANIFIE', 'EN_COURS'],
                                    depart_prevu__lt=arrivee_prevue,
                                    arrivee_prevue__gt=depart_prevu)
    if exclude_id:
        base_qs = base_qs.exclude(id=exclude_id)

    if base_qs.filter(bus=bus).exists():
        t = base_qs.filter(bus=bus).first()
        return f"Bus {bus.immatriculation} déjà assigné au trajet #{t.id} ({t.depart_prevu.strftime('%H:%M')} – {t.arrivee_prevue.strftime('%H:%M')})."
    if controleur and base_qs.filter(controleur=controleur).exists():
        t = base_qs.filter(controleur=controleur).first()
        return f"Contrôleur déjà assigné au trajet #{t.id} ({t.depart_prevu.strftime('%H:%M')})."
    return None


def _generer_qr_image(contenu):
    try:
        import qrcode, base64
        from io import BytesIO
        qr = qrcode.QRCode(box_size=6, border=2)
        qr.add_data(contenu)
        qr.make(fit=True)
        img = qr.make_image(fill_color='black', back_color='white')
        buf = BytesIO()
        img.save(buf, format='PNG')
        return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
    except Exception:
        return ''


def _generer_barcode_image(contenu):
    try:
        import barcode, base64
        from barcode.writer import ImageWriter
        from io import BytesIO
        buf = BytesIO()
        barcode.get('code128', contenu, writer=ImageWriter()).write(buf, options={
            'write_text': True,
            'font_size':  8,
            'text_distance': 3.0,
            'module_height': 8.0,
            'quiet_zone':    2.0,
            'dpi': 150,
        })
        buf.seek(0)
        return 'data:image/png;base64,' + base64.b64encode(buf.read()).decode()
    except Exception:
        return ''



#  RÉCEPTIONNISTE


class ReceptionnisteDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profil, compagnie = _receptionniste(request)
        if not compagnie:
            return _acces_refuse()

        from apps.transport.views import _auto_annuler_trajets_vides
        _auto_annuler_trajets_vides(compagnie)

        aujourd_hui = timezone.now().date()

        billets_auj = Billet.objects.filter(
            trajet__compagnie=compagnie,
            emis_le__date=aujourd_hui,
            statut_billet=Billet.StatutBillet.CONFIRME,
        )
        encaissement = (
            billets_auj
            .filter(statut_paiement=Billet.StatutPaiement.PAYE)
            .aggregate(t=Sum('prix'))['t'] or 0
        )
        en_attente_nb = Billet.objects.filter(
            trajet__compagnie=compagnie,
            statut_paiement=Billet.StatutPaiement.EN_ATTENTE,
            statut_billet=Billet.StatutBillet.CONFIRME,
        ).count()

        dans_un_mois = timezone.now() + timedelta(days=30)
        trajets_dispo = (
            Trajet.objects
            .filter(
                compagnie=compagnie,
                depart_prevu__gt=timezone.now(),
                depart_prevu__lte=dans_un_mois,
                statut__in=['PLANIFIE', 'EN_COURS'],
            )
            .select_related('bus', 'ligne', 'controleur__utilisateur')
            .order_by('depart_prevu')
        )

        trajets_data, alertes = [], []
        for t in trajets_dispo:
            nb_vendus = Billet.objects.filter(
                trajet=t,
                statut_billet__in=[Billet.StatutBillet.CONFIRME, Billet.StatutBillet.UTILISE],
            ).count()
            cap  = t.bus.capacite
            taux = round(nb_vendus / cap * 100) if cap else 0

            ctrl = None
            if t.controleur:
                u    = t.controleur.utilisateur
                ctrl = f"{u.first_name} {u.last_name}".strip() or u.username

            est_aujourd_hui = t.depart_prevu.date() == aujourd_hui

            trajets_data.append({
                'id':           t.id,
                'bus':          t.bus.immatriculation,
                'type_bus':     t.bus.type_bus,
                'ligne':        str(t.ligne),
                'depart':       t.depart_prevu.strftime('%H:%M'),
                'date':         t.depart_prevu.strftime('%d/%m/%Y'),
                'est_aujourd_hui': est_aujourd_hui,
                'controleur':   ctrl,
                'vendus':       nb_vendus,
                'capacite':     cap,
                'taux':         taux,
                'statut':       t.statut,
            })
            if taux >= 90 and t.statut == 'PLANIFIE':
                alertes.append({'type': 'occupation',
                                 'message': f"Trajet {str(t.ligne)} ({t.depart_prevu.strftime('%d/%m %H:%M')}) — {taux}% complet"})

        if en_attente_nb:
            alertes.append({'type': 'paiement',
                             'message': f"{en_attente_nb} billet(s) en attente de paiement"})

        commandes_en_ligne_attente = Billet.objects.filter(
            trajet__compagnie=compagnie,
            source=Billet.Source.APP,
            statut_billet=Billet.StatutBillet.CONFIRME,
            statut_paiement=Billet.StatutPaiement.EN_ATTENTE,
        ).count()

        return Response({
            'stats': {
                'billets_auj':               billets_auj.count(),
                'encaissement':              encaissement,
                'trajets_auj':               Trajet.objects.filter(compagnie=compagnie, depart_prevu__date=aujourd_hui, statut__in=['PLANIFIE', 'EN_COURS']).count(),
                'en_attente_paiement':       en_attente_nb,
                'commandes_en_ligne_attente': commandes_en_ligne_attente,
            },
            'trajets': trajets_data,
            'alertes': alertes,
        })


class ReceptionnisteTrajetsView(APIView):
    """Liste des trajets disponibles pour la vente (aujourd'hui + futurs non annulés)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profil, compagnie = _receptionniste(request)
        if not compagnie:
            return _acces_refuse()

        trajets = (
            Trajet.objects
            .filter(compagnie=compagnie, depart_prevu__gt=timezone.now(), statut__in=['PLANIFIE', 'EN_COURS'])
            .select_related('bus', 'ligne', 'controleur__utilisateur')
            .prefetch_related('ligne__arrets')
            .order_by('depart_prevu')
        )

        data = []
        for t in trajets:
            arrets = list(t.ligne.arrets.order_by('ordre'))
            data.append({
                'id':              t.id,
                'bus_display':     t.bus.immatriculation,
                'type_bus':        t.bus.type_bus,
                'type_bus_display':t.bus.get_type_bus_display(),
                'ligne_display':   str(t.ligne),
                'ligne_id':        t.ligne.id,
                'depart_prevu':    t.depart_prevu.isoformat(),
                'statut':          t.statut,
                'capacite':        t.bus.capacite,
                'arrets': [{'id': a.id, 'ville': a.ville, 'ordre': a.ordre} for a in arrets],
            })
        return Response(data)

    def post(self, request):
        """La réceptionniste peut aussi créer un trajet."""
        profil, compagnie = _receptionniste(request)
        if not compagnie:
            return _acces_refuse()

        data = request.data
        try:
            ligne      = Ligne.objects.get(id=data.get('ligne'), compagnie=compagnie)
            bus        = Bus.objects.get(id=data.get('bus'), compagnie=compagnie)
            controleur = None
            if data.get('controleur'):
                controleur = ProfilEmploye.objects.get(
                    id=data['controleur'], compagnie=compagnie,
                    role=ProfilEmploye.Role.CONTROLEUR, actif=True,
                )
        except (Ligne.DoesNotExist, Bus.DoesNotExist, ProfilEmploye.DoesNotExist) as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        from django.utils.dateparse import parse_datetime
        depart_prevu = parse_datetime(data.get('depart_prevu', ''))
        if not depart_prevu:
            return Response({'message': 'Date/heure de départ invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        # Auto-calcul arrivée depuis le dernier arrêt de la ligne
        dernier = ligne.arrets.order_by('-ordre').first()
        arrivee_prevue = (
            depart_prevu + timedelta(minutes=dernier.temps_depuis_depart)
            if dernier else None
        )

        conflit = _verifier_conflit(bus, controleur, depart_prevu, arrivee_prevue)
        if conflit:
            return Response({'message': conflit}, status=status.HTTP_409_CONFLICT)

        trajet = Trajet.objects.create(
            compagnie=compagnie, ligne=ligne, bus=bus,
            controleur=controleur, depart_prevu=depart_prevu, arrivee_prevue=arrivee_prevue,
        )
        return Response({'message': 'Trajet créé.', 'id': trajet.id}, status=status.HTTP_201_CREATED)


class PlanBusView(APIView):
    """Plan visuel des sièges : libre / payé / en attente de paiement."""
    permission_classes = [IsAuthenticated]

    def get(self, request, trajet_id):
        profil, compagnie = _staff_compagnie(request)
        if not compagnie:
            return _acces_refuse()

        trajet, err = _get_trajet(trajet_id, compagnie)
        if err:
            return err

        dep_id, arr_id = request.query_params.get('arret_depart'), request.query_params.get('arret_arrivee')
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
            if b:
                if b.statut_paiement == Billet.StatutPaiement.PAYE:
                    etat = 'paye'
                else:
                    etat = 'en_attente'
                passager = b.nom_passager()
                segment = (
                    f"{b.arret_depart.ville} → {b.arret_arrivee.ville}"
                    if b.arret_depart and b.arret_arrivee else ''
                )
                source = b.source
                statut_paiement = b.statut_paiement
            else:
                etat, passager, segment = 'disponible', None, ''
                source, statut_paiement = None, None
            plan.append({
                'id': s.id,
                'numero': int(s.numero),
                'etat': etat,
                'passager': passager,
                'segment': segment,
                'source': source,
                'statut_paiement': statut_paiement,
            })

        dispo = sum(1 for x in plan if x['etat'] == 'disponible')
        payes = sum(1 for x in plan if x['etat'] == 'paye')
        en_attente = sum(1 for x in plan if x['etat'] == 'en_attente')
        return Response({
            'bus': trajet.bus.immatriculation,
            'type_bus': trajet.bus.type_bus,
            'capacite': trajet.bus.capacite,
            'plan': plan,
            'stats': {
                'total': len(plan),
                'disponibles': dispo,
                'payes': payes,
                'en_attente': en_attente,
                'taux_occupation': round((len(plan) - dispo) / len(plan) * 100) if plan else 0,
            },
        })


class VenteBilletView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profil, compagnie = _receptionniste(request)
        if not compagnie:
            return _acces_refuse()

        serializer = VenteBilletSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        d = serializer.validated_data
        if d['trajet'].compagnie != compagnie:
            return Response({'message': "Ce trajet n'appartient pas à votre compagnie."}, status=status.HTTP_403_FORBIDDEN)

        # Prix depuis les tarifs de la ligne
        tarif = Tarif.objects.filter(
            compagnie=compagnie,
            ligne=d['trajet'].ligne,
            arret_depart=d['arret_depart'],
            arret_arrivee=d['arret_arrivee'],
            type_bus=d['trajet'].bus.type_bus,
        ).first()
        prix = tarif.prix if tarif else 0

        billet = Billet.objects.create(
            trajet=d['trajet'],
            siege=d['siege'],
            arret_depart=d['arret_depart'],
            arret_arrivee=d['arret_arrivee'],
            passager_nom=d['passager_nom'],
            passager_prenom=d['passager_prenom'],
            passager_telephone=d['passager_telephone'],
            passager_piece_identite=d.get('passager_piece_identite', ''),
            mode_paiement=d['mode_paiement'],
            statut_paiement=d['statut_paiement'],
            source=Billet.Source.GUICHET,
            statut_billet=Billet.StatutBillet.CONFIRME,
            prix=prix,
            vendu_par=profil,
        )
        qr_image      = _generer_qr_image(billet.numero_billet)
        barcode_image = _generer_barcode_image(billet.numero_billet)
        return Response({
            'message':       'Billet vendu.',
            'numero_billet': billet.numero_billet,
            'siege':         d['siege'].numero,
            'prix':          prix,
            'qr_image':      qr_image,
            'barcode_image': barcode_image,
            'billet':        BilletSerializer(billet).data,
        }, status=status.HTTP_201_CREATED)


class PassagersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, trajet_id):
        profil, compagnie = _receptionniste(request)
        if not compagnie:
            profil, compagnie = _controleur(request)
            if not compagnie:
                return _acces_refuse()

        trajet, err = _get_trajet(trajet_id, compagnie)
        if err:
            return err

        qs = Billet.objects.filter(
            trajet=trajet,
            statut_billet__in=[Billet.StatutBillet.CONFIRME, Billet.StatutBillet.UTILISE],
        ).select_related('siege', 'arret_depart', 'arret_arrivee').order_by(
            Cast('siege__numero', DjIntegerField())
        )

        arret_id = request.query_params.get('arret')
        if arret_id:
            try:
                a = ArretLigne.objects.get(id=arret_id)
                qs = qs.filter(arret_depart__ordre__lte=a.ordre, arret_arrivee__ordre__gt=a.ordre)
            except ArretLigne.DoesNotExist:
                pass

        data = [{
            'id': b.id,
            'numero_billet':     b.numero_billet,
            'siege_numero':      int(b.siege.numero) if b.siege else None,
            'passager':          b.nom_passager(),
            'passager_telephone': b.passager_telephone,
            'arret_depart_ville':  b.arret_depart.ville  if b.arret_depart  else '—',
            'arret_arrivee_ville': b.arret_arrivee.ville if b.arret_arrivee else '—',
            'statut_billet':     b.statut_billet,
            'statut_paiement':   b.statut_paiement,
            'source':            b.source,
            'prix':              b.prix,
            'devise':            b.devise,
        } for b in qs]

        return Response({
            'total': len(data),
            'passagers': data,
        })


class RechercheView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profil, compagnie = _receptionniste(request)
        if not compagnie:
            return _acces_refuse()

        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'billets': []})

        billets = Billet.objects.filter(trajet__compagnie=compagnie).select_related(
            'trajet__ligne', 'trajet__bus', 'siege', 'arret_depart', 'arret_arrivee',
        ).filter(
            models.Q(numero_billet__icontains=q)
            | models.Q(passager_nom__icontains=q)
            | models.Q(passager_prenom__icontains=q)
            | models.Q(passager_telephone__icontains=q)
        )[:30]

        return Response({'billets': BilletSerializer(billets, many=True).data})


class BilletDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_billet(self, request, numero):
        profil, compagnie = _receptionniste(request)
        if not compagnie:
            return None, None, _acces_refuse()
        try:
            b = Billet.objects.select_related(
                'trajet__ligne', 'trajet__bus', 'siege', 'arret_depart', 'arret_arrivee'
            ).get(numero_billet=numero, trajet__compagnie=compagnie)
            return b, profil, None
        except Billet.DoesNotExist:
            return None, None, Response({'message': 'Billet introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, numero):
        b, _, err = self._get_billet(request, numero)
        if err:
            return err
        data = BilletSerializer(b).data
        data['qr_image']      = _generer_qr_image(b.numero_billet)
        data['barcode_image'] = _generer_barcode_image(b.numero_billet)
        return Response(data)

    def patch(self, request, numero):
        b, profil, err = self._get_billet(request, numero)
        if err:
            return err
        if b.statut_billet == Billet.StatutBillet.ANNULE:
            return Response({'message': 'Billet annulé, non modifiable.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = BilletModificationSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        d = serializer.validated_data
        # Déplacement de siège
        if 'siege' in d:
            nouveau = d['siege']
            if nouveau.bus_id != b.trajet.bus_id:
                return Response({'message': "Ce siège n'appartient pas au bus du trajet."}, status=status.HTTP_400_BAD_REQUEST)
            dep = b.arret_depart.ordre  if b.arret_depart  else 0
            arr = b.arret_arrivee.ordre if b.arret_arrivee else 99999
            occupe = Billet.objects.filter(
                trajet=b.trajet, siege=nouveau,
                statut_billet__in=[Billet.StatutBillet.CONFIRME, Billet.StatutBillet.UTILISE],
                arret_depart__ordre__lt=arr, arret_arrivee__ordre__gt=dep,
            ).exclude(id=b.id).exists()
            if occupe:
                return Response({'message': f"Siège {nouveau.numero} déjà occupé."}, status=status.HTTP_400_BAD_REQUEST)
            b.siege = nouveau

        for attr in ('statut_paiement', 'mode_paiement'):
            if attr in d:
                setattr(b, attr, d[attr])
        b.save()
        return Response({'message': 'Billet modifié.', 'billet': BilletSerializer(b).data})


class CommandesEnLigneView(APIView):
    """Commandes passées via l'application mobile (source=APP) visible par la réceptionniste."""
    permission_classes = [IsAuthenticated]

    def _base_qs(self, compagnie):
        return (
            Billet.objects
            .filter(trajet__compagnie=compagnie, source=Billet.Source.APP,
                    statut_billet=Billet.StatutBillet.CONFIRME)
            .select_related(
                'trajet__ligne', 'trajet__bus', 'trajet__compagnie',
                'siege', 'arret_depart', 'arret_arrivee',
                'reservation__profil_client__utilisateur',
            )
            .order_by('emis_le')
        )

    def get(self, request):
        profil, compagnie = _receptionniste(request)
        if not compagnie:
            return _acces_refuse()

        qs = self._base_qs(compagnie)
        en_attente = qs.filter(statut_paiement=Billet.StatutPaiement.EN_ATTENTE)
        confirmes  = qs.filter(statut_paiement=Billet.StatutPaiement.PAYE)

        return Response({
            'en_attente': BilletSerializer(en_attente[:100], many=True).data,
            'confirmes':  BilletSerializer(confirmes[:100],  many=True).data,
            'total_en_attente': en_attente.count(),
            'total_confirmes':  confirmes.count(),
        })

    def patch(self, request, numero):
        """Confirmer le paiement d'une commande en ligne."""
        profil, compagnie = _receptionniste(request)
        if not compagnie:
            return _acces_refuse()
        try:
            b = Billet.objects.select_related(
                'trajet__ligne', 'trajet__bus', 'trajet__compagnie',
                'siege', 'arret_depart', 'arret_arrivee',
            ).get(numero_billet=numero, trajet__compagnie=compagnie, source=Billet.Source.APP)
        except Billet.DoesNotExist:
            return Response({'message': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if 'statut_paiement' in request.data:
            b.statut_paiement = request.data['statut_paiement']
            b.save()
        return Response({'message': 'Commande mise à jour.', 'billet': BilletSerializer(b).data})


class HistoriqueBilletsView(APIView):
    """
    Historique des billets pour les trajets passés (TERMINE/ANNULE).
    Chef : tous les billets de la compagnie.
    Réceptionniste : seulement ses ventes guichet.
    """
    permission_classes = [IsAuthenticated]

    def _get_profil_compagnie(self, request):
        profil = getattr(request.user, 'profil_employe', None)
        if profil and profil.compagnie and profil.role in [
            ProfilEmploye.Role.CHEF_COMPAGNIE,
            ProfilEmploye.Role.RECEPTIONNISTE,
        ]:
            return profil, profil.compagnie
        return None, None

    def get(self, request):
        profil, compagnie = self._get_profil_compagnie(request)
        if not compagnie:
            return Response({'message': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        jours  = int(request.query_params.get('jours', 90))
        depuis = timezone.now() - timedelta(days=jours)

        qs = (
            Billet.objects
            .filter(
                trajet__compagnie=compagnie,
                trajet__statut__in=['TERMINE', 'ANNULE'],
                emis_le__gte=depuis,
            )
            .select_related(
                'trajet__ligne', 'trajet__bus', 'trajet__compagnie',
                'siege', 'arret_depart', 'arret_arrivee',
            )
            .order_by('-emis_le')
        )

        # La réceptionniste voit uniquement ses ventes guichet
        if profil.role == ProfilEmploye.Role.RECEPTIONNISTE:
            qs = qs.filter(source=Billet.Source.GUICHET, vendu_par=profil)

        total_billets  = qs.count()
        total_recettes = qs.filter(statut_paiement='PAYE').aggregate(s=Sum('prix'))['s'] or 0

        return Response({
            'billets':        BilletSerializer(qs[:200], many=True).data,
            'total_billets':  total_billets,
            'total_recettes': total_recettes,
            'jours':          jours,
        })


class AnnulerBilletView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, numero):
        profil, compagnie = _receptionniste(request)
        if not compagnie:
            return _acces_refuse()
        try:
            b = Billet.objects.get(numero_billet=numero, trajet__compagnie=compagnie)
        except Billet.DoesNotExist:
            return Response({'message': 'Billet introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if b.statut_billet == Billet.StatutBillet.UTILISE:
            return Response({'message': 'Billet déjà utilisé.'}, status=status.HTTP_400_BAD_REQUEST)
        b.statut_billet = Billet.StatutBillet.ANNULE
        if b.statut_paiement == Billet.StatutPaiement.PAYE:
            b.statut_paiement = Billet.StatutPaiement.REMBOURSE
        b.save()
        return Response({'message': 'Billet annulé.'})



#  CONTRÔLEUR


class ControleurMonTrajetView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profil, compagnie = _controleur(request)
        if not compagnie:
            return _acces_refuse()

        aujourd_hui = timezone.now().date()
        trajet = (
            Trajet.objects
            .filter(compagnie=compagnie, controleur=profil,
                    depart_prevu__date=aujourd_hui,
                    statut__in=['PLANIFIE', 'EN_COURS'])
            .select_related('bus', 'ligne')
            .prefetch_related('ligne__arrets')
            .order_by('depart_prevu')
            .first()
        )

        if not trajet:
            return Response({'trajet': None, 'message': 'Aucun trajet assigné aujourd\'hui.'})

        nb_attendus = Billet.objects.filter(
            trajet=trajet,
            statut_billet__in=[Billet.StatutBillet.CONFIRME, Billet.StatutBillet.UTILISE],
        ).count()
        nb_valides  = Billet.objects.filter(trajet=trajet, statut_billet=Billet.StatutBillet.UTILISE).count()

        arrets = list(trajet.ligne.arrets.order_by('ordre'))
        arrets_data = [
            {
                'id':            a.id,
                'ville':         a.ville,
                'heure_arrivee': (trajet.depart_prevu + timedelta(minutes=a.temps_depuis_depart)).strftime('%H:%M'),
                'est_depart':    a.est_depart,
                'est_arrivee':   a.est_arrivee,
                'est_passee':    False,
            }
            for a in arrets
        ]

        en_attente_paiement = Billet.objects.filter(
            trajet=trajet,
            statut_billet=Billet.StatutBillet.CONFIRME,
            statut_paiement=Billet.StatutPaiement.EN_ATTENTE,
        ).count()
        incidents_ouverts = Incident.objects.filter(trajet=trajet, resolu=False).count()

        return Response({
            'trajet': {
                'id':            trajet.id,
                'ligne_display': str(trajet.ligne),
                'bus_display':   trajet.bus.immatriculation,
                'type_bus':      trajet.bus.type_bus,
                'depart_prevu':  trajet.depart_prevu.isoformat(),
                'arrivee_prevue': trajet.arrivee_prevue.isoformat() if trajet.arrivee_prevue else None,
                'statut':        trajet.statut,
                'statut_display': trajet.get_statut_display(),
            },
            'arrets': arrets_data,
            'compteurs': {
                'passagers_a_bord':    nb_attendus,
                'billets_valides':     nb_valides,
                'en_attente_paiement': en_attente_paiement,
                'incidents':           incidents_ouverts,
            },
        })


class ControleurValiderBilletView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profil, compagnie = _controleur(request)
        if not compagnie:
            return _acces_refuse()

        numero = request.data.get('numero_billet', '').strip()
        if not numero:
            return Response({'valide': False, 'message': 'Numéro de billet requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            billet = Billet.objects.select_related(
                'trajet__ligne', 'trajet__bus', 'trajet__compagnie',
                'siege', 'arret_depart', 'arret_arrivee',
            ).get(numero_billet=numero)
        except Billet.DoesNotExist:
            return Response({'valide': False, 'raison': 'INEXISTANT', 'message': 'Code QR inconnu — accès refusé.'})

        if billet.trajet.compagnie != compagnie:
            return Response({'valide': False, 'raison': 'AUTRE_COMPAGNIE', 'message': "Ce billet n'appartient pas à votre compagnie."})
        if billet.statut_billet == Billet.StatutBillet.ANNULE:
            return Response({'valide': False, 'raison': 'ANNULE', 'message': 'Billet annulé — accès refusé.'})
        if billet.statut_billet == Billet.StatutBillet.UTILISE:
            return Response({
                'valide':       False,
                'raison':       'DEJA_SCANNE',
                'message':      'ATTENTION — Ce billet a déjà été scanné !',
                'scanne_le':    billet.scanne_le.isoformat() if billet.scanne_le else None,
                'numero_billet': billet.numero_billet,
                'passager_nom':  billet.passager_nom,
                'passager_prenom': billet.passager_prenom,
                'siege':         int(billet.siege.numero) if billet.siege else None,
            })

        billet.statut_billet = Billet.StatutBillet.UTILISE
        billet.scanne_par    = profil
        billet.scanne_le     = timezone.now()
        billet.save()

        return Response({
            'valide':                   True,
            'message':                  'Embarquement validé.',
            'numero_billet':            billet.numero_billet,
            'passager_nom':             billet.passager_nom,
            'passager_prenom':          billet.passager_prenom,
            'passager_telephone':       billet.passager_telephone,
            'passager_piece_identite':  billet.passager_piece_identite,
            'siege':                    int(billet.siege.numero) if billet.siege else None,
            'nom_compagnie':            billet.trajet.compagnie.nom if billet.trajet.compagnie else '',
            'bus_display':              billet.trajet.bus.immatriculation,
            'ligne_display':            str(billet.trajet.ligne),
            'depart_ville':             billet.arret_depart.ville  if billet.arret_depart  else '—',
            'arrivee_ville':            billet.arret_arrivee.ville if billet.arret_arrivee else '—',
            'heure_depart':             billet.trajet.depart_prevu.strftime('%H:%M'),
            'prix':                     billet.prix,
            'devise':                   billet.devise,
        })


class ControleurListeEmbarquementView(APIView):
    """Liste temps-réel des passagers du trajet avec statut d'embarquement."""
    permission_classes = [IsAuthenticated]

    def get(self, request, trajet_id):
        profil, compagnie = _controleur(request)
        if not compagnie:
            return _acces_refuse()

        trajet, err = _get_trajet(trajet_id, compagnie)
        if err:
            return err

        billets = (
            Billet.objects
            .filter(
                trajet=trajet,
                statut_billet__in=[Billet.StatutBillet.CONFIRME, Billet.StatutBillet.UTILISE],
            )
            .select_related('siege', 'arret_depart', 'arret_arrivee')
            .order_by(Cast('siege__numero', DjIntegerField()))
        )

        data = [{
            'id':                  b.id,
            'numero_billet':       b.numero_billet,
            'passager':            b.nom_passager(),
            'passager_telephone':  b.passager_telephone,
            'siege_numero':        int(b.siege.numero) if b.siege else None,
            'statut_billet':       b.statut_billet,
            'embarque':            b.statut_billet == Billet.StatutBillet.UTILISE,
            'arret_depart_ville':  b.arret_depart.ville  if b.arret_depart  else '—',
            'arret_arrivee_ville': b.arret_arrivee.ville if b.arret_arrivee else '—',
            'scanne_le':           b.scanne_le.isoformat() if b.scanne_le else None,
            'source':              b.source,
        } for b in billets]

        nb_embarques = sum(1 for b in data if b['embarque'])
        return Response({
            'passagers':  data,
            'total':      len(data),
            'embarques':  nb_embarques,
            'en_attente': len(data) - nb_embarques,
        })


class ControleurEscalePasseeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, trajet_id):
        profil, compagnie = _controleur(request)
        if not compagnie:
            return _acces_refuse()

        trajet, err = _get_trajet(trajet_id, compagnie)
        if err:
            return err
        if trajet.controleur != profil:
            return _acces_refuse("Vous n'êtes pas le contrôleur de ce trajet.")

        arret_id = request.data.get('arret_id')
        if not arret_id:
            return Response({'message': 'arret_id requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ArretLigne.objects.get(id=arret_id, ligne=trajet.ligne)
        except ArretLigne.DoesNotExist:
            return Response({'message': 'Arrêt introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        # Passer le trajet EN_COURS si encore PLANIFIE
        if trajet.statut == Trajet.Statut.PLANIFIE:
            trajet.statut = Trajet.Statut.EN_COURS
            trajet.save()

        return Response({'message': 'Escale enregistrée.', 'statut_trajet': trajet.statut})


class ControleurIncidentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, trajet_id):
        profil, compagnie = _controleur(request)
        if not compagnie:
            return _acces_refuse()
        trajet, err = _get_trajet(trajet_id, compagnie)
        if err:
            return err
        incidents = Incident.objects.filter(trajet=trajet).select_related('signale_par__utilisateur', 'arret_concerne')
        return Response(IncidentSerializer(incidents, many=True).data)

    def post(self, request, trajet_id):
        profil, compagnie = _controleur(request)
        if not compagnie:
            return _acces_refuse()
        trajet, err = _get_trajet(trajet_id, compagnie)
        if err:
            return err

        serializer = IncidentCreationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        d = serializer.validated_data
        incident = Incident.objects.create(
            trajet=trajet,
            signale_par=profil,
            type_incident=d['type_incident'],
            description=d['description'],
            arret_concerne=d.get('arret_concerne'),
        )
        return Response(IncidentSerializer(incident).data, status=status.HTTP_201_CREATED)


class ControleurIncidentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, incident_id):
        profil, compagnie = _controleur(request)
        if not compagnie:
            return _acces_refuse()
        try:
            incident = Incident.objects.get(id=incident_id, trajet__compagnie=compagnie)
        except Incident.DoesNotExist:
            return Response({'message': 'Incident introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = IncidentResolutionSerializer(data=request.data)
        if serializer.is_valid():
            incident.resolution      = serializer.validated_data['resolution']
            incident.resolu          = True
            incident.date_resolution = timezone.now()
            incident.save()
            return Response({'message': 'Incident résolu.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ControleurRapportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, trajet_id):
        profil, compagnie = _controleur(request)
        if not compagnie:
            return _acces_refuse()

        trajet, err = _get_trajet(trajet_id, compagnie)
        if err:
            return err
        if trajet.controleur != profil:
            return _acces_refuse("Vous n'êtes pas le contrôleur de ce trajet.")
        if hasattr(trajet, 'rapport'):
            return Response({'message': 'Rapport déjà soumis.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = RapportCreationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        d = serializer.validated_data
        nb_attendus = Billet.objects.filter(
            trajet=trajet,
            statut_billet__in=[Billet.StatutBillet.CONFIRME, Billet.StatutBillet.UTILISE],
        ).count()

        rapport = RapportTrajet.objects.create(
            trajet=trajet, soumis_par=profil,
            nb_passagers_attendus=nb_attendus,
            nb_passagers_reels=d['nb_passagers_reels'],
            nb_billets_bord=d['nb_billets_bord'],
            nb_absents=nb_attendus - d['nb_passagers_reels'],
            heure_depart_reelle=d.get('heure_depart_reelle'),
            heure_arrivee_reelle=d.get('heure_arrivee_reelle'),
            notes=d.get('notes', ''),
        )
        trajet.statut = Trajet.Statut.TERMINE
        trajet.save()

        return Response({'message': 'Rapport soumis. Trajet marqué TERMINÉ.', 'id': rapport.id},
                        status=status.HTTP_201_CREATED)

