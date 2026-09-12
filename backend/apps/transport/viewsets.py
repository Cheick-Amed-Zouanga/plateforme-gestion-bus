from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Bus, Ligne, Trajet, Tarif
from .serializers import (
    BusSerializer, CreationBusSerializer, ModificationBusSerializer,
    LigneListSerializer, LigneDetailSerializer, CreationLigneCompleteSerializer,
    TrajetSerializer, CreationTrajetSerializer, ModificationTrajetSerializer,
    TarifSerializer, CreationTarifSerializer, ModificationTarifSerializer,
)
from apps.iam.models import Company


class CompanyFilterMixin:
    """Mixin pour filtrer automatiquement par company (multi-tenant)"""
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # Super Admin Central (company=NULL) peut voir toutes les compagnies
        if user.is_superuser and user.company_id is None:
            return queryset

        # Utilisateurs avec une company ne voient que leur company
        if user.company_id:
            return queryset.filter(company_id=user.company_id)

        # Utilisateurs sans company ne voient rien
        return queryset.none()

    def get_company(self):
        """Retourner la company de l'utilisateur courant"""
        user = self.request.user
        if user.company_id:
            return user.company
        elif user.is_superuser:
            # Pour Super Admin, essayer de récupérer desde les params
            company_id = self.request.query_params.get('company_id')
            if company_id:
                return Company.objects.get(id=company_id)
        return None


class BusViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    """CRUD pour les Bus avec multi-tenant"""
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['actif', 'type_bus']
    search_fields = ['immatriculation']
    ordering_fields = ['immatriculation', 'capacite']
    ordering = ['immatriculation']

    def get_queryset(self):
        return super().get_queryset()

    def create(self, request, *args, **kwargs):
        """Créer un bus - multi-tenant"""
        if not request.user.has_permission('bus.create'):
            return Response(
                {'detail': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )

        company = self.get_company()
        if not company:
            return Response(
                {'detail': 'Aucune compagnie assignée'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CreationBusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        bus = Bus.objects.create(
            company=company,
            **serializer.validated_data
        )

        return Response(
            BusSerializer(bus).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """Modifier un bus"""
        if not request.user.has_permission('bus.update'):
            return Response(
                {'detail': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )

        bus = self.get_object()
        serializer = ModificationBusSerializer(data=request.data, context={'bus': bus})
        serializer.is_valid(raise_exception=True)

        for field, value in serializer.validated_data.items():
            setattr(bus, field, value)
        bus.save()

        return Response(BusSerializer(bus).data)

    def destroy(self, request, *args, **kwargs):
        """Supprimer un bus"""
        if not request.user.has_permission('bus.delete'):
            return Response(
                {'detail': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class LigneViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    """CRUD pour les Lignes avec multi-tenant"""
    queryset = Ligne.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['active']
    search_fields = ['nom', 'code']
    ordering_fields = ['date_creation', 'nom']
    ordering = ['-date_creation']

    def get_queryset(self):
        return super().get_queryset()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LigneDetailSerializer
        return LigneListSerializer

    def create(self, request, *args, **kwargs):
        """Créer une ligne - multi-tenant"""
        if not request.user.has_permission('trajet.create'):
            return Response(
                {'detail': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )

        company = self.get_company()
        if not company:
            return Response(
                {'detail': 'Aucune compagnie assignée'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CreationLigneCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Créer la ligne
        ligne = Ligne.objects.create(
            company=company,
            nom=serializer.validated_data['nom'],
            code=f"{company.slug}-{Ligne.objects.filter(company=company).count() + 1}",
            description=serializer.validated_data.get('description', ''),
        )

        return Response(
            LigneDetailSerializer(ligne).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """Modifier une ligne"""
        if not request.user.has_permission('trajet.update'):
            return Response(
                {'detail': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )

        ligne = self.get_object()
        serializer = ModificationLigneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        for field, value in serializer.validated_data.items():
            setattr(ligne, field, value)
        ligne.save()

        return Response(LigneDetailSerializer(ligne).data)

    def destroy(self, request, *args, **kwargs):
        """Supprimer une ligne"""
        if not request.user.has_permission('trajet.delete'):
            return Response(
                {'detail': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class TrajetViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    """CRUD pour les Trajets avec multi-tenant"""
    queryset = Trajet.objects.all()
    serializer_class = TrajetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'ligne']
    search_fields = ['ligne__code', 'bus__immatriculation']
    ordering_fields = ['depart_prevu', 'created_at']
    ordering = ['-depart_prevu']

    def get_queryset(self):
        return super().get_queryset()

    def create(self, request, *args, **kwargs):
        """Créer un trajet - multi-tenant"""
        if not request.user.has_permission('trajet.create'):
            return Response(
                {'detail': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )

        company = self.get_company()
        if not company:
            return Response(
                {'detail': 'Aucune compagnie assignée'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CreationTrajetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        trajet = Trajet.objects.create(
            company=company,
            **serializer.validated_data
        )

        return Response(
            TrajetSerializer(trajet).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """Modifier un trajet"""
        if not request.user.has_permission('trajet.update'):
            return Response(
                {'detail': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )

        trajet = self.get_object()
        serializer = ModificationTrajetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        for field, value in serializer.validated_data.items():
            setattr(trajet, field, value)
        trajet.save()

        return Response(TrajetSerializer(trajet).data)

    def destroy(self, request, *args, **kwargs):
        """Supprimer un trajet"""
        if not request.user.has_permission('trajet.delete'):
            return Response(
                {'detail': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class TarifViewSet(CompanyFilterMixin, viewsets.ModelViewSet):
    """CRUD pour les Tarifs avec multi-tenant"""
    queryset = Tarif.objects.all()
    serializer_class = TarifSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type_bus', 'ligne']
    search_fields = ['ligne__code']
    ordering_fields = ['prix', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return super().get_queryset()

    def create(self, request, *args, **kwargs):
        """Créer un tarif - multi-tenant"""
        if not request.user.has_permission('tarif.create'):
            return Response(
                {'detail': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )

        company = self.get_company()
        if not company:
            return Response(
                {'detail': 'Aucune compagnie assignée'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CreationTarifSerializer(data=request.data, context={'company': company})
        serializer.is_valid(raise_exception=True)

        tarif = Tarif.objects.create(
            company=company,
            **serializer.validated_data
        )

        return Response(
            TarifSerializer(tarif).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """Modifier un tarif"""
        if not request.user.has_permission('tarif.update'):
            return Response(
                {'detail': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )

        tarif = self.get_object()
        serializer = ModificationTarifSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        for field, value in serializer.validated_data.items():
            setattr(tarif, field, value)
        tarif.save()

        return Response(TarifSerializer(tarif).data)

    def destroy(self, request, *args, **kwargs):
        """Supprimer un tarif"""
        if not request.user.has_permission('tarif.delete'):
            return Response(
                {'detail': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
