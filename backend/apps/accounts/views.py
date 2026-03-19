import random

from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return


class BaseAPIView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]


class InscriptionClientView(BaseAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InscriptionClientSerializer(data=request.data)
        if serializer.is_valid():
            utilisateur = serializer.save()
            return Response(
                {
                    "message": "Inscription réussie.",
                    "username": utilisateur.username,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConnexionView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = ConnexionSerializer(data=request.data)
        if serializer.is_valid():
            utilisateur = serializer.validated_data["utilisateur"]
            login(request, utilisateur)
            return Response(
                {
                    "message": "Connexion réussie.",
                    "username": utilisateur.username,
                    "role": ProfilConnecteSerializer(utilisateur).data.get("role"),
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreationSAVView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreationSAVSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            utilisateur = serializer.save()
            return Response(
                {
                    "message": "Agent SAV créé avec succès.",
                    "username": utilisateur.username,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreationComptablePlateformeView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreationComptablePlateformeSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            utilisateur = serializer.save()
            return Response(
                {
                    "message": "Comptable plateforme créé avec succès.",
                    "username": utilisateur.username,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreationChefCompagnieView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreationChefCompagnieSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            utilisateur = serializer.save()
            return Response(
                {
                    "message": "Chef de compagnie créé avec succès.",
                    "username": utilisateur.username,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreationEmployeCompagnieView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreationEmployeCompagnieSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            utilisateur = serializer.save()
            return Response(
                {
                    "message": "Employé de compagnie créé avec succès.",
                    "username": utilisateur.username,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfilConnecteView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfilConnecteSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DeconnexionView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"message": "Déconnexion réussie."}, status=status.HTTP_200_OK)


class ModifierClientView(BaseAPIView):
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
            return Response(
                {"message": "Profil client modifié avec succès."},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ModifierMonProfilChefView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = ModificationMonProfilChefSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Profil du chef modifié avec succès."},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ModifierEmployeCompagnieView(BaseAPIView):
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
            return Response(
                {"message": "Employé de compagnie modifié avec succès."},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ModifierEmployePlateformeView(BaseAPIView):
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
            return Response(
                {"message": "Employé plateforme modifié avec succès."},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DesactiverMonCompteClientView(BaseAPIView):
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
        return Response(
            {"message": "Compte client désactivé avec succès."},
            status=status.HTTP_200_OK,
        )


class DesactiverEmployeCompagnieView(BaseAPIView):
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
        if employe_cible.role not in [
            ProfilEmploye.Role.RECEPTIONNISTE,
            ProfilEmploye.Role.CONTROLEUR,
        ]:
            return Response(
                {"message": "Vous ne pouvez désactiver que les réceptionnistes et les contrôleurs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        employe_cible.actif = False
        employe_cible.save()
        employe_cible.utilisateur.is_active = False
        employe_cible.utilisateur.save()
        return Response(
            {"message": "Employé de compagnie désactivé avec succès."},
            status=status.HTTP_200_OK,
        )


class DesactiverEmployePlateformeView(BaseAPIView):
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


class DemandeReinitialisationView(BaseAPIView):
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

        cache.set(f"reset_verified:{email}", True, timeout=600)
        return Response({"message": "Code vérifié avec succès."}, status=status.HTTP_200_OK)


class ReinitialiserCompteView(BaseAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ReinitialisationCompteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]
        nouveau_username = serializer.validated_data["nouveau_username"]
        nouveau_password = serializer.validated_data["nouveau_password"]

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

        cache.delete(f"reset_code:{email}")
        cache.delete(f"reset_verified:{email}")
        return Response(
            {"message": "Le compte a été réinitialisé avec succès."},
            status=status.HTTP_200_OK,
        )