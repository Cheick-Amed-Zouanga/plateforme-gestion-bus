import random

from django.conf import settings
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.mail import send_mail
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import ProfilEmploye
from .serializers import (
    ConnexionSerializer,
    CreationChefCompagnieSerializer,
    CreationComptablePlateformeSerializer,
    CreationEmployeCompagnieSerializer,
    CreationSAVSerializer,
    DemandeReinitialisationSerializer,
    InscriptionClientSerializer,
    ModificationClientSerializer,
    ModificationEmployeCompagnieSerializer,
    ModificationEmployePlateformeSerializer,
    ModificationMonProfilChefSerializer,
    ProfilConnecteSerializer,
    ReinitialisationCompteSerializer,
    VerificationCodeSerializer,
)


# ---------------------------------------------------------------------------
# Base & utilitaires
# ---------------------------------------------------------------------------

class BaseAPIView(APIView):
    # Toutes les vues héritant de cette classe utilisent la session Django
    authentication_classes = [SessionAuthentication]


def _set_jwt_cookies(response, refresh):
    """Pose les cookies access et refresh JWT sur la réponse HTTP."""
    access = refresh.access_token
    secure = getattr(settings, 'JWT_AUTH_COOKIE_SECURE', False)
    samesite = getattr(settings, 'JWT_AUTH_COOKIE_SAMESITE', 'Lax')

    response.set_cookie(
        key=settings.JWT_AUTH_COOKIE,
        value=str(access),
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
    )
    response.set_cookie(
        key=settings.JWT_AUTH_REFRESH_COOKIE,
        value=str(refresh),
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
    )
    return response


# ---------------------------------------------------------------------------
# Authentification (CSRF, connexion, déconnexion, refresh)
# ---------------------------------------------------------------------------

class CsrfTokenView(APIView):
    """Fournit le token CSRF au frontend au démarrage de l'application."""
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'csrfToken': get_token(request)})


class ConnexionView(APIView):
    """Authentifie l'utilisateur et pose les cookies JWT."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = ConnexionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        utilisateur = serializer.validated_data['utilisateur']
        refresh = RefreshToken.for_user(utilisateur)

        # Récupère le rôle si c'est un employé
        role = None
        if hasattr(utilisateur, 'profil_employe'):
            role = utilisateur.profil_employe.role

        response = Response(
            {'message': 'Connexion réussie.', 'username': utilisateur.username, 'role': role},
            status=status.HTTP_200_OK,
        )
        return _set_jwt_cookies(response, refresh)


class DeconnexionView(APIView):
    """Invalide le refresh token et supprime les cookies JWT."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass  # token déjà invalide, on continue quand même

        response = Response({'message': 'Déconnexion réussie.'})
        response.delete_cookie(settings.JWT_AUTH_COOKIE)
        response.delete_cookie(settings.JWT_AUTH_REFRESH_COOKIE)
        return response


class TokenRefreshCookieView(APIView):
    """Renouvelle l'access token à partir du refresh token stocké en cookie."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token manquant.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            refresh = RefreshToken(refresh_token)
            response = Response({'message': 'Token renouvelé.'})
            return _set_jwt_cookies(response, refresh)
        except TokenError as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# Inscription & profil
# ---------------------------------------------------------------------------

class InscriptionClientView(BaseAPIView):
    """Crée un nouveau compte client."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InscriptionClientSerializer(data=request.data)
        if serializer.is_valid():
            utilisateur = serializer.save()
            return Response(
                {'message': 'Inscription réussie.', 'username': utilisateur.username},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfilConnecteView(BaseAPIView):
    """Retourne les informations du compte actuellement connecté."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfilConnecteSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Création de comptes employés (réservé aux utilisateurs authentifiés)
# ---------------------------------------------------------------------------

class CreationSAVView(BaseAPIView):
    """Crée un agent SAV."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreationSAVSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            utilisateur = serializer.save()
            return Response(
                {'message': 'Agent SAV créé avec succès.', 'username': utilisateur.username},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreationComptablePlateformeView(BaseAPIView):
    """Crée un comptable plateforme."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreationComptablePlateformeSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            utilisateur = serializer.save()
            return Response(
                {'message': 'Comptable plateforme créé avec succès.', 'username': utilisateur.username},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreationChefCompagnieView(BaseAPIView):
    """Crée un chef de compagnie."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreationChefCompagnieSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            utilisateur = serializer.save()
            return Response(
                {'message': 'Chef de compagnie créé avec succès.', 'username': utilisateur.username},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreationEmployeCompagnieView(BaseAPIView):
    """Crée un employé (réceptionniste ou contrôleur) au sein d'une compagnie."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreationEmployeCompagnieSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            utilisateur = serializer.save()
            return Response(
                {'message': 'Employé de compagnie créé avec succès.', 'username': utilisateur.username},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Modification de profils
# ---------------------------------------------------------------------------

class ModifierClientView(BaseAPIView):
    """Permet à un client de modifier son propre profil."""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        utilisateur = request.user
        if not hasattr(utilisateur, "profil_client"):
            return Response(
                {"message": "Seul un client peut modifier ce profil."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ModificationClientSerializer(
            utilisateur, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profil client modifié avec succès."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ModifierMonProfilChefView(BaseAPIView):
    """Permet à un chef de compagnie de modifier son propre profil."""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = ModificationMonProfilChefSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profil du chef modifié avec succès."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ModifierEmployeCompagnieView(BaseAPIView):
    """Permet à un chef de modifier un employé de sa compagnie (par ID)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, employe_id):
        try:
            employe_cible = ProfilEmploye.objects.get(id=employe_id, actif=True)
        except ProfilEmploye.DoesNotExist:
            return Response({"message": "Employé introuvable."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ModificationEmployeCompagnieSerializer(
            employe_cible,
            data=request.data,
            partial=True,
            context={"request": request, "employe_cible": employe_cible},
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Employé de compagnie modifié avec succès."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ModifierEmployePlateformeView(BaseAPIView):
    """Permet à l'admin plateforme de modifier un employé plateforme (par username)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        username_recherche = request.data.get("usernameRecherche")
        if not username_recherche:
            return Response(
                {"message": "Le champ usernameRecherche est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            employe_cible = ProfilEmploye.objects.get(
                utilisateur__username=username_recherche, actif=True
            )
        except ProfilEmploye.DoesNotExist:
            return Response({"message": "Employé introuvable."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ModificationEmployePlateformeSerializer(
            employe_cible,
            data=request.data,
            partial=True,
            context={"request": request, "employe_cible": employe_cible},
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Employé plateforme modifié avec succès."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Désactivation de comptes
# ---------------------------------------------------------------------------

class DesactiverMonCompteClientView(BaseAPIView):
    """Permet à un client de désactiver son propre compte."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        utilisateur = request.user
        if not hasattr(utilisateur, "profil_client"):
            return Response(
                {"message": "Seul un client peut désactiver ce compte."},
                status=status.HTTP_403_FORBIDDEN,
            )

        utilisateur.is_active = False
        utilisateur.save()
        logout(request)
        return Response({"message": "Compte client désactivé avec succès."}, status=status.HTTP_200_OK)


class DesactiverEmployeCompagnieView(BaseAPIView):
    """Permet à un chef de compagnie de désactiver un réceptionniste ou contrôleur de sa compagnie."""
    permission_classes = [IsAuthenticated]

    def post(self, request, employe_id):
        try:
            employe_cible = ProfilEmploye.objects.get(id=employe_id, actif=True)
        except ProfilEmploye.DoesNotExist:
            return Response({"message": "Employé introuvable."}, status=status.HTTP_404_NOT_FOUND)

        try:
            profil_chef = request.user.profil_employe
        except ProfilEmploye.DoesNotExist:
            return Response({"message": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        if profil_chef.role != ProfilEmploye.Role.CHEF_COMPAGNIE:
            return Response(
                {"message": "Seul un chef de compagnie peut désactiver cet employé."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if employe_cible.compagnie != profil_chef.compagnie:
            return Response(
                {"message": "Vous ne pouvez désactiver qu'un employé de votre compagnie."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if employe_cible.role not in [ProfilEmploye.Role.RECEPTIONNISTE, ProfilEmploye.Role.CONTROLEUR]:
            return Response(
                {"message": "Vous ne pouvez désactiver que les réceptionnistes et les contrôleurs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        employe_cible.actif = False
        employe_cible.save()
        employe_cible.utilisateur.is_active = False
        employe_cible.utilisateur.save()
        return Response({"message": "Employé de compagnie désactivé avec succès."}, status=status.HTTP_200_OK)


class DesactiverEmployePlateformeView(BaseAPIView):
    """Permet à l'admin plateforme de désactiver un chef, SAV ou comptable (par username)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        username_recherche = request.data.get("usernameRecherche")
        if not username_recherche:
            return Response(
                {"message": "Le champ usernameRecherche est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            employe_cible = ProfilEmploye.objects.get(
                utilisateur__username=username_recherche, actif=True
            )
        except ProfilEmploye.DoesNotExist:
            return Response({"message": "Employé introuvable."}, status=status.HTTP_404_NOT_FOUND)

        try:
            profil_admin = request.user.profil_employe
        except ProfilEmploye.DoesNotExist:
            return Response({"message": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        if profil_admin.role != ProfilEmploye.Role.ADMIN_PLATEFORME:
            return Response(
                {"message": "Seul un administrateur plateforme peut désactiver cet employé."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if employe_cible.role not in [
            ProfilEmploye.Role.CHEF_COMPAGNIE,
            ProfilEmploye.Role.SAV,
            ProfilEmploye.Role.COMPTABLE,
        ]:
            return Response(
                {"message": "Vous ne pouvez désactiver que les chefs de compagnie, le SAV et les comptables."},
                status=status.HTTP_403_FORBIDDEN,
            )

        employe_cible.actif = False
        employe_cible.save()
        employe_cible.utilisateur.is_active = False
        employe_cible.utilisateur.save()
        return Response({"message": "Employé désactivé avec succès."}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Réinitialisation de compte (flux en 3 étapes : demande → vérification → reset)
# ---------------------------------------------------------------------------

class DemandeReinitialisationView(BaseAPIView):
    """Étape 1 — envoie un code à 6 chiffres par email, valable 10 minutes."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DemandeReinitialisationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        code = f"{random.randint(0, 999999):06d}"
        cache.set(f"reset_code:{email}", code, timeout=600)
        send_mail(
            subject="Code de réinitialisation de compte",
            message=(
                "Bonjour,\n\n"
                f"Votre code de réinitialisation est : {code}\n"
                "Ce code expire dans 10 minutes."
            ),
            from_email=None,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response(
            {"message": "Un code de vérification a été envoyé à votre adresse email."},
            status=status.HTTP_200_OK,
        )


class VerifierCodeReinitialisationView(BaseAPIView):
    """Étape 2 — vérifie que le code saisi correspond à celui envoyé par email."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerificationCodeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]
        code_attendu = cache.get(f"reset_code:{email}")

        if code_attendu != code:
            return Response(
                {"message": "Code invalide ou expiré."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Marque le code comme vérifié pour autoriser l'étape 3
        cache.set(f"reset_verified:{email}", True, timeout=600)
        return Response({"message": "Code vérifié avec succès."}, status=status.HTTP_200_OK)


class ReinitialiserCompteView(BaseAPIView):
    """Étape 3 — applique le nouveau username et le nouveau mot de passe."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ReinitialisationCompteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]
        nouveau_username = serializer.validated_data["nouveau_username"]
        nouveau_password = serializer.validated_data["nouveau_password"]

        # Double vérification : code toujours valide ET étape 2 passée
        code_attendu = cache.get(f"reset_code:{email}")
        reset_verifie = cache.get(f"reset_verified:{email}")
        if code_attendu != code or not reset_verifie:
            return Response(
                {"message": "Code invalide ou non vérifié."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            utilisateur = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"message": "Aucun compte associé à cet email."},
                status=status.HTTP_404_NOT_FOUND,
            )

        utilisateur.username = nouveau_username
        utilisateur.set_password(nouveau_password)
        utilisateur.save()

        # Nettoyage du cache une fois la réinitialisation terminée
        cache.delete(f"reset_code:{email}")
        cache.delete(f"reset_verified:{email}")
        return Response(
            {"message": "Le compte a été réinitialisé avec succès."},
            status=status.HTTP_200_OK,
        )
