import uuid
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import TokenError
import jwt


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware qui extrait le tenant_id du JWT et le stocke dans le request.
    Cela permet la multi-tenant isolation automatique.
    """

    def process_request(self, request):
        # Extraire le token du header Authorization
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        token = None

        if auth_header.startswith('Bearer '):
            token = auth_header[7:]

        request.tenant_id = None
        request.company_id = None

        if token:
            try:
                # Décoder le token sans vérifier la signature (fait par DRF)
                # C'est juste pour extraire le tenant_id
                decoded = jwt.decode(
                    token,
                    options={"verify_signature": False}
                )
                tenant_id = decoded.get('tenant_id') or decoded.get('company_id')

                if tenant_id:
                    try:
                        # Vérifier que c'est un UUID valide
                        uuid.UUID(tenant_id)
                        request.tenant_id = tenant_id
                        request.company_id = tenant_id
                    except (ValueError, TypeError):
                        pass

            except (jwt.DecodeError, TokenError):
                # Token invalide, on continue sans tenant_id
                pass

        return None

    def process_view(self, request, view_func, view_args, view_kwargs):
        """
        S'il y a un user authentifié, vérifier qu'il accède à sa propre company.
        EXCEPTION: Super Admin Central (company=NULL) peut accéder à toutes les compagnies.
        """
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Super Admin Central (company=NULL) peut tout faire
            if request.user.company_id is None and request.user.is_superuser:
                return None

            # Utilisateurs réguliers doivent accéder UNIQUEMENT à leur company
            if request.tenant_id:
                if request.user.company_id is None:
                    # Utilisateur sans company ne peut pas accéder à des données
                    from rest_framework.response import Response
                    from rest_framework import status

                    return Response(
                        {'detail': 'Accès refusé - Pas de compagnie assignée'},
                        status=status.HTTP_403_FORBIDDEN
                    )

                if str(request.user.company_id) != str(request.tenant_id):
                    # L'utilisateur essaie d'accéder à une autre company
                    from rest_framework.response import Response
                    from rest_framework import status

                    return Response(
                        {'detail': 'Accès refusé - Tenant mismatch'},
                        status=status.HTTP_403_FORBIDDEN
                    )

        return None
