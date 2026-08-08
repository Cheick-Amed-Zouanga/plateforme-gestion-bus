from rest_framework import serializers
from .models import Bus, Ligne, ArretLigne, Trajet, Tarif  # noqa: F401 (ArretLigne used in PrimaryKeyRelatedField)


# ─── Bus ─────────────────────────────────────────────────────────────────────

class BusSerializer(serializers.ModelSerializer):
    type_bus_display = serializers.CharField(source='get_type_bus_display', read_only=True)

    class Meta:
        model  = Bus
        fields = ['id', 'immatriculation', 'type_bus', 'type_bus_display', 'capacite', 'actif']


class CreationBusSerializer(serializers.Serializer):
    immatriculation = serializers.CharField(max_length=50)
    type_bus        = serializers.ChoiceField(choices=Bus.TypeBus.choices, default=Bus.TypeBus.STANDARD)
    capacite        = serializers.IntegerField(min_value=1, max_value=200)

    def validate_immatriculation(self, value):
        if Bus.objects.filter(immatriculation=value).exists():
            raise serializers.ValidationError("Ce numéro d'immatriculation existe déjà.")
        return value


class ModificationBusSerializer(serializers.Serializer):
    immatriculation = serializers.CharField(max_length=50, required=False)
    type_bus        = serializers.ChoiceField(choices=Bus.TypeBus.choices, required=False)
    capacite        = serializers.IntegerField(min_value=1, max_value=200, required=False)

    def validate_immatriculation(self, value):
        bus = self.context.get('bus')
        qs = Bus.objects.filter(immatriculation=value)
        if bus:
            qs = qs.exclude(pk=bus.pk)
        if qs.exists():
            raise serializers.ValidationError("Ce numéro d'immatriculation existe déjà.")
        return value


# ─── Ligne & ArretLigne ───────────────────────────────────────────────────────

class ArretLigneSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ArretLigne
        fields = [
            'id', 'ordre', 'ville', 'latitude', 'longitude',
            'distance_depuis_precedent', 'duree_route_depuis_precedent',
            'duree_montee_passagers', 'duree_descente_passagers', 'duree_pause',
            'duree_arret_total', 'temps_depuis_depart',
            'est_depart', 'est_arrivee',
        ]


class LigneListSerializer(serializers.ModelSerializer):
    nb_arrets = serializers.SerializerMethodField()
    depart    = serializers.SerializerMethodField()
    arrivee   = serializers.SerializerMethodField()

    class Meta:
        model  = Ligne
        fields = ['id', 'nom', 'code', 'active', 'date_creation', 'nb_arrets', 'depart', 'arrivee']

    def get_nb_arrets(self, obj):
        return obj.arrets.filter(est_depart=False, est_arrivee=False).count()

    def get_depart(self, obj):
        arret = obj.arrets.filter(est_depart=True).first() or obj.arrets.order_by('ordre').first()
        return arret.ville if arret else None

    def get_arrivee(self, obj):
        arret = obj.arrets.filter(est_arrivee=True).first() or obj.arrets.order_by('-ordre').first()
        return arret.ville if arret else None


class LigneDetailSerializer(serializers.ModelSerializer):
    arrets = ArretLigneSerializer(many=True, read_only=True)

    class Meta:
        model  = Ligne
        fields = ['id', 'nom', 'code', 'description', 'active', 'date_creation', 'arrets']


class ArretIntermediaireSerializer(serializers.Serializer):
    """Un arrêt intermédiaire lors de la création complète d'une ligne."""
    ville                    = serializers.CharField(max_length=100)
    duree_montee_passagers   = serializers.IntegerField(min_value=0, default=0)
    duree_descente_passagers = serializers.IntegerField(min_value=0, default=0)
    duree_pause              = serializers.IntegerField(min_value=0, default=0)


class CreationLigneCompleteSerializer(serializers.Serializer):
    """
    Crée une ligne en une seule requête :
    nom + description + ville_depart + ville_arrivee + arrêts intermédiaires optionnels.
    """
    nom           = serializers.CharField(max_length=100)
    description   = serializers.CharField(required=False, allow_blank=True, default='')
    ville_depart  = serializers.CharField(max_length=100)
    ville_arrivee = serializers.CharField(max_length=100)
    arrets        = ArretIntermediaireSerializer(many=True, required=False, default=[])

    def validate(self, data):
        if data['ville_depart'] == data['ville_arrivee']:
            raise serializers.ValidationError("La ville de départ et d'arrivée doivent être différentes.")
        return data


class ModificationLigneSerializer(serializers.Serializer):
    nom         = serializers.CharField(max_length=100, required=False)
    description = serializers.CharField(required=False, allow_blank=True)


class AjoutArretSerializer(serializers.Serializer):
    ville                    = serializers.CharField(max_length=100)
    duree_montee_passagers   = serializers.IntegerField(min_value=0, default=0)
    duree_descente_passagers = serializers.IntegerField(min_value=0, default=0)
    duree_pause              = serializers.IntegerField(min_value=0, default=0)


class ModificationArretSerializer(serializers.Serializer):
    duree_montee_passagers       = serializers.IntegerField(min_value=0, required=False)
    duree_descente_passagers     = serializers.IntegerField(min_value=0, required=False)
    duree_pause                  = serializers.IntegerField(min_value=0, required=False)
    duree_route_depuis_precedent = serializers.IntegerField(min_value=0, required=False)


# ─── Trajet ───────────────────────────────────────────────────────────────────

class TrajetSerializer(serializers.ModelSerializer):
    ligne_display      = serializers.CharField(source='ligne.__str__',       read_only=True)
    bus_display        = serializers.CharField(source='bus.immatriculation',  read_only=True)
    type_bus           = serializers.CharField(source='bus.type_bus',         read_only=True)
    statut_display     = serializers.CharField(source='get_statut_display',   read_only=True)
    controleur_display = serializers.SerializerMethodField()

    class Meta:
        model  = Trajet
        fields = [
            'id', 'ligne', 'ligne_display', 'bus', 'bus_display', 'type_bus',
            'controleur', 'controleur_display',
            'depart_prevu', 'arrivee_prevue', 'statut', 'statut_display',
        ]

    def get_controleur_display(self, obj):
        if not obj.controleur:
            return None
        u = obj.controleur.utilisateur
        return f"{u.first_name} {u.last_name}".strip() or u.username


from apps.accounts.models import ProfilEmploye as _PE  # noqa: E402


class CreationTrajetSerializer(serializers.Serializer):
    ligne          = serializers.PrimaryKeyRelatedField(queryset=Ligne.objects.all())
    bus            = serializers.PrimaryKeyRelatedField(queryset=Bus.objects.all())
    controleur     = serializers.PrimaryKeyRelatedField(
        queryset=_PE.objects.filter(role=_PE.Role.CONTROLEUR, actif=True),
        required=False, allow_null=True,
    )
    depart_prevu   = serializers.DateTimeField()
    arrivee_prevue = serializers.DateTimeField(required=False, allow_null=True)

    def validate(self, data):
        if data.get('arrivee_prevue') and data['arrivee_prevue'] <= data['depart_prevu']:
            raise serializers.ValidationError("L'heure d'arrivée doit être après l'heure de départ.")
        return data


class ModificationTrajetSerializer(serializers.Serializer):
    statut         = serializers.ChoiceField(choices=Trajet.Statut.choices, required=False)
    depart_prevu   = serializers.DateTimeField(required=False)
    arrivee_prevue = serializers.DateTimeField(required=False, allow_null=True)
    bus            = serializers.PrimaryKeyRelatedField(queryset=Bus.objects.all(), required=False)
    controleur     = serializers.PrimaryKeyRelatedField(
        queryset=_PE.objects.filter(role=_PE.Role.CONTROLEUR, actif=True),
        required=False, allow_null=True,
    )

    def validate(self, data):
        dep = data.get('depart_prevu')
        arr = data.get('arrivee_prevue')
        if dep and arr and arr <= dep:
            raise serializers.ValidationError("L'heure d'arrivée doit être après l'heure de départ.")
        return data


# ─── Tarif ───────────────────────────────────────────────────────────────────

class TarifSerializer(serializers.ModelSerializer):
    ligne_display        = serializers.CharField(source='ligne.__str__',       read_only=True)
    type_bus_display     = serializers.CharField(source='get_type_bus_display', read_only=True)
    arret_depart_ville   = serializers.CharField(source='arret_depart.ville',  read_only=True)
    arret_arrivee_ville  = serializers.CharField(source='arret_arrivee.ville', read_only=True)

    class Meta:
        model  = Tarif
        fields = [
            'id', 'ligne', 'ligne_display',
            'arret_depart', 'arret_depart_ville',
            'arret_arrivee', 'arret_arrivee_ville',
            'type_bus', 'type_bus_display', 'prix', 'devise',
        ]


class CreationTarifSerializer(serializers.Serializer):
    ligne         = serializers.PrimaryKeyRelatedField(queryset=Ligne.objects.all())
    arret_depart  = serializers.PrimaryKeyRelatedField(queryset=ArretLigne.objects.all())
    arret_arrivee = serializers.PrimaryKeyRelatedField(queryset=ArretLigne.objects.all())
    type_bus      = serializers.ChoiceField(choices=Bus.TypeBus.choices)
    prix          = serializers.IntegerField(min_value=0)
    devise        = serializers.CharField(max_length=10, default='XOF')

    def validate(self, data):
        ligne         = data['ligne']
        arret_dep     = data['arret_depart']
        arret_arr     = data['arret_arrivee']
        compagnie     = self.context.get('compagnie')

        if arret_dep.ligne_id != ligne.id:
            raise serializers.ValidationError("L'arrêt de départ n'appartient pas à cette ligne.")
        if arret_arr.ligne_id != ligne.id:
            raise serializers.ValidationError("L'arrêt d'arrivée n'appartient pas à cette ligne.")
        if arret_arr.ordre <= arret_dep.ordre:
            raise serializers.ValidationError(
                "L'arrêt d'arrivée doit être après l'arrêt de départ sur la ligne."
            )
        if compagnie and Tarif.objects.filter(
            compagnie=compagnie, ligne=ligne,
            arret_depart=arret_dep, arret_arrivee=arret_arr,
            type_bus=data['type_bus'],
        ).exists():
            raise serializers.ValidationError(
                "Un tarif existe déjà pour ce segment et ce type de bus."
            )
        return data


class ModificationTarifSerializer(serializers.Serializer):
    prix   = serializers.IntegerField(min_value=0, required=False)
    devise = serializers.CharField(max_length=10, required=False)
