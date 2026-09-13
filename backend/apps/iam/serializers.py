from rest_framework import serializers
from .models import Company, Gare, Permission, Role, CustomUser, AuditLog


class CompanySerializer(serializers.ModelSerializer):
    """Sérializer pour Company"""

    class Meta:
        model = Company
        fields = ('id', 'name', 'email', 'phone', 'address', 'slug', 'logo',
                  'subscription', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class GareSerializer(serializers.ModelSerializer):
    """Sérializer pour Gare"""
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = Gare
        fields = ('id', 'company', 'company_name', 'name', 'city', 'address',
                  'phone', 'email', 'manager_name', 'coordinates', 'is_active',
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class PermissionSerializer(serializers.ModelSerializer):
    """Sérializer pour Permission"""

    class Meta:
        model = Permission
        fields = ('id', 'resource', 'action', 'name', 'description', 'created_at')
        read_only_fields = ('id', 'created_at')


class RoleSerializer(serializers.ModelSerializer):
    """Sérializer pour Role"""
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        write_only=True,
        many=True,
        required=False,
        source='permissions'
    )
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = Role
        fields = ('id', 'company', 'company_name', 'name', 'description',
                  'permissions', 'permission_ids', 'is_active', 'created_at',
                  'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class CustomUserSerializer(serializers.ModelSerializer):
    """Sérializer pour CustomUser - Support multi-tenant"""
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    roles = RoleSerializer(many=True, read_only=True)
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        write_only=True,
        many=True,
        required=False,
        source='roles'
    )
    company_name = serializers.SerializerMethodField()
    gare_name = serializers.CharField(source='gare.name', read_only=True, allow_null=True)
    permissions = PermissionSerializer(source='get_permissions', many=True, read_only=True)

    def get_company_name(self, obj):
        """Retourner le nom de la compagnie ou None pour Super Admin Central"""
        return obj.company.name if obj.company else None

    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'password',
                  'company', 'company_name', 'gare', 'gare_name',
                  'roles', 'role_ids', 'permissions',
                  'is_active', 'is_staff', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'permissions')

    def create(self, validated_data):
        """Créer un utilisateur avec password et rôles (M2M à part)"""
        password = validated_data.pop('password', None)
        roles = validated_data.pop('roles', None)
        user = CustomUser.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        if roles is not None:
            user.roles.set(roles)
        return user

    def update(self, instance, validated_data):
        """Mettre à jour un utilisateur (rôles M2M via .set(), pas setattr)"""
        password = validated_data.pop('password', None)
        roles = validated_data.pop('roles', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if roles is not None:
            instance.roles.set(roles)
        return instance


class AuditLogSerializer(serializers.ModelSerializer):
    """Sérializer pour AuditLog"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = AuditLog
        fields = ('id', 'user', 'user_email', 'company', 'company_name',
                  'action', 'resource_type', 'resource_id', 'resource_name',
                  'old_values', 'new_values', 'description', 'ip_address',
                  'created_at')
        read_only_fields = ('id', 'created_at', 'user', 'company', 'ip_address')
