from django.db import models
from django.conf import settings

# Create your models here.


class ProfilClient(models.Model):
    utilisateur = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profil_client',
    )
    telephone = models.CharField(max_length=30, blank=True)
    date_naissance = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = 'Profil client'
        verbose_name_plural = 'Profils clients'

    def __str__(self) -> str:
        return f"ProfilClient({self.utilisateur_id})"


class ContactConfiance(models.Model):
    class Relation(models.TextChoices):
        PARENT = 'PARENT', 'Parent'
        AMI = 'AMI', 'Ami'
        AUTRE = 'AUTRE', 'Autre'

    profil_client = models.ForeignKey(
        'accounts.ProfilClient',
        on_delete=models.CASCADE,
        related_name='contacts_confiance',
    )
    nom = models.CharField(max_length=120)
    telephone = models.CharField(max_length=30)
    relation = models.CharField(max_length=10, choices=Relation.choices, default=Relation.AUTRE)
    requis_si_mineur = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Contact de confiance'
        verbose_name_plural = 'Contacts de confiance'

    def __str__(self) -> str:
        return f"{self.nom} ({self.telephone})"


class ProfilEmploye(models.Model):
    class Role(models.TextChoices):
        ADMIN_PLATEFORME = 'ADMIN_PLATEFORME', 'Admin plateforme'
        CHEF_COMPAGNIE = 'CHEF_COMPAGNIE', 'Chef de compagnie'
        CONTROLEUR = 'CONTROLEUR', 'Contrôleur (scan)'
        RECEPTIONNISTE = 'RECEPTIONNISTE', 'Réceptionniste'
        COMPTABLE = 'COMPTABLE', 'Comptable'
        SAV = 'SAV', 'SAV'

    utilisateur = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profil_employe',
    )
    compagnie = models.ForeignKey(
        'transport.CompagnieTransport',
        on_delete=models.PROTECT,
        related_name='employes',
        null=True,
        blank=True,
        help_text="Optionnel pour l'admin plateforme.",
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    actif = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Profil employé'
        verbose_name_plural = 'Profils employés'

    def __str__(self) -> str:
        return f"ProfilEmploye({self.utilisateur_id}, {self.role})"
