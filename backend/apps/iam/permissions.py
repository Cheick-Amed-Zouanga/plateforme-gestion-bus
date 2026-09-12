from rest_framework.permissions import BasePermission


class IsCompanyMember(BasePermission):
    """
    Vérifier que l'utilisateur appartient à la même company
    que la ressource qu'il essaie d'accéder
    """
    message = "Vous n'avez pas accès à cette ressource (Company mismatch)"

    def has_object_permission(self, request, view, obj):
        # Vérifier que la company_id de l'object correspond à celle de l'user
        if hasattr(obj, 'company_id'):
            return obj.company_id == request.user.company_id
        return True


class HasIAMPermission(BasePermission):
    """
    Vérifier que l'utilisateur a une permission spécifique IAM
    """
    required_permission = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Si superuser, autoriser tout
        if request.user.is_superuser:
            return True

        # Si pas de permission requise, laisser passer
        if not self.required_permission:
            return True

        # Vérifier la permission
        return request.user.has_permission(self.required_permission)


class CanManageUsers(HasIAMPermission):
    """Permission pour gérer les utilisateurs"""
    message = "Vous n'avez pas la permission de gérer les utilisateurs"

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        # Selon la méthode HTTP
        if request.method == 'GET':
            return request.user.has_permission('iam.read')
        elif request.method in ['POST']:
            return request.user.has_permission('iam.create')
        elif request.method in ['PUT', 'PATCH']:
            return request.user.has_permission('iam.update')
        elif request.method == 'DELETE':
            return request.user.has_permission('iam.delete')

        return False


class CanManageRoles(HasIAMPermission):
    """Permission pour gérer les rôles"""
    message = "Vous n'avez pas la permission de gérer les rôles"

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        # Selon la méthode HTTP
        if request.method == 'GET':
            return request.user.has_permission('iam.read')
        elif request.method in ['POST']:
            return request.user.has_permission('iam.create')
        elif request.method in ['PUT', 'PATCH']:
            return request.user.has_permission('iam.update')
        elif request.method == 'DELETE':
            return request.user.has_permission('iam.delete')

        return False


class CanManageGares(HasIAMPermission):
    """Permission pour gérer les gares"""
    message = "Vous n'avez pas la permission de gérer les gares"

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        # Selon la méthode HTTP
        if request.method == 'GET':
            return request.user.has_permission('gare.read')
        elif request.method in ['POST']:
            return request.user.has_permission('gare.create')
        elif request.method in ['PUT', 'PATCH']:
            return request.user.has_permission('gare.update')
        elif request.method == 'DELETE':
            return request.user.has_permission('gare.delete')

        return False


class CanViewAuditLogs(BasePermission):
    """Permission pour voir les audit logs"""
    message = "Vous n'avez pas la permission de voir les audit logs"

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        # Seuls les admins/managers peuvent voir les audit logs
        return request.user.has_any_permission('iam.read', 'rapport.read')


class CanViewPermissions(BasePermission):
    """Permission pour voir les permissions"""
    message = "Vous n'avez pas la permission de voir les permissions"

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Tous les utilisateurs authentifiés peuvent voir les permissions
        return True
