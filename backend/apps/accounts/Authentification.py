from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class JWTCookieAuthentication(JWTAuthentication):
    """JWT via header Authorization Bearer (web/mobile) ou cookie HttpOnly (web)."""

    def authenticate(self, request):
        header = self.get_header(request)
        raw_token = None
        if header is not None:
            raw_token = self.get_raw_token(header)

        cookie_name = getattr(settings, 'JWT_AUTH_COOKIE', 'access_token')
        cookie_token = request.COOKIES.get(cookie_name)

        if raw_token is not None:
            try:
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token
            except (InvalidToken, TokenError):
                if cookie_token and cookie_token != raw_token:
                    try:
                        validated_token = self.get_validated_token(cookie_token)
                        return self.get_user(validated_token), validated_token
                    except (InvalidToken, TokenError):
                        pass
                raise

        if cookie_token is not None:
            validated_token = self.get_validated_token(cookie_token)
            return self.get_user(validated_token), validated_token

        return None
