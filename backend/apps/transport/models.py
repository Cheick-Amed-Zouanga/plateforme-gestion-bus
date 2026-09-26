from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from apps.iam.models import Company


# ⚠️ DEPRECATED: CompagnieTransport - Utiliser Company (iam.models) à la place
# Conservé pour la migration de données
class CompagnieTransport(models.Model):
    nom         = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name        = 'Compagnie de transport'
        verbose_name_plural = 'Compagnies de transport'

    def __str__(self):
        return self.nom


class Bus(models.Model):
    class TypeBus(models.TextChoices):
        STANDARD = 'STANDARD', 'Standard'
        VIP      = 'VIP',      'VIP'

    company         = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='bus', null=True, blank=True)
    immatriculation = models.CharField(max_length=50, unique=True)
    type_bus        = models.CharField(max_length=20, choices=TypeBus.choices, default=TypeBus.STANDARD)
    capacite        = models.PositiveIntegerField(default=0)
    actif           = models.BooleanField(default=True)

    class Meta:
        verbose_name        = 'Bus'
        verbose_name_plural = 'Bus'

    def __str__(self):
        return self.immatriculation


class Siege(models.Model):
    bus    = models.ForeignKey('transport.Bus', on_delete=models.CASCADE, related_name='sieges')
    numero = models.CharField(max_length=10)

    class Meta:
        verbose_name        = 'Siège'
        verbose_name_plural = 'Sièges'
        constraints = [
            models.UniqueConstraint(fields=['bus', 'numero'], name='uniq_siege_par_bus'),
        ]

    def __str__(self):
        return f"{self.bus_id}-{self.numero}"


class Ligne(models.Model):
    company       = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='lignes', null=True, blank=True)
    nom           = models.CharField(max_length=100)
    code          = models.CharField(max_length=20, unique=True)
    description   = models.TextField(blank=True)
    active        = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Ligne'
        verbose_name_plural = 'Lignes'

    def __str__(self):
        return f"{self.code} — {self.nom}"

    def recalculer_temps(self):
        """Recalcule duree_arret_total et temps_depuis_depart pour tous les arrêts."""
        arrets = list(self.arrets.order_by('ordre'))
        for i, arret in enumerate(arrets):
            arret.duree_arret_total = (
                arret.duree_montee_passagers
                + arret.duree_descente_passagers
                + arret.duree_pause
            )
            if i == 0:
                arret.temps_depuis_depart = 0
            else:
                prev = arrets[i - 1]
                arret.temps_depuis_depart = (
                    prev.temps_depuis_depart
                    + arret.duree_route_depuis_precedent
                    + prev.duree_arret_total
                )
        if arrets:
            ArretLigne.objects.bulk_update(arrets, ['duree_arret_total', 'temps_depuis_depart'])


class ArretLigne(models.Model):
    ligne                        = models.ForeignKey(Ligne, on_delete=models.CASCADE, related_name='arrets')
    ordre                        = models.IntegerField()
    ville                        = models.CharField(max_length=100)
    latitude                     = models.FloatField()
    longitude                    = models.FloatField()
    distance_depuis_precedent    = models.FloatField(default=0)
    duree_route_depuis_precedent = models.IntegerField(default=0)
    duree_montee_passagers       = models.IntegerField(default=0)
    duree_descente_passagers     = models.IntegerField(default=0)
    duree_pause                  = models.IntegerField(default=0)
    duree_arret_total            = models.IntegerField(default=0)
    temps_depuis_depart          = models.IntegerField(default=0)
    est_depart                   = models.BooleanField(default=False)
    est_arrivee                  = models.BooleanField(default=False)

    class Meta:
        verbose_name        = 'Arrêt de ligne'
        verbose_name_plural = 'Arrêts de ligne'
        ordering            = ['ordre']
        constraints = [
            models.UniqueConstraint(fields=['ligne', 'ordre'], name='uniq_arret_ordre_ligne'),
        ]

    def __str__(self):
        return f"{self.ligne.code} — arrêt {self.ordre} ({self.ville})"


@receiver([post_save, post_delete], sender=ArretLigne)
def recalculer_apres_changement_arret(sender, instance, **kwargs):
    """Recalcule les temps dès qu'un arrêt est ajouté, modifié ou supprimé."""
    instance.ligne.recalculer_temps()


class HoraireLigne(models.Model):
    """Horaire récurrent sur une ligne (génère des Trajet concrets)."""
    JOURS_LABELS = (
        (0, 'Lundi'),
        (1, 'Mardi'),
        (2, 'Mercredi'),
        (3, 'Jeudi'),
        (4, 'Vendredi'),
        (5, 'Samedi'),
        (6, 'Dimanche'),
    )

    company           = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='horaires', null=True, blank=True)
    ligne             = models.ForeignKey('transport.Ligne', on_delete=models.CASCADE, related_name='horaires')
    heure_depart      = models.TimeField()
    # Jours ISO Python : 0=Lundi … 6=Dimanche, stockés en CSV ("0,1,2,3,4")
    jours             = models.CharField(max_length=20, default='0,1,2,3,4,5,6')
    type_bus          = models.CharField(max_length=20, choices=Bus.TypeBus.choices, default=Bus.TypeBus.STANDARD)
    bus_defaut        = models.ForeignKey(
        'transport.Bus', on_delete=models.SET_NULL, related_name='horaires_defaut',
        null=True, blank=True,
    )
    duree_estimee_min = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Durée estimée en minutes pour calculer arrivee_prevue.',
    )
    actif             = models.BooleanField(default=True)
    date_debut        = models.DateField(null=True, blank=True)
    date_fin          = models.DateField(null=True, blank=True)
    date_creation     = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Horaire de ligne'
        verbose_name_plural = 'Horaires de ligne'
        ordering            = ['ligne', 'heure_depart']

    def __str__(self):
        return f"{self.ligne} @ {self.heure_depart.strftime('%H:%M')} ({self.jours})"

    def jours_list(self):
        if not self.jours:
            return []
        return [int(x) for x in self.jours.split(',') if x.strip().isdigit()]

    def set_jours_list(self, jours):
        cleaned = sorted({int(j) for j in jours if 0 <= int(j) <= 6})
        self.jours = ','.join(str(j) for j in cleaned)


class Trajet(models.Model):
    class Statut(models.TextChoices):
        PLANIFIE = 'PLANIFIE', 'Planifié'
        EN_COURS = 'EN_COURS', 'En cours'
        TERMINE  = 'TERMINE',  'Terminé'
        ANNULE   = 'ANNULE',   'Annulé'

    company        = models.ForeignKey(Company,                         on_delete=models.PROTECT,  related_name='trajets', null=True, blank=True)
    ligne          = models.ForeignKey('transport.Ligne',              on_delete=models.PROTECT,  related_name='trajets')
    bus            = models.ForeignKey('transport.Bus',                on_delete=models.PROTECT,  related_name='trajets')
    controleur     = models.ForeignKey('accounts.ProfilEmploye',       on_delete=models.SET_NULL, related_name='trajets_assignes', null=True, blank=True)
    horaire        = models.ForeignKey(
        'transport.HoraireLigne', on_delete=models.SET_NULL,
        related_name='trajets', null=True, blank=True,
    )
    depart_prevu   = models.DateTimeField()
    arrivee_prevue = models.DateTimeField(null=True, blank=True)
    statut         = models.CharField(max_length=15, choices=Statut.choices, default=Statut.PLANIFIE)

    class Meta:
        verbose_name        = 'Trajet'
        verbose_name_plural = 'Trajets'
        constraints = [
            models.UniqueConstraint(
                fields=['ligne', 'depart_prevu'],
                name='uniq_trajet_ligne_depart',
            ),
        ]

    def __str__(self):
        return f"Trajet {self.id} ({self.ligne})"


class Tarif(models.Model):
    company       = models.ForeignKey(Company,                         on_delete=models.CASCADE, related_name='tarifs', null=True, blank=True)
    ligne         = models.ForeignKey('transport.Ligne',              on_delete=models.CASCADE, related_name='tarifs')
    arret_depart  = models.ForeignKey('transport.ArretLigne',         on_delete=models.CASCADE, related_name='tarifs_depart')
    arret_arrivee = models.ForeignKey('transport.ArretLigne',         on_delete=models.CASCADE, related_name='tarifs_arrivee')
    type_bus      = models.CharField(max_length=20, choices=Bus.TypeBus.choices, default=Bus.TypeBus.STANDARD)
    prix          = models.PositiveIntegerField(help_text='Montant en XOF.')
    devise        = models.CharField(max_length=10, default='XOF')

    class Meta:
        verbose_name        = 'Tarif'
        verbose_name_plural = 'Tarifs'
        constraints = [
            models.UniqueConstraint(
                fields=['ligne', 'arret_depart', 'arret_arrivee', 'type_bus'],
                name='uniq_tarif_segment',
            ),
        ]

    def __str__(self):
        return f"{self.arret_depart.ville} → {self.arret_arrivee.ville} — {self.prix} {self.devise}"
