from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    CurrentUserView,
    UserViewSet,
    RoleViewSet,
    PermissionViewSet,
    CompanyViewSet,
    GareViewSet,
    AuditLogViewSet,
)

# Créer un router pour les ViewSets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'gares', GareViewSet, basename='gare')
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')

# URL patterns
urlpatterns = [
    # Authentication endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view({'get': 'list'}), name='current_user'),

    # Router endpoints
    path('', include(router.urls)),
]
