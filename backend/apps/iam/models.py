import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser


class Company(models.Model):
    """Tenant - Compagnie de transport"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    slug = models.SlugField(unique=True)
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    subscription = models.CharField(
        max_length=20,
        choices=[
            ('free', 'Free'),
            ('pro', 'Pro'),
            ('enterprise', 'Enterprise')
        ],
        default='free'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Companies'

    def __str__(self):
        return self.name


class Gare(models.Model):
    """Point de vente - Gare par compagnie"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='gares')
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    manager_name = models.CharField(max_length=255, blank=True)
    coordinates = models.CharField(max_length=100, blank=True)  # "lat,lng"
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['company', 'name']
        unique_together = ['company', 'name']
        verbose_name_plural = 'Gares'

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class Permission(models.Model):
    """Permissions CRUD par ressource"""
    RESOURCE_CHOICES = [
        ('bus', 'Bus'),
        ('trajet', 'Trajet'),
        ('employe', 'Employé'),
        ('gare', 'Gare'),
        ('tarif', 'Tarif'),
        ('billet', 'Billet'),
        ('paiement', 'Paiement'),
        ('rapport', 'Rapport'),
        ('iam', 'IAM'),
        ('dashboard', 'Dashboard'),
    ]

    ACTION_CHOICES = [
        ('create', 'Créer'),
        ('read', 'Lire'),
        ('update', 'Modifier'),
        ('delete', 'Supprimer'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resource = models.CharField(max_length=50, choices=RESOURCE_CHOICES)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    name = models.CharField(max_length=100)  # e.g., "bus.create"
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['resource', 'action']
        ordering = ['resource', 'action']

    def __str__(self):
        return f"{self.resource}.{self.action}"


class Role(models.Model):
    """Rôles avec permissions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='roles',
        null=True,
        blank=True  # null = rôle global/plateforme
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, related_name='roles', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['company', 'name']
        unique_together = ['company', 'name']

    def __str__(self):
        return f"{self.name}"

    def add_permissions(self, *permission_names):
        """Ajouter des permissions au rôle"""
        perms = Permission.objects.filter(name__in=permission_names)
        self.permissions.add(*perms)


class CustomUser(AbstractUser):
    """Utilisateur avec company, gare et rôles - Multi-tenant support"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    # null=True pour Super Admin Central (admin@platform.com)
    # Tous les autres users DOIVENT avoir une company
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True
    )
    gare = models.ForeignKey(
        Gare,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employes'
    )
    roles = models.ManyToManyField(Role, related_name='users', blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        ordering = ['company', 'email']

    def __str__(self):
        return f"{self.email} ({self.company.name})"

    def has_permission(self, permission_name):
        """Vérifier si l'user a une permission spécifique"""
        if self.is_superuser:
            return True

        return self.roles.filter(
            permissions__name=permission_name,
            is_active=True
        ).exists()

    def has_any_permission(self, *permission_names):
        """Vérifier si l'user a AU MOINS UNE permission"""
        if self.is_superuser:
            return True

        return self.roles.filter(
            permissions__name__in=permission_names,
            is_active=True
        ).exists()

    def has_all_permissions(self, *permission_names):
        """Vérifier si l'user a TOUTES les permissions"""
        if self.is_superuser:
            return True

        for perm_name in permission_names:
            if not self.has_permission(perm_name):
                return False
        return True

    def get_permissions(self):
        """Retourner toutes les permissions de l'user"""
        if self.is_superuser:
            return Permission.objects.all()

        return Permission.objects.filter(
            roles__users=self,
            roles__is_active=True
        ).distinct()

    def get_accessible_gares(self):
        """Retourner les gares accessibles par l'user"""
        if self.gare:
            return [self.gare]
        return list(self.company.gares.filter(is_active=True))


class AuditLog(models.Model):
    """Journal d'audit des actions"""
    ACTION_CHOICES = [
        ('create', 'Créé'),
        ('update', 'Modifié'),
        ('delete', 'Supprimé'),
        ('login', 'Connexion'),
        ('logout', 'Déconnexion'),
        ('permission_change', 'Permission modifiée'),
        ('role_change', 'Rôle modifié'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=100)  # e.g., "Bus", "Trajet"
    resource_id = models.CharField(max_length=255)
    resource_name = models.CharField(max_length=255, blank=True)
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.action} - {self.resource_type} ({self.created_at})"
