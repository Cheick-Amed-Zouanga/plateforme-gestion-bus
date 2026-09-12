from functools import wraps
from rest_framework.response import Response
from rest_framework import status


def require_permission(permission_name):
    """
    Décorateur pour vérifier qu'un user a une permission spécifique

    Usage:
        @require_permission('bus.read')
        def list_buses(request):
            ...
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response(
                    {'detail': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not request.user.has_permission(permission_name):
                return Response(
                    {'detail': f'Permission "{permission_name}" is required'},
                    status=status.HTTP_403_FORBIDDEN
                )

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


def require_any_permission(*permission_names):
    """
    Décorateur pour vérifier qu'un user a AU MOINS UNE permission

    Usage:
        @require_any_permission('bus.read', 'bus.update')
        def modify_bus(request):
            ...
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response(
                    {'detail': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not request.user.has_any_permission(*permission_names):
                perms_str = ', '.join(permission_names)
                return Response(
                    {'detail': f'One of these permissions is required: {perms_str}'},
                    status=status.HTTP_403_FORBIDDEN
                )

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


def require_all_permissions(*permission_names):
    """
    Décorateur pour vérifier qu'un user a TOUTES les permissions

    Usage:
        @require_all_permissions('bus.read', 'bus.update', 'bus.delete')
        def dangerous_operation(request):
            ...
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response(
                    {'detail': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not request.user.has_all_permissions(*permission_names):
                perms_str = ', '.join(permission_names)
                return Response(
                    {'detail': f'All these permissions are required: {perms_str}'},
                    status=status.HTTP_403_FORBIDDEN
                )

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


def tenant_filter(queryset_or_model):
    """
    Décorateur pour filtrer automatiquement un queryset par tenant

    Usage:
        @tenant_filter
        def get_buses(request):
            buses = Bus.objects.all()
            # buses sera automatiquement filtré par company_id
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Stocker le company_id dans le request
            if request.user.is_authenticated:
                request.company_id = str(request.user.company_id)

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator
