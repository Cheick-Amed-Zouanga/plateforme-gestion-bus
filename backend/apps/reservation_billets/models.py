import uuid

from django.db import models
from django.utils import timezone


def _generer_numero():
    return 'BF-' + uuid.uuid4().hex[:8].upper()


class Reservation(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        CONFIRMEE  = 'CONFIRMEE',  'Confirmée'
        ANNULEE    = 'ANNULEE',    'Annulée'
        EXPIREE    = 'EXPIREE',    'Expirée'

    profil_client = models.ForeignKey('accounts.ProfilClient', on_delete=models.PROTECT, related_name='reservations')
    trajet        = models.ForeignKey('transport.Trajet', on_delete=models.PROTECT, related_name='reservations')
    statut        = models.CharField(max_length=12, choices=Statut.choices, default=Statut.EN_ATTENTE)
    montant_total = models.PositiveIntegerField(default=0)
    devise        = models.CharField(max_length=10, default='XOF')
    cree_le       = models.DateTimeField(default=timezone.now)
    confirme_le   = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name        = 'Réservation'
        verbose_name_plural = 'Réservations'

    def __str__(self):
        return f"Reservation({self.id})"


class Billet(models.Model):
    class Source(models.TextChoices):
        APP     = 'APP',     'Application'
        GUICHET = 'GUICHET', 'Guichet'

    class StatutPaiement(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        PAYE       = 'PAYE',       'Payé'
        REMBOURSE  = 'REMBOURSE',  'Remboursé'

    class StatutBillet(models.TextChoices):
        CONFIRME = 'CONFIRME', 'Confirmé'
        ANNULE   = 'ANNULE',   'Annulé'
        UTILISE  = 'UTILISE',  'Utilisé'

    class ModePaiement(models.TextChoices):
        ESPECES      = 'ESPECES',      'Espèces'
        ORANGE_MONEY = 'ORANGE_MONEY', 'Orange Money'
        MOOV_MONEY   = 'MOOV_MONEY',   'Moov Money'

    # Liens principaux
    reservation   = models.OneToOneField('reservation_billets.Reservation', on_delete=models.CASCADE, related_name='billet', null=True, blank=True)
    trajet        = models.ForeignKey('transport.Trajet',     on_delete=models.PROTECT, related_name='billets',        null=True, blank=True)
    siege         = models.ForeignKey('transport.Siege',      on_delete=models.PROTECT, related_name='billets',        null=True, blank=True)
    arret_depart  = models.ForeignKey('transport.ArretLigne', on_delete=models.PROTECT, related_name='billets_depart', null=True, blank=True)
    arret_arrivee = models.ForeignKey('transport.ArretLigne', on_delete=models.PROTECT, related_name='billets_arrivee',null=True, blank=True)

    # Identifiant unique (= contenu du QR code)
    numero_billet = models.CharField(max_length=30, unique=True, default=_generer_numero)

    # Source & statuts
    source          = models.CharField(max_length=10, choices=Source.choices,        default=Source.GUICHET)
    statut_billet   = models.CharField(max_length=10, choices=StatutBillet.choices,  default=StatutBillet.CONFIRME)
    statut_paiement = models.CharField(max_length=12, choices=StatutPaiement.choices,default=StatutPaiement.EN_ATTENTE)
    mode_paiement   = models.CharField(max_length=15, choices=ModePaiement.choices,  default=ModePaiement.ESPECES)

    # Prix
    prix   = models.PositiveIntegerField(default=0)
    devise = models.CharField(max_length=10, default='XOF')

    # Infos passager (guichet)
    passager_nom              = models.CharField(max_length=100, blank=True)
    passager_prenom           = models.CharField(max_length=100, blank=True)
    passager_telephone        = models.CharField(max_length=30,  blank=True)
    passager_piece_identite   = models.CharField(max_length=50,  blank=True)

    # Employés
    vendu_par  = models.ForeignKey('accounts.ProfilEmploye', on_delete=models.PROTECT, related_name='billets_vendus',  null=True, blank=True)
    scanne_par = models.ForeignKey('accounts.ProfilEmploye', on_delete=models.PROTECT, related_name='billets_scannes', null=True, blank=True)

    # Horodatage
    emis_le   = models.DateTimeField(default=timezone.now)
    scanne_le = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name        = 'Billet'
        verbose_name_plural = 'Billets'
        ordering            = ['-emis_le']

    def __str__(self):
        return f"Billet({self.numero_billet})"

    def nom_passager(self):
        if self.passager_nom or self.passager_prenom:
            return f"{self.passager_prenom} {self.passager_nom}".strip()
        if self.reservation:
            u = self.reservation.profil_client.utilisateur
            return f"{u.first_name} {u.last_name}".strip() or u.username
        return "—"


class Incident(models.Model):
    class TypeIncident(models.TextChoices):
        PASSAGER_SANS_BILLET = 'PASSAGER_SANS_BILLET', 'Passager sans billet'
        CONFLIT_SIEGE        = 'CONFLIT_SIEGE',        'Conflit de siège'
        PROBLEME_BUS         = 'PROBLEME_BUS',         'Problème de bus'
        AUTRE                = 'AUTRE',                'Autre'

    trajet         = models.ForeignKey('transport.Trajet',     on_delete=models.CASCADE,  related_name='incidents')
    signale_par    = models.ForeignKey('accounts.ProfilEmploye',on_delete=models.PROTECT, related_name='incidents_signales')
    arret_concerne = models.ForeignKey('transport.ArretLigne', on_delete=models.SET_NULL, related_name='incidents', null=True, blank=True)

    type_incident   = models.CharField(max_length=25, choices=TypeIncident.choices)
    description     = models.TextField()
    resolution      = models.TextField(blank=True)
    resolu          = models.BooleanField(default=False)
    date_incident   = models.DateTimeField(default=timezone.now)
    date_resolution = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name        = 'Incident'
        verbose_name_plural = 'Incidents'
        ordering            = ['-date_incident']

    def __str__(self):
        return f"Incident({self.get_type_incident_display()}, trajet={self.trajet_id})"


class RapportTrajet(models.Model):
    trajet               = models.OneToOneField('transport.Trajet', on_delete=models.CASCADE,  related_name='rapport')
    soumis_par           = models.ForeignKey('accounts.ProfilEmploye', on_delete=models.PROTECT, related_name='rapports_soumis')

    nb_passagers_attendus = models.IntegerField()
    nb_passagers_reels    = models.IntegerField()
    nb_billets_bord       = models.IntegerField(default=0)
    nb_absents            = models.IntegerField(default=0)

    heure_depart_reelle  = models.DateTimeField(null=True, blank=True)
    heure_arrivee_reelle = models.DateTimeField(null=True, blank=True)
    notes                = models.TextField(blank=True)
    date_soumission      = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name        = 'Rapport de trajet'
        verbose_name_plural = 'Rapports de trajet'

    def __str__(self):
        return f"Rapport(trajet={self.trajet_id})"
