from rest_framework import serializers
from .models import TicketSAV, MessageSAV


class MessageSAVSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageSAV
        fields = ('id', 'auteur_client', 'contenu', 'cree_le')
        read_only_fields = ('id', 'cree_le')


class TicketSAVSerializer(serializers.ModelSerializer):
    messages = MessageSAVSerializer(many=True, read_only=True)
    client_display = serializers.SerializerMethodField()
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)

    class Meta:
        model = TicketSAV
        fields = (
            'id', 'company', 'profil_client',
            'client_nom', 'client_telephone', 'client_email', 'client_display',
            'sujet', 'description', 'priorite', 'priorite_display',
            'statut', 'statut_display', 'numero_billet',
            'cree_le', 'mis_a_jour_le', 'messages',
        )
        read_only_fields = ('id', 'company', 'cree_le', 'mis_a_jour_le', 'messages')

    def get_client_display(self, obj):
        return obj.nom_client()
