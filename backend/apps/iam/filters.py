import django_filters
from django.utils import timezone
from datetime import timedelta
from .models import CustomUser, Role, AuditLog, Permission


class UserFilter(django_filters.FilterSet):
    """Custom filters pour les users"""
    email = django_filters.CharFilter(
        field_name='email',
        lookup_expr='icontains'
    )
    is_active = django_filters.BooleanFilter(field_name='is_active')
    role = django_filters.ModelChoiceFilter(
        field_name='roles',
        queryset=Role.objects.all()
    )
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte'
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte'
    )

    class Meta:
        model = CustomUser
        fields = ['email', 'is_active', 'role', 'created_after', 'created_before']


class RoleFilter(django_filters.FilterSet):
    """Custom filters pour les roles"""
    name = django_filters.CharFilter(
        field_name='name',
        lookup_expr='icontains'
    )
    is_active = django_filters.BooleanFilter(field_name='is_active')
    permission = django_filters.ModelChoiceFilter(
        field_name='permissions',
        queryset=Permission.objects.all()
    )

    class Meta:
        model = Role
        fields = ['name', 'is_active', 'permission']


class PermissionFilter(django_filters.FilterSet):
    """Custom filters pour les permissions"""
    resource = django_filters.CharFilter(
        field_name='resource',
        lookup_expr='icontains'
    )
    action = django_filters.CharFilter(
        field_name='action',
        lookup_expr='icontains'
    )

    class Meta:
        model = Permission
        fields = ['resource', 'action']


class AuditLogFilter(django_filters.FilterSet):
    """Custom filters pour les audit logs"""
    action = django_filters.ChoiceFilter(
        field_name='action',
        choices=AuditLog._meta.get_field('action').choices
    )
    resource_type = django_filters.CharFilter(
        field_name='resource_type',
        lookup_expr='icontains'
    )
    user_email = django_filters.CharFilter(
        field_name='user__email',
        lookup_expr='icontains'
    )
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte'
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte'
    )
    # Date shortcuts
    today = django_filters.BooleanFilter(
        method='filter_today',
        label='Logs from today'
    )
    last_7_days = django_filters.BooleanFilter(
        method='filter_last_7_days',
        label='Logs from last 7 days'
    )
    last_30_days = django_filters.BooleanFilter(
        method='filter_last_30_days',
        label='Logs from last 30 days'
    )

    class Meta:
        model = AuditLog
        fields = ['action', 'resource_type', 'user', 'created_after', 'created_before']

    def filter_today(self, queryset, name, value):
        if value:
            today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            return queryset.filter(created_at__gte=today)
        return queryset

    def filter_last_7_days(self, queryset, name, value):
        if value:
            seven_days_ago = timezone.now() - timedelta(days=7)
            return queryset.filter(created_at__gte=seven_days_ago)
        return queryset

    def filter_last_30_days(self, queryset, name, value):
        if value:
            thirty_days_ago = timezone.now() - timedelta(days=30)
            return queryset.filter(created_at__gte=thirty_days_ago)
        return queryset
