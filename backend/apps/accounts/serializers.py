import random
import re
from datetime import date

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import ProfilClient, ContactConfiance, ProfilEmploye
from apps.transport.models import CompagnieTransport


class InscriptionClientSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    first_name = serializers.CharField(max_length=150, required=True)
    last_name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)

    telephone = serializers.CharField(max_length=30, required=True)
    date_naissance = serializers.DateField(required=True)

    contact_nom = serializers.CharField(required=False, allow_blank=True)
    contact_telephone = serializers.CharField(required=False, allow_blank=True)
    contact_relation = serializers.CharField(required=False, allow_blank=True)

    def validate_password(self, value):
        if len(value) < 7 or len(value) > 20:
            raise serializers.ValidationError(
                "Le mot de passe doit contenir entre 7 et 20 caractères."
            )

        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError(
                "Le mot de passe doit contenir au moins une majuscule."
            )

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError(
                "Le mot de passe doit contenir au moins un caractère spécial."
            )

        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "Ce nom d'utilisateur existe déjà."
            )
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Cet email existe déjà."
            )
        return value

    def validate(self, data):
        date_naissance = data.get("date_naissance")

        aujourd_hui = date.today()

        age = aujourd_hui.year - date_naissance.year - (
            (aujourd_hui.month, aujourd_hui.day) <
            (date_naissance.month, date_naissance.day)
        )

        if age < 18:
            if not data.get("contact_nom") or not data.get("contact_telephone"):
                raise serializers.ValidationError(
                    "Un contact de confiance est obligatoire pour les mineurs."
                )

        return data

    def create(self, validated_data):
        contact_nom = validated_data.pop("contact_nom", None)
        contact_telephone = validated_data.pop("contact_telephone", None)
        contact_relation = validated_data.pop("contact_relation", None)

        telephone = validated_data.pop("telephone")
        date_naissance = validated_data.pop("date_naissance")
        mot_de_passe = validated_data.pop("password")

        utilisateur = User.objects.create_user(
            username=validated_data["username"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            email=validated_data["email"],
            password=mot_de_passe,
        )

        profil = ProfilClient.objects.create(
            utilisateur=utilisateur,
            telephone=telephone,
            date_naissance=date_naissance,
        )

        if contact_nom and contact_telephone:
            ContactConfiance.objects.create(
                profil_client=profil,
                nom=contact_nom,
                telephone=contact_telephone,
                relation=contact_relation or ContactConfiance.Relation.AUTRE,
            )

        return utilisateur


class BaseCreationEmployeSerializer(serializers.Serializer):
    nom = serializers.CharField(max_length=150, required=True)
    prenom = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    tel = serializers.CharField(max_length=30, required=True)
    username = serializers.CharField(max_length=150, required=True)
    password = serializers.CharField(write_only=True)
    confirmationPassword = serializers.CharField(write_only=True, required=True)

    def validate_password(self, value):
        if len(value) < 7:
            raise serializers.ValidationError(
                "Le mot de passe doit contenir au moins 7 caractères."
            )

        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError(
                "Le mot de passe doit contenir au moins une majuscule."
            )

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError(
                "Le mot de passe doit contenir au moins un caractère spécial."
            )

        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur existe déjà.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email existe déjà.")
        return value

    def validate(self, data):
        if data.get("password") != data.get("confirmationPassword"):
            raise serializers.ValidationError(
                {"confirmationPassword": "Les mots de passe ne correspondent pas."}
            )
        return data


class CreationSAVSerializer(BaseCreationEmployeSerializer):
    def validate(self, data):
        data = super().validate(data)

        request = self.context.get("request")
        utilisateur_connecte = request.user

        try:
            profil_employe = utilisateur_connecte.profil_employe
        except ProfilEmploye.DoesNotExist:
            raise serializers.ValidationError(
                "Seul un administrateur plateforme peut créer un agent SAV."
            )

        if profil_employe.role != ProfilEmploye.Role.ADMIN_PLATEFORME:
            raise serializers.ValidationError(
                "Seul un administrateur plateforme peut créer un agent SAV."
            )

        return data

    def create(self, validated_data):
        mot_de_passe = validated_data.pop("password")
        validated_data.pop("confirmationPassword", None)
        telephone = validated_data.pop("tel")

        utilisateur = User.objects.create_user(
            username=validated_data["username"],
            first_name=validated_data["prenom"],
            last_name=validated_data["nom"],
            email=validated_data["email"],
            password=mot_de_passe,
        )

        ProfilEmploye.objects.create(
            utilisateur=utilisateur,
            compagnie=None,
            role=ProfilEmploye.Role.SAV,
            telephone=telephone,
            actif=True,
        )

        return utilisateur


class CreationChefCompagnieSerializer(BaseCreationEmployeSerializer):
    nomCompagnie = serializers.CharField(max_length=150, required=True)

    def validate(self, data):
        data = super().validate(data)

        request = self.context.get("request")
        utilisateur_connecte = request.user

        try:
            profil_employe = utilisateur_connecte.profil_employe
        except ProfilEmploye.DoesNotExist:
            raise serializers.ValidationError(
                "Seul un administrateur plateforme peut créer un chef de compagnie."
            )

        if profil_employe.role != ProfilEmploye.Role.ADMIN_PLATEFORME:
            raise serializers.ValidationError(
                "Seul un administrateur plateforme peut créer un chef de compagnie."
            )

        return data

    def create(self, validated_data):
        nom_compagnie = validated_data.pop("nomCompagnie")
        mot_de_passe = validated_data.pop("password")
        validated_data.pop("confirmationPassword", None)
        telephone = validated_data.pop("tel")

        compagnie, _ = CompagnieTransport.objects.get_or_create(
            nom=nom_compagnie.strip()
        )

        utilisateur = User.objects.create_user(
            username=validated_data["username"],
            first_name=validated_data["prenom"],
            last_name=validated_data["nom"],
            email=validated_data["email"],
            password=mot_de_passe,
        )

        ProfilEmploye.objects.create(
            utilisateur=utilisateur,
            compagnie=compagnie,
            role=ProfilEmploye.Role.CHEF_COMPAGNIE,
            telephone=telephone,
            actif=True,
        )

        return utilisateur


class CreationComptablePlateformeSerializer(BaseCreationEmployeSerializer):
    def validate(self, data):
        data = super().validate(data)

        request = self.context.get("request")
        utilisateur_connecte = request.user

        try:
            profil_admin = utilisateur_connecte.profil_employe
        except ProfilEmploye.DoesNotExist:
            raise serializers.ValidationError(
                "Seul un administrateur plateforme peut créer un comptable plateforme."
            )

        if profil_admin.role != ProfilEmploye.Role.ADMIN_PLATEFORME:
            raise serializers.ValidationError(
                "Seul un administrateur plateforme peut créer un comptable plateforme."
            )

        return data

    def create(self, validated_data):
        mot_de_passe = validated_data.pop("password")
        validated_data.pop("confirmationPassword", None)
        telephone = validated_data.pop("tel")

        utilisateur = User.objects.create_user(
            username=validated_data["username"],
            first_name=validated_data["prenom"],
            last_name=validated_data["nom"],
            email=validated_data["email"],
            password=mot_de_passe,
        )

        ProfilEmploye.objects.create(
            utilisateur=utilisateur,
            compagnie=None,
            role=ProfilEmploye.Role.COMPTABLE,
            telephone=telephone,
            actif=True,
        )

        return utilisateur


class CreationEmployeCompagnieSerializer(BaseCreationEmployeSerializer):
    role = serializers.ChoiceField(
        choices=[
            ProfilEmploye.Role.CONTROLEUR,
            ProfilEmploye.Role.RECEPTIONNISTE,
        ],
        required=True,
    )

    def validate(self, data):
        request = self.context.get("request")
        utilisateur_connecte = request.user

        try:
            profil_employe = utilisateur_connecte.profil_employe
        except ProfilEmploye.DoesNotExist:
            raise serializers.ValidationError(
                "Seul un chef de compagnie peut créer un employé."
            )

        if profil_employe.role != ProfilEmploye.Role.CHEF_COMPAGNIE:
            raise serializers.ValidationError(
                "Seul un chef de compagnie peut créer un employé."
            )

        if profil_employe.compagnie is None:
            raise serializers.ValidationError(
                "Le chef connecté n'est rattaché à aucune compagnie."
            )

        data = super().validate(data)
        return data

    def create(self, validated_data):
        mot_de_passe = validated_data.pop("password")
        validated_data.pop("confirmationPassword", None)
        telephone = validated_data.pop("tel")
        role = validated_data.pop("role")

        chef = self.context["request"].user.profil_employe

        utilisateur = User.objects.create_user(
            username=validated_data["username"],
            first_name=validated_data["prenom"],
            last_name=validated_data["nom"],
            email=validated_data["email"],
            password=mot_de_passe,
        )

        ProfilEmploye.objects.create(
            utilisateur=utilisateur,
            compagnie=chef.compagnie,
            role=role,
            telephone=telephone,
            actif=True,
        )

        return utilisateur


class ConnexionSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        utilisateur = authenticate(
            username=data.get("username"),
            password=data.get("password"),
        )

        if utilisateur is None:
            raise serializers.ValidationError("Nom d'utilisateur ou mot de passe incorrect.")

        if not utilisateur.is_active:
            raise serializers.ValidationError("Ce compte est désactivé.")

        data["utilisateur"] = utilisateur
        return data


class ProfilConnecteSerializer(serializers.ModelSerializer):
    nom = serializers.SerializerMethodField()
    prenom = serializers.SerializerMethodField()
    email = serializers.EmailField()
    role = serializers.SerializerMethodField()
    compagnie = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "nom", "prenom", "email", "role", "compagnie"]

    def get_nom(self, obj):
        return obj.last_name

    def get_prenom(self, obj):
        return obj.first_name

    def get_role(self, obj):
        if hasattr(obj, "profil_employe") and obj.profil_employe:
          return obj.profil_employe.role
        if hasattr(obj, "profil_client"):
          return "client"
          return None

    def get_compagnie(self, obj):
        if hasattr(obj, "profil_employe") and obj.profil_employe.compagnie:
            return obj.profil_employe.compagnie.nom
        return None


class ModificationClientSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    telephone = serializers.CharField(required=False)

    def update(self, instance, validated_data):
        for champ in ["first_name", "last_name", "email"]:
            if champ in validated_data:
                setattr(instance, champ, validated_data[champ])
        instance.save()

        if hasattr(instance, "profil_client") and "telephone" in validated_data:
            instance.profil_client.telephone = validated_data["telephone"]
            instance.profil_client.save()

        return instance


class ModificationMonProfilChefSerializer(serializers.Serializer):
    nom = serializers.CharField(required=False)
    prenom = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    tel = serializers.CharField(required=False)

    def update(self, instance, validated_data):
        try:
            profil_chef = instance.profil_employe
        except ProfilEmploye.DoesNotExist:
            raise serializers.ValidationError(
                "Seul un chef de compagnie peut modifier son profil."
            )

        if profil_chef.role != ProfilEmploye.Role.CHEF_COMPAGNIE:
            raise serializers.ValidationError(
                "Seul un chef de compagnie peut modifier son profil."
            )

        nom = validated_data.get("nom")
        prenom = validated_data.get("prenom")
        email = validated_data.get("email")
        tel = validated_data.get("tel")

        if nom is not None:
            instance.last_name = nom
        if prenom is not None:
            instance.first_name = prenom
        if email is not None:
            instance.email = email
        instance.save()

        if tel is not None:
            profil_chef.telephone = tel
            profil_chef.save()

        return instance


class ModificationEmployeCompagnieSerializer(serializers.Serializer):
    nom = serializers.CharField(required=False)
    prenom = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    tel = serializers.CharField(required=False)

    def validate(self, data):
        request = self.context.get("request")
        employe_cible = self.context.get("employe_cible")

        try:
            profil_chef = request.user.profil_employe
        except ProfilEmploye.DoesNotExist:
            raise serializers.ValidationError(
                "Seul un chef de compagnie peut modifier un employé."
            )

        if profil_chef.role != ProfilEmploye.Role.CHEF_COMPAGNIE:
            raise serializers.ValidationError(
                "Seul un chef de compagnie peut modifier un employé."
            )

        if employe_cible.compagnie != profil_chef.compagnie:
            raise serializers.ValidationError(
                "Vous ne pouvez modifier qu'un employé de votre compagnie."
            )

        if employe_cible.role not in [
            ProfilEmploye.Role.RECEPTIONNISTE,
            ProfilEmploye.Role.CONTROLEUR,
        ]:
            raise serializers.ValidationError(
                "Vous ne pouvez modifier que les réceptionnistes et les contrôleurs."
            )

        return data

    def update(self, instance, validated_data):
        utilisateur = instance.utilisateur

        nom = validated_data.get("nom")
        prenom = validated_data.get("prenom")
        email = validated_data.get("email")
        tel = validated_data.get("tel")

        if nom is not None:
            utilisateur.last_name = nom
        if prenom is not None:
            utilisateur.first_name = prenom
        if email is not None:
            utilisateur.email = email
        utilisateur.save()

        if tel is not None:
            instance.telephone = tel
            instance.save()

        return instance


class ModificationEmployePlateformeSerializer(serializers.Serializer):
    nom = serializers.CharField(required=False)
    prenom = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    tel = serializers.CharField(required=False)

    def validate(self, data):
        request = self.context.get("request")
        employe_cible = self.context.get("employe_cible")

        try:
            profil_admin = request.user.profil_employe
        except ProfilEmploye.DoesNotExist:
            raise serializers.ValidationError(
                "Seul un administrateur plateforme peut modifier un employé plateforme."
            )

        if profil_admin.role != ProfilEmploye.Role.ADMIN_PLATEFORME:
            raise serializers.ValidationError(
                "Seul un administrateur plateforme peut modifier un employé plateforme."
            )

        if employe_cible.role not in [
            ProfilEmploye.Role.CHEF_COMPAGNIE,
            ProfilEmploye.Role.SAV,
            ProfilEmploye.Role.COMPTABLE,
        ]:
            raise serializers.ValidationError(
                "Vous ne pouvez modifier que les chefs de compagnie, le SAV et les comptables."
            )

        return data

    def update(self, instance, validated_data):
        utilisateur = instance.utilisateur

        nom = validated_data.get("nom")
        prenom = validated_data.get("prenom")
        email = validated_data.get("email")
        tel = validated_data.get("tel")

        if nom is not None:
            utilisateur.last_name = nom
        if prenom is not None:
            utilisateur.first_name = prenom
        if email is not None:
            utilisateur.email = email
        utilisateur.save()

        if tel is not None:
            instance.telephone = tel
            instance.save()

        return instance


class DemandeReinitialisationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        value = value.lower().strip()
        try:
            utilisateur = User.objects.get(email__iexact=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Aucun compte actif n'est associé à cette adresse email."
            )

        if not utilisateur.is_active:
            raise serializers.ValidationError("Ce compte est désactivé.")
        return value


class VerificationCodeSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(max_length=6, required=True)

    def validate_email(self, value):
        return value.lower().strip()

    def validate_code(self, value):
        code = value.strip()
        if not code.isdigit() or len(code) != 6:
            raise serializers.ValidationError(
                "Le code doit contenir exactement 6 chiffres."
            )
        return code


class ReinitialisationCompteSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(max_length=6, required=True)
    nouveau_username = serializers.CharField(max_length=150, required=True)
    nouveau_password = serializers.CharField(write_only=True, required=True)

    def validate_email(self, value):
        return value.lower().strip()

    def validate_code(self, value):
        code = value.strip()
        if not code.isdigit() or len(code) != 6:
            raise serializers.ValidationError(
                "Le code doit contenir exactement 6 chiffres."
            )
        return code

    def validate_nouveau_username(self, value):
        email = self.initial_data.get("email", "")
        utilisateur = User.objects.filter(username=value).exclude(email__iexact=email).first()
        if utilisateur is not None:
            raise serializers.ValidationError("Ce nom d'utilisateur existe déjà.")
        return value

    def validate_nouveau_password(self, value):
        if len(value) < 7 or len(value) > 20:
            raise serializers.ValidationError(
                "Le mot de passe doit contenir entre 7 et 20 caractères."
            )
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError(
                "Le mot de passe doit contenir au moins une majuscule."
            )
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError(
                "Le mot de passe doit contenir au moins un caractère spécial."
            )
        return value