from django.db import models
from django.utils import timezone

# Create your models here.


class Notification(models.Model):
    class Canal(models.TextChoices):
        SMS = 'SMS', 'SMS'
        EMAIL = 'EMAIL', 'Email'
        PUSH = 'PUSH', 'Push'

    class Statut(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        ENVOYEE = 'ENVOYEE', 'Envoyée'
        ECHOUEE = 'ECHOUEE', 'Échouée'

    profil_client = models.ForeignKey(
        'accounts.ProfilClient',
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
    )
    canal = models.CharField(max_length=10, choices=Canal.choices)
    titre = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.EN_ATTENTE)
    envoye_le = models.DateTimeField(null=True, blank=True)
    cree_le = models.DateTimeField(default=timezone.now)
    metadonnees = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        indexes = [
            models.Index(fields=['profil_client', 'cree_le']),
            models.Index(fields=['statut', 'canal']),
        ]

    def __str__(self) -> str:
        return f"Notification({self.id})"
