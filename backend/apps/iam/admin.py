from django.contrib import admin
from .models import Company, Gare, Permission, Role, CustomUser, AuditLog


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subscription', 'is_active', 'created_at')
    list_filter = ('subscription', 'is_active', 'created_at')
    search_fields = ('name', 'email', 'slug')
    readonly_fields = ('id', 'created_at', 'updated_at')
    fieldsets = (
        ('Informations', {
            'fields': ('id', 'name', 'slug', 'email', 'phone', 'address', 'logo')
        }),
        ('Abonnement', {
            'fields': ('subscription', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Gare)
class GareAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'company', 'is_active', 'created_at')
    list_filter = ('company', 'city', 'is_active', 'created_at')
    search_fields = ('name', 'city', 'manager_name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    fieldsets = (
        ('Informations', {
            'fields': ('id', 'company', 'name', 'city', 'address')
        }),
        ('Contact', {
            'fields': ('email', 'phone', 'manager_name')
        }),
        ('Localisation', {
            'fields': ('coordinates',),
            'classes': ('collapse',)
        }),
        ('Statut', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'resource', 'action', 'created_at')
    list_filter = ('resource', 'action', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('id', 'created_at')
    fieldsets = (
        ('Informations', {
            'fields': ('id', 'resource', 'action', 'name', 'description')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'is_active', 'created_at')
    list_filter = ('company', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('id', 'created_at', 'updated_at')
    filter_horizontal = ('permissions',)
    fieldsets = (
        ('Informations', {
            'fields': ('id', 'company', 'name', 'description')
        }),
        ('Permissions', {
            'fields': ('permissions',)
        }),
        ('Statut', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'company', 'gare', 'is_staff', 'is_active', 'created_at')
    list_filter = ('company', 'is_staff', 'is_active', 'created_at')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    filter_horizontal = ('roles', 'groups', 'user_permissions')
    fieldsets = (
        ('Authentification', {
            'fields': ('id', 'username', 'email', 'password')
        }),
        ('Profil', {
            'fields': ('first_name', 'last_name')
        }),
        ('Tenant', {
            'fields': ('company', 'gare')
        }),
        ('Rôles et Permissions', {
            'fields': ('roles', 'groups', 'user_permissions')
        }),
        ('Statut', {
            'fields': ('is_active', 'is_staff', 'is_superuser')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_login'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'resource_type', 'user', 'company', 'created_at')
    list_filter = ('action', 'resource_type', 'company', 'created_at')
    search_fields = ('resource_name', 'description', 'user__email')
    readonly_fields = ('id', 'created_at', 'user', 'company', 'action', 'resource_type',
                       'resource_id', 'resource_name', 'old_values', 'new_values',
                       'description', 'ip_address')
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        # AuditLog ne doit être que lus, pas créés manuellement
        return False

    def has_delete_permission(self, request, obj=None):
        # AuditLog ne doit pas être supprimés
        return False

    fieldsets = (
        ('Action', {
            'fields': ('action', 'resource_type', 'resource_id', 'resource_name')
        }),
        ('Acteur', {
            'fields': ('user', 'company', 'ip_address')
        }),
        ('Changements', {
            'fields': ('old_values', 'new_values', 'description')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
