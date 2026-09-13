from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from .models import Company, Gare, Permission, Role, CustomUser, AuditLog
from .serializers import (
    CompanySerializer, GareSerializer, PermissionSerializer,
    RoleSerializer, CustomUserSerializer, AuditLogSerializer
)
from .managers import TenantManager


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer que include tenant_id - Multi-tenant support"""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Ajouter tenant_id au token (NULL pour Super Admin Central)
        token['tenant_id'] = str(user.company_id) if user.company_id else None
        token['company_name'] = user.company.name if user.company else 'Platform Admin'
        token['user_email'] = user.email
        token['is_super_admin'] = user.is_superuser and user.company_id is None
        token['user_role'] = ', '.join([r.name for r in user.roles.all()])
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = CustomUserSerializer(user).data
        # Seulement ajouter company si l'utilisateur en a une
        data['company'] = CompanySerializer(user.company).data if user.company else None
        data['is_super_admin'] = user.is_superuser and user.company_id is None
        data['role'] = user.get_primary_role()
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login endpoint avec tenant_id"""
    serializer_class = CustomTokenObtainPairSerializer


class CurrentUserView(viewsets.ViewSet):
    """Récupérer les infos de l'utilisateur courant"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def retrieve_current_user(self, request):
        user = request.user
        serializer = CustomUserSerializer(user)
        return Response(serializer.data)

    def list(self, request):
        """GET /api/users/me/ - Multi-tenant aware"""
        user = request.user
        serializer = CustomUserSerializer(user)

        # Super Admin Central n'a pas de company et d'accessible gares
        if user.company_id is None:
            accessible_gares = []
            company_data = None
        else:
            accessible_gares = GareSerializer(
                user.get_accessible_gares(),
                many=True
            ).data
            company_data = CompanySerializer(user.company).data

        return Response({
            'user': serializer.data,
            'company': company_data,
            'is_super_admin': user.is_superuser and user.company_id is None,
            'permissions': [p.name for p in user.get_permissions()],
            'accessible_gares': accessible_gares,
            'role': user.get_primary_role(),
        })


class UserViewSet(viewsets.ModelViewSet):
    """CRUD Users avec filtrage par company"""
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['company', 'is_active', 'roles']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'email']
    ordering = ['-created_at']

    def get_queryset(self):
        """Retourner les users - Super Admin voit tout, autres voient que leur company"""
        user = self.request.user
        # Super Admin Central (is_superuser + company_id=NULL) peut voir TOUS les users
        if user.is_superuser and user.company_id is None:
            return CustomUser.objects.all()
        # Utilisateurs avec company ne voient que leur company
        if user.company_id is not None:
            return CustomUser.objects.filter(company=user.company)
        # Utilisateurs sans company et sans superuser: accès refusé
        return CustomUser.objects.none()

    def create(self, request, *args, **kwargs):
        """Créer un user - Super Admin peut créer pour n'importe quelle company"""
        # Vérifier la permission
        if not request.user.has_permission('iam.create'):
            return Response(
                {'detail': 'Permission "iam.create" required'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data.copy()

        # Super Admin Central peut spécifier la company_id
        if request.user.is_superuser and request.user.company_id is None:
            # Super Admin - company_id peut être spécifié ou NULL
            if 'company' not in data:
                return Response(
                    {'detail': 'Super Admin must specify company'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Utilisateurs réguliers: forcer leur company
            if request.user.company_id is None:
                return Response(
                    {'detail': 'User must have a company assigned'},
                    status=status.HTTP_403_FORBIDDEN
                )
            data['company'] = str(request.user.company_id)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Log l'action (Audit log doit aussi avoir une company)
        audit_company = serializer.instance.company
        if audit_company is None and request.user.is_superuser:
            # Super Admin logging - pas de company
            pass
        elif audit_company is None:
            # Erreur: utilisateur sans company ne devrait pas créer
            return Response(
                {'detail': 'Invalid state'},
                status=status.HTTP_400_BAD_REQUEST
            )

        AuditLog.objects.create(
            user=request.user,
            company=audit_company or request.user.company,
            action='create',
            resource_type='User',
            resource_id=serializer.instance.id,
            resource_name=serializer.instance.email,
            new_values=serializer.data,
            description=f'Created user {serializer.instance.email}'
        )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        """Update avec audit log"""
        old_data = CustomUserSerializer(serializer.instance).data
        serializer.save()
        new_data = CustomUserSerializer(serializer.instance).data

        AuditLog.objects.create(
            user=self.request.user,
            company=self.request.user.company,
            action='update',
            resource_type='User',
            resource_id=serializer.instance.id,
            resource_name=serializer.instance.email,
            old_values=old_data,
            new_values=new_data,
            description=f'Updated user {serializer.instance.email}'
        )

    def perform_destroy(self, instance):
        """Delete avec audit log"""
        email = instance.email
        instance.delete()

        AuditLog.objects.create(
            user=self.request.user,
            company=self.request.user.company,
            action='delete',
            resource_type='User',
            resource_id=instance.id,
            resource_name=email,
            description=f'Deleted user {email}'
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request, pk=None):
        """Changer le password d'un user"""
        user = self.get_object()

        # Vérifier si c'est son propre compte ou admin
        if user.id != request.user.id and not request.user.is_superuser:
            return Response(
                {'detail': 'You can only change your own password'},
                status=status.HTTP_403_FORBIDDEN
            )

        password = request.data.get('password')
        if not password:
            return Response(
                {'detail': 'Password field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(password)
        user.save()

        AuditLog.objects.create(
            user=request.user,
            company=request.user.company,
            action='update',
            resource_type='User',
            resource_id=user.id,
            resource_name=user.email,
            description=f'Password changed for {user.email}'
        )

        return Response({'detail': 'Password changed successfully'})


class RoleViewSet(viewsets.ModelViewSet):
    """CRUD Roles avec permissions"""
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['company', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['company', 'name']

    def get_queryset(self):
        """Retourner les roles de la company de l'utilisateur courant"""
        user = self.request.user
        if user.is_superuser:
            return Role.objects.all()
        # Rôles de la company de l'user + rôles globaux (company=None)
        return Role.objects.filter(
            models.Q(company=user.company) | models.Q(company=None)
        )

    def create(self, request, *args, **kwargs):
        """
        Créer un rôle. Super Admin (company=None) : rôle global, ou pour une
        compagnie précise s'il la spécifie. Utilisateur d'une compagnie : rôle
        toujours rattaché à sa propre compagnie (non modifiable côté client).
        """
        if not request.user.has_permission('iam.create'):
            return Response(
                {'detail': 'Permission "iam.create" required'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data.copy()
        if not (request.user.is_superuser and request.user.company_id is None):
            data['company'] = str(request.user.company_id)
        elif not data.get('company'):
            data['company'] = None

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        AuditLog.objects.create(
            user=request.user,
            company=request.user.company,
            action='create',
            resource_type='Role',
            resource_id=serializer.instance.id,
            resource_name=serializer.instance.name,
            new_values=serializer.data,
            description=f'Created role {serializer.instance.name}'
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        """Update avec audit log"""
        old_data = RoleSerializer(serializer.instance).data
        serializer.save()
        new_data = RoleSerializer(serializer.instance).data

        AuditLog.objects.create(
            user=self.request.user,
            company=self.request.user.company,
            action='permission_change',
            resource_type='Role',
            resource_id=serializer.instance.id,
            resource_name=serializer.instance.name,
            old_values=old_data,
            new_values=new_data,
            description=f'Updated permissions for role {serializer.instance.name}'
        )

    def perform_destroy(self, instance):
        """Delete avec audit log"""
        name = instance.name
        instance.delete()

        AuditLog.objects.create(
            user=self.request.user,
            company=self.request.user.company,
            action='delete',
            resource_type='Role',
            resource_id=instance.id,
            resource_name=name,
            description=f'Deleted role {name}'
        )


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """Lister les permissions (ReadOnly)"""
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['resource', 'action']
    search_fields = ['name', 'description', 'resource']
    ordering = ['resource', 'action']

    @action(detail=False, methods=['get'])
    def by_resource(self, request):
        """Grouper les permissions par ressource"""
        resource = request.query_params.get('resource')
        if resource:
            perms = Permission.objects.filter(resource=resource)
        else:
            perms = Permission.objects.all()

        # Grouper par ressource
        grouped = {}
        for perm in perms:
            if perm.resource not in grouped:
                grouped[perm.resource] = []
            grouped[perm.resource].append(PermissionSerializer(perm).data)

        return Response(grouped)


class CompanyViewSet(viewsets.ModelViewSet):
    """
    CRUD Companies (tenants).
    Seul le Super Admin Central (is_superuser + company=None) peut créer,
    modifier ou supprimer des compagnies : ce sont les tenants de la
    plateforme. Un utilisateur d'une compagnie ne voit/modifie que la sienne.
    """
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'subscription']
    search_fields = ['name', 'email', 'slug']
    ordering_fields = ['created_at', 'name']
    ordering = ['name']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser and user.company_id is None:
            return Company.objects.all()
        if user.company_id:
            return Company.objects.filter(id=user.company_id)
        return Company.objects.none()

    def _require_super_admin(self, request):
        return request.user.is_superuser and request.user.company_id is None

    def create(self, request, *args, **kwargs):
        """Créer une nouvelle compagnie (tenant) - Super Admin uniquement"""
        if not self._require_super_admin(request):
            return Response(
                {'detail': 'Seul le Super Admin peut créer une compagnie.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        AuditLog.objects.create(
            user=request.user,
            company=serializer.instance,
            action='create',
            resource_type='Company',
            resource_id=serializer.instance.id,
            resource_name=serializer.instance.name,
            new_values=serializer.data,
            description=f'Created company {serializer.instance.name}'
        )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        if not self._require_super_admin(request):
            return Response(
                {'detail': 'Seul le Super Admin peut modifier une compagnie.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not self._require_super_admin(request):
            return Response(
                {'detail': 'Seul le Super Admin peut supprimer une compagnie.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """GET /api/iam/companies/me/ - Compagnie de l'utilisateur courant"""
        company = request.user.company
        if company is None:
            return Response(None)
        return Response(CompanySerializer(company).data)

    @action(detail=False, methods=['get'])
    def gares(self, request):
        """GET /api/iam/companies/gares/ - Gares de la compagnie courante"""
        gares = Gare.objects.filter(company=request.user.company)
        serializer = GareSerializer(gares, many=True)
        return Response(serializer.data)


class GareViewSet(viewsets.ModelViewSet):
    """CRUD Gares dans la company de l'user"""
    serializer_class = GareSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['company', 'city', 'is_active']
    search_fields = ['name', 'city', 'manager_name']
    ordering = ['company', 'name']

    def get_queryset(self):
        """Retourner les gares de la company de l'utilisateur courant"""
        user = self.request.user
        if user.is_superuser:
            return Gare.objects.all()
        return Gare.objects.filter(company=user.company)

    def create(self, request, *args, **kwargs):
        """Créer une gare dans la company de l'utilisateur courant"""
        if not request.user.has_permission('gare.create'):
            return Response(
                {'detail': 'Permission "gare.create" required'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data.copy()
        data['company'] = str(request.user.company_id)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        AuditLog.objects.create(
            user=request.user,
            company=request.user.company,
            action='create',
            resource_type='Gare',
            resource_id=serializer.instance.id,
            resource_name=serializer.instance.name,
            new_values=serializer.data,
            description=f'Created gare {serializer.instance.name}'
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        """Update avec audit log"""
        old_data = GareSerializer(serializer.instance).data
        serializer.save()
        new_data = GareSerializer(serializer.instance).data

        AuditLog.objects.create(
            user=self.request.user,
            company=self.request.user.company,
            action='update',
            resource_type='Gare',
            resource_id=serializer.instance.id,
            resource_name=serializer.instance.name,
            old_values=old_data,
            new_values=new_data,
            description=f'Updated gare {serializer.instance.name}'
        )

    def perform_destroy(self, instance):
        """Delete avec audit log"""
        name = instance.name
        instance.delete()

        AuditLog.objects.create(
            user=self.request.user,
            company=self.request.user.company,
            action='delete',
            resource_type='Gare',
            resource_id=instance.id,
            resource_name=name,
            description=f'Deleted gare {name}'
        )


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Audit logs (ReadOnly avec filters)"""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'resource_type', 'user', 'company']
    search_fields = ['resource_name', 'description', 'user__email']
    ordering = ['-created_at']

    def get_queryset(self):
        """Retourner les audit logs de la company de l'utilisateur courant"""
        user = self.request.user
        if user.is_superuser:
            return AuditLog.objects.all()
        return AuditLog.objects.filter(company=user.company)

    @action(detail=False, methods=['get'])
    def by_user(self, request):
        """Filtrer les logs par utilisateur"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {'detail': 'user_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        logs = self.get_queryset().filter(user_id=user_id)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_action(self, request):
        """Filtrer les logs par action"""
        action = request.query_params.get('action')
        if not action:
            return Response(
                {'detail': 'action parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        logs = self.get_queryset().filter(action=action)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_resource(self, request):
        """Filtrer les logs par ressource"""
        resource_type = request.query_params.get('resource_type')
        if not resource_type:
            return Response(
                {'detail': 'resource_type parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        logs = self.get_queryset().filter(resource_type=resource_type)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
