from rest_framework import serializers

from apps.transport.models import ArretLigne, Siege, Trajet
from .models import Billet, Incident, RapportTrajet


# ── Billet ────────────────────────────────────────────────────────────────────

class BilletSerializer(serializers.ModelSerializer):
    arret_depart_ville  = serializers.CharField(source='arret_depart.ville',  read_only=True)
    arret_arrivee_ville = serializers.CharField(source='arret_arrivee.ville', read_only=True)
    siege_numero        = serializers.CharField(source='siege.numero',         read_only=True)
    ligne_display       = serializers.CharField(source='trajet.ligne.__str__', read_only=True)
    bus_display         = serializers.CharField(source='trajet.bus.immatriculation', read_only=True)
    depart_prevu        = serializers.DateTimeField(source='trajet.depart_prevu', read_only=True)
    nom_compagnie       = serializers.CharField(source='trajet.compagnie.nom', read_only=True)
    passager            = serializers.SerializerMethodField()
    statut_billet_display   = serializers.CharField(source='get_statut_billet_display',   read_only=True)
    statut_paiement_display = serializers.CharField(source='get_statut_paiement_display', read_only=True)
    mode_paiement_display   = serializers.CharField(source='get_mode_paiement_display',   read_only=True)
    source_display          = serializers.CharField(source='get_source_display',          read_only=True)

    class Meta:
        model  = Billet
        fields = [
            'id', 'numero_billet',
            'trajet', 'ligne_display', 'bus_display', 'depart_prevu',
            'nom_compagnie',
            'siege', 'siege_numero',
            'arret_depart', 'arret_depart_ville',
            'arret_arrivee', 'arret_arrivee_ville',
            'passager',
            'passager_nom', 'passager_prenom', 'passager_telephone', 'passager_piece_identite',
            'source', 'source_display',
            'statut_billet', 'statut_billet_display',
            'statut_paiement', 'statut_paiement_display',
            'mode_paiement', 'mode_paiement_display',
            'prix', 'devise',
            'emis_le',
        ]

    def get_passager(self, obj):
        return obj.nom_passager()


class VenteBilletSerializer(serializers.Serializer):
    trajet        = serializers.PrimaryKeyRelatedField(queryset=Trajet.objects.all())
    siege         = serializers.PrimaryKeyRelatedField(queryset=Siege.objects.all())
    arret_depart  = serializers.PrimaryKeyRelatedField(queryset=ArretLigne.objects.all())
    arret_arrivee = serializers.PrimaryKeyRelatedField(queryset=ArretLigne.objects.all())

    passager_nom              = serializers.CharField(max_length=100)
    passager_prenom           = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    passager_telephone        = serializers.CharField(max_length=30,  required=False, allow_blank=True, default='')
    passager_piece_identite   = serializers.CharField(max_length=50,  required=False, allow_blank=True, default='')

    mode_paiement   = serializers.ChoiceField(choices=Billet.ModePaiement.choices,   default=Billet.ModePaiement.ESPECES)
    statut_paiement = serializers.ChoiceField(choices=Billet.StatutPaiement.choices, default=Billet.StatutPaiement.EN_ATTENTE)

    def validate(self, data):
        trajet = data['trajet']
        siege  = data['siege']
        dep    = data['arret_depart']
        arr    = data['arret_arrivee']

        if siege.bus_id != trajet.bus_id:
            raise serializers.ValidationError("Ce siège n'appartient pas au bus de ce trajet.")
        if dep.ligne_id != trajet.ligne_id:
            raise serializers.ValidationError("L'arrêt de départ n'appartient pas à la ligne de ce trajet.")
        if arr.ligne_id != trajet.ligne_id:
            raise serializers.ValidationError("L'arrêt d'arrivée n'appartient pas à la ligne de ce trajet.")
        if arr.ordre <= dep.ordre:
            raise serializers.ValidationError("L'arrêt d'arrivée doit être après l'arrêt de départ.")
        if trajet.statut == 'TERMINE':
            raise serializers.ValidationError("Ce trajet est déjà terminé.")
        if trajet.statut == 'ANNULE':
            raise serializers.ValidationError("Ce trajet est annulé.")

        from django.utils import timezone as tz
        if trajet.depart_prevu and trajet.depart_prevu <= tz.now():
            raise serializers.ValidationError("L'heure de départ de ce trajet est dépassée. Réservation impossible.")

        # Siège déjà occupé pour ce segment ?
        occupe = Billet.objects.filter(
            trajet=trajet,
            siege=siege,
            statut_billet__in=[Billet.StatutBillet.CONFIRME, Billet.StatutBillet.UTILISE],
            arret_depart__ordre__lt=arr.ordre,
            arret_arrivee__ordre__gt=dep.ordre,
        ).exists()
        if occupe:
            raise serializers.ValidationError(f"Le siège {siege.numero} est déjà occupé pour ce segment.")
        return data


class BilletModificationSerializer(serializers.Serializer):
    statut_paiement = serializers.ChoiceField(choices=Billet.StatutPaiement.choices, required=False)
    mode_paiement   = serializers.ChoiceField(choices=Billet.ModePaiement.choices,   required=False)
    siege           = serializers.PrimaryKeyRelatedField(queryset=Siege.objects.all(), required=False)


# ── Incident ──────────────────────────────────────────────────────────────────

class IncidentSerializer(serializers.ModelSerializer):
    type_incident_display  = serializers.CharField(source='get_type_incident_display', read_only=True)
    signale_par_nom        = serializers.SerializerMethodField()
    arret_concerne_ville   = serializers.CharField(source='arret_concerne.ville', read_only=True)

    class Meta:
        model  = Incident
        fields = [
            'id', 'type_incident', 'type_incident_display',
            'description', 'resolution', 'resolu',
            'signale_par', 'signale_par_nom',
            'arret_concerne', 'arret_concerne_ville',
            'date_incident', 'date_resolution',
        ]

    def get_signale_par_nom(self, obj):
        u = obj.signale_par.utilisateur
        return f"{u.first_name} {u.last_name}".strip() or u.username


class IncidentCreationSerializer(serializers.Serializer):
    type_incident  = serializers.ChoiceField(choices=Incident.TypeIncident.choices)
    description    = serializers.CharField()
    arret_concerne = serializers.PrimaryKeyRelatedField(queryset=ArretLigne.objects.all(), required=False, allow_null=True)


class IncidentResolutionSerializer(serializers.Serializer):
    resolution = serializers.CharField()


# ── Rapport ───────────────────────────────────────────────────────────────────

class RapportTrajetSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RapportTrajet
        fields = '__all__'


class RapportCreationSerializer(serializers.Serializer):
    nb_passagers_reels   = serializers.IntegerField(min_value=0, default=0)
    nb_billets_bord      = serializers.IntegerField(min_value=0, default=0)
    heure_depart_reelle  = serializers.DateTimeField(required=False, allow_null=True)
    heure_arrivee_reelle = serializers.DateTimeField(required=False, allow_null=True)
    notes                = serializers.CharField(required=False, allow_blank=True, default='')
