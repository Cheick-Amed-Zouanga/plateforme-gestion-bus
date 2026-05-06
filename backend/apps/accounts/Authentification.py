from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class JWTCookieAuthentication(JWTAuthentication):
    """Lit le JWT dans le cookie HttpOnly plutôt que dans le header."""

    def authenticate(self, request):
        cookie_name = getattr(settings, 'JWT_AUTH_COOKIE', 'access_token')
        raw_token = request.COOKIES.get(cookie_name)

        if raw_token is None:
            return None  # pas de cookie → non authentifié, pas d'erreur

        try:
            validated_token = self.get_validated_token(raw_token)
        except TokenError:
            return None  # token invalide/expiré → laisse la vue décider (401)

        return self.get_user(validated_token), validated_token