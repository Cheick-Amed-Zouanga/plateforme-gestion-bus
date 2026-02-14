from django.db import models
from django.utils import timezone

# Create your models here.


class TicketSAV(models.Model):
    class Statut(models.TextChoices):
        OUVERT = 'OUVERT', 'Ouvert'
        EN_COURS = 'EN_COURS', 'En cours'
        RESOLU = 'RESOLU', 'Résolu'
        FERME = 'FERME', 'Fermé'

    profil_client = models.ForeignKey('accounts.ProfilClient', on_delete=models.PROTECT, related_name='tickets_sav')
    sujet = models.CharField(max_length=200)
    description = models.TextField()
    statut = models.CharField(max_length=10, choices=Statut.choices, default=Statut.OUVERT)
    cree_le = models.DateTimeField(default=timezone.now)
    mis_a_jour_le = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Ticket SAV'
        verbose_name_plural = 'Tickets SAV'

    def __str__(self) -> str:
        return f"TicketSAV({self.id})"


class MessageSAV(models.Model):
    ticket = models.ForeignKey('sav_aavis.TicketSAV', on_delete=models.CASCADE, related_name='messages')
    auteur_client = models.BooleanField(default=True)
    contenu = models.TextField()
    cree_le = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Message SAV'
        verbose_name_plural = 'Messages SAV'

    def __str__(self) -> str:
        return f"MessageSAV({self.id})"


class Avis(models.Model):
    profil_client = models.ForeignKey('accounts.ProfilClient', on_delete=models.PROTECT, related_name='avis')
    compagnie = models.ForeignKey('transport.CompagnieTransport', on_delete=models.PROTECT, related_name='avis', null=True, blank=True)
    trajet = models.ForeignKey('transport.Trajet', on_delete=models.PROTECT, related_name='avis', null=True, blank=True)
    note = models.PositiveSmallIntegerField()
    commentaire = models.TextField(blank=True)
    cree_le = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Avis'
        verbose_name_plural = 'Avis'

    def __str__(self) -> str:
        return f"Avis({self.id})"
