from django.db import models
from django.utils import timezone


class TicketSAV(models.Model):
    class Statut(models.TextChoices):
        OUVERT = 'OUVERT', 'Ouvert'
        EN_COURS = 'EN_COURS', 'En cours'
        RESOLU = 'RESOLU', 'Résolu'
        FERME = 'FERME', 'Fermé'

    class Priorite(models.TextChoices):
        BASSE = 'BASSE', 'Basse'
        MOYENNE = 'MOYENNE', 'Moyenne'
        HAUTE = 'HAUTE', 'Haute'

    company = models.ForeignKey(
        'iam.Company',
        on_delete=models.CASCADE,
        related_name='tickets_sav',
        null=True,
        blank=True,
    )
    profil_client = models.ForeignKey(
        'accounts.ProfilClient',
        on_delete=models.SET_NULL,
        related_name='tickets_sav',
        null=True,
        blank=True,
    )
    # Contact libre (ticket créé par le SAV sans compte client)
    client_nom = models.CharField(max_length=120, blank=True)
    client_telephone = models.CharField(max_length=30, blank=True)
    client_email = models.EmailField(blank=True)

    sujet = models.CharField(max_length=200)
    description = models.TextField()
    priorite = models.CharField(
        max_length=10,
        choices=Priorite.choices,
        default=Priorite.MOYENNE,
    )
    statut = models.CharField(max_length=10, choices=Statut.choices, default=Statut.OUVERT)
    numero_billet = models.CharField(max_length=30, blank=True)
    cree_le = models.DateTimeField(default=timezone.now)
    mis_a_jour_le = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Ticket SAV'
        verbose_name_plural = 'Tickets SAV'
        ordering = ['-cree_le']

    def __str__(self) -> str:
        return f"TicketSAV({self.id}, {self.sujet})"

    def nom_client(self) -> str:
        if self.client_nom:
            return self.client_nom
        if self.profil_client_id:
            u = self.profil_client.utilisateur
            full = f"{u.first_name} {u.last_name}".strip()
            return full or u.email or u.username
        return '—'


class MessageSAV(models.Model):
    ticket = models.ForeignKey(
        'sav_aavis.TicketSAV',
        on_delete=models.CASCADE,
        related_name='messages',
    )
    auteur_client = models.BooleanField(default=True)
    contenu = models.TextField()
    cree_le = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Message SAV'
        verbose_name_plural = 'Messages SAV'
        ordering = ['cree_le']

    def __str__(self) -> str:
        return f"MessageSAV({self.id})"


class Avis(models.Model):
    profil_client = models.ForeignKey(
        'accounts.ProfilClient',
        on_delete=models.PROTECT,
        related_name='avis',
    )
    compagnie = models.ForeignKey(
        'transport.CompagnieTransport',
        on_delete=models.PROTECT,
        related_name='avis',
        null=True,
        blank=True,
    )
    trajet = models.ForeignKey(
        'transport.Trajet',
        on_delete=models.PROTECT,
        related_name='avis',
        null=True,
        blank=True,
    )
    note = models.PositiveSmallIntegerField()
    commentaire = models.TextField(blank=True)
    cree_le = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Avis'
        verbose_name_plural = 'Avis'

    def __str__(self) -> str:
        return f"Avis({self.id})"
