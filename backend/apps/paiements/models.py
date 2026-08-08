from django.db import models
from django.utils import timezone

# Create your models here.


class Paiement(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        CAPTURE = 'CAPTURE', 'Capturé'
        ECHOUE = 'ECHOUE', 'Échoué'
        ANNULE = 'ANNULE', 'Annulé'

    class Fournisseur(models.TextChoices):
        STRIPE = 'STRIPE', 'Stripe'
        ADYEN = 'ADYEN', 'Adyen'
        AUTRE = 'AUTRE', 'Autre'

    reservation = models.OneToOneField(
        'reservation_billets.Reservation',
        on_delete=models.PROTECT,
        related_name='paiement',
    )
    montant = models.PositiveIntegerField(default=0)
    devise = models.CharField(max_length=10, default='XOF')
    fournisseur = models.CharField(max_length=10, choices=Fournisseur.choices, default=Fournisseur.AUTRE)
    identifiant_fournisseur = models.CharField(max_length=120, blank=True)
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.EN_ATTENTE)
    cree_le = models.DateTimeField(default=timezone.now)
    capture_le = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'

    def __str__(self) -> str:
        return f"Paiement({self.id})"
