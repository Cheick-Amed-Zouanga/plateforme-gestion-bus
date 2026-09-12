from django.db import models


class TenantQuerySet(models.QuerySet):
    """QuerySet avec filtrage automatique par tenant_id"""

    def filter_by_company(self, company_id):
        """Filtrer par company_id (tenant)"""
        return self.filter(company_id=company_id)

    def for_user(self, user):
        """Filtrer pour l'utilisateur (auto-tenant isolation)"""
        if user.is_superuser:
            return self
        return self.filter(company_id=user.company_id)


class TenantManager(models.Manager):
    """Manager avec filtrage automatique par tenant"""

    def get_queryset(self):
        return TenantQuerySet(self.model, using=self._db)

    def for_user(self, user):
        """Récupérer les objets accessibles par l'utilisateur"""
        return self.get_queryset().for_user(user)

    def filter_by_company(self, company_id):
        """Filtrer les objets par company_id"""
        return self.get_queryset().filter_by_company(company_id)
