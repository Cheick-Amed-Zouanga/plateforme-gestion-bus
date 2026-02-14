from django.db import models

# Create your models here.


class CompagnieTransport(models.Model):
    nom = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Compagnie de transport'
        verbose_name_plural = 'Compagnies de transport'

    def __str__(self) -> str:
        return self.nom


class Bus(models.Model):
    class TypeBus(models.TextChoices):
        STANDARD = 'STANDARD', 'Standard'
        VIP = 'VIP', 'VIP'

    compagnie = models.ForeignKey(
        'transport.CompagnieTransport',
        on_delete=models.CASCADE,
        related_name='bus',
    )
    immatriculation = models.CharField(max_length=50, unique=True)
    type_bus = models.CharField(max_length=20, choices=TypeBus.choices, default=TypeBus.STANDARD)
    capacite = models.PositiveIntegerField(default=0)
    actif = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Bus'
        verbose_name_plural = 'Bus'

    def __str__(self) -> str:
        return f"{self.immatriculation}"


class Siege(models.Model):
    bus = models.ForeignKey('transport.Bus', on_delete=models.CASCADE, related_name='sieges')
    numero = models.CharField(max_length=10)

    class Meta:
        verbose_name = 'Siège'
        verbose_name_plural = 'Sièges'
        constraints = [
            models.UniqueConstraint(fields=['bus', 'numero'], name='uniq_siege_par_bus'),
        ]

    def __str__(self) -> str:
        return f"{self.bus_id}-{self.numero}"


class Arret(models.Model):
    nom = models.CharField(max_length=150)
    ville = models.CharField(max_length=150, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        verbose_name = 'Arrêt'
        verbose_name_plural = 'Arrêts'
        constraints = [
            models.UniqueConstraint(fields=['nom', 'ville'], name='uniq_arret_nom_ville'),
        ]

    def __str__(self) -> str:
        return f"{self.nom} - {self.ville}" if self.ville else self.nom


class Ligne(models.Model):
    origine = models.ForeignKey('transport.Arret', on_delete=models.PROTECT, related_name='lignes_depart')
    destination = models.ForeignKey('transport.Arret', on_delete=models.PROTECT, related_name='lignes_arrivee')

    class Meta:
        verbose_name = 'Ligne'
        verbose_name_plural = 'Lignes'
        constraints = [
            models.UniqueConstraint(fields=['origine', 'destination'], name='uniq_ligne_od'),
        ]

    def __str__(self) -> str:
        return f"{self.origine} -> {self.destination}"


class Trajet(models.Model):
    class Statut(models.TextChoices):
        PLANIFIE = 'PLANIFIE', 'Planifié'
        EN_COURS = 'EN_COURS', 'En cours'
        TERMINE = 'TERMINE', 'Terminé'
        ANNULE = 'ANNULE', 'Annulé'

    compagnie = models.ForeignKey('transport.CompagnieTransport', on_delete=models.PROTECT, related_name='trajets')
    ligne = models.ForeignKey('transport.Ligne', on_delete=models.PROTECT, related_name='trajets')
    bus = models.ForeignKey('transport.Bus', on_delete=models.PROTECT, related_name='trajets')
    depart_prevu = models.DateTimeField()
    arrivee_prevue = models.DateTimeField(null=True, blank=True)
    statut = models.CharField(max_length=15, choices=Statut.choices, default=Statut.PLANIFIE)

    class Meta:
        verbose_name = 'Trajet'
        verbose_name_plural = 'Trajets'

    def __str__(self) -> str:
        return f"Trajet {self.id} ({self.ligne})"


class Tarif(models.Model):
    compagnie = models.ForeignKey('transport.CompagnieTransport', on_delete=models.CASCADE, related_name='tarifs')
    ligne = models.ForeignKey('transport.Ligne', on_delete=models.CASCADE, related_name='tarifs')
    type_bus = models.CharField(max_length=20, choices=Bus.TypeBus.choices, default=Bus.TypeBus.STANDARD)
    prix = models.PositiveIntegerField(help_text='Montant en plus petite unité (ex: francs).')
    devise = models.CharField(max_length=10, default='XOF')

    class Meta:
        verbose_name = 'Tarif'
        verbose_name_plural = 'Tarifs'
        constraints = [
            models.UniqueConstraint(fields=['compagnie', 'ligne', 'type_bus'], name='uniq_tarif_compagnie_ligne_type'),
        ]

    def __str__(self) -> str:
        return f"{self.prix} {self.devise} ({self.compagnie})"
