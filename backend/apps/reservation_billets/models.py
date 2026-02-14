from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

# Create your models here.


class Reservation(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        CONFIRMEE = 'CONFIRMEE', 'Confirmée'
        ANNULEE = 'ANNULEE', 'Annulée'
        EXPIREE = 'EXPIREE', 'Expirée'

    profil_client = models.ForeignKey('accounts.ProfilClient', on_delete=models.PROTECT, related_name='reservations')
    trajet = models.ForeignKey('transport.Trajet', on_delete=models.PROTECT, related_name='reservations')
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.EN_ATTENTE)
    montant_total = models.PositiveIntegerField(default=0)
    devise = models.CharField(max_length=10, default='XOF')
    cree_le = models.DateTimeField(default=timezone.now)
    confirme_le = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Réservation'
        verbose_name_plural = 'Réservations'

    def __str__(self) -> str:
        return f"Reservation({self.id})"


class Billet(models.Model):
    class Statut(models.TextChoices):
        EMIS = 'EMIS', 'Émis'
        SCANNE = 'SCANNE', 'Scanné'
        ANNULE = 'ANNULE', 'Annulé'

    reservation = models.OneToOneField('reservation_billets.Reservation', on_delete=models.CASCADE, related_name='billet')
    siege = models.ForeignKey('transport.Siege', on_delete=models.PROTECT, related_name='billets', null=True, blank=True)
    scanne_par = models.ForeignKey(
        'accounts.ProfilEmploye',
        on_delete=models.PROTECT,
        related_name='billets_scannes',
        null=True,
        blank=True,
    )
    code_qr = models.CharField(max_length=120, unique=True)
    statut = models.CharField(max_length=10, choices=Statut.choices, default=Statut.EMIS)
    emis_le = models.DateTimeField(default=timezone.now)
    scanne_le = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Billet'
        verbose_name_plural = 'Billets'

    def verifier_droit_scan(self, employe: 'accounts.ProfilEmploye') -> None:
        if employe is None:
            raise ValidationError("Employé requis pour scanner un billet.")

        compagnie_billet_id = self.reservation.trajet.compagnie_id
        if employe.compagnie_id != compagnie_billet_id:
            raise ValidationError("Vous ne pouvez scanner que les billets de votre compagnie.")

    def scanner(self, employe: 'accounts.ProfilEmploye') -> None:
        self.verifier_droit_scan(employe)
        self.scanne_par = employe
        self.scanne_le = timezone.now()
        self.statut = self.Statut.SCANNE

    def __str__(self) -> str:
        return f"Billet({self.id})"
