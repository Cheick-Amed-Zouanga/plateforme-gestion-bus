from django.db import models
from django.utils import timezone

# Create your models here.


class PositionTrajet(models.Model):
    trajet = models.ForeignKey('transport.Trajet', on_delete=models.CASCADE, related_name='positions')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    vitesse_kmh = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    enregistre_le = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Position de trajet'
        verbose_name_plural = 'Positions de trajet'
        indexes = [
            models.Index(fields=['trajet', 'enregistre_le']),
        ]

    def __str__(self) -> str:
        return f"PositionTrajet({self.trajet_id} @ {self.enregistre_le})"


class LienPartagePosition(models.Model):
    billet = models.ForeignKey('reservation_billets.Billet', on_delete=models.CASCADE, related_name='liens_partage')
    telephone_destinataire = models.CharField(max_length=30)
    jeton = models.CharField(max_length=64, unique=True)
    actif = models.BooleanField(default=True)
    expire_le = models.DateTimeField(null=True, blank=True)
    cree_le = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Lien de partage de position'
        verbose_name_plural = 'Liens de partage de position'
        indexes = [
            models.Index(fields=['actif', 'expire_le']),
        ]

    def __str__(self) -> str:
        return f"LienPartagePosition({self.telephone_destinataire})"
