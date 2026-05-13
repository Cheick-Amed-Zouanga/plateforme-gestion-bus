import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('reservation_billets', '0002_billet_scanne_par'),
        ('transport', '0002_tarif_par_segment'),
        ('accounts', '0003_profilemploye_telephone'),
    ]

    operations = [
        # ── Billet : supprimer anciens champs ────────────────────────────────
        migrations.RemoveField(model_name='billet', name='code_qr'),
        migrations.RemoveField(model_name='billet', name='statut'),

        # ── Billet : reservation nullable ────────────────────────────────────
        migrations.AlterField(
            model_name='billet',
            name='reservation',
            field=models.OneToOneField(
                blank=True, null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='billet',
                to='reservation_billets.reservation',
            ),
        ),

        # ── Billet : identifiant unique ───────────────────────────────────────
        migrations.AddField(
            model_name='billet',
            name='numero_billet',
            field=models.CharField(max_length=30, null=True),
        ),
        migrations.AlterField(
            model_name='billet',
            name='numero_billet',
            field=models.CharField(max_length=30, unique=True, default=''),
            preserve_default=False,
        ),

        # ── Billet : liens trajet / arrêts ────────────────────────────────────
        migrations.AddField(
            model_name='billet', name='trajet',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                                    related_name='billets', to='transport.trajet'),
        ),
        migrations.AddField(
            model_name='billet', name='arret_depart',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                                    related_name='billets_depart', to='transport.arretligne'),
        ),
        migrations.AddField(
            model_name='billet', name='arret_arrivee',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                                    related_name='billets_arrivee', to='transport.arretligne'),
        ),

        # ── Billet : source et statuts ────────────────────────────────────────
        migrations.AddField(
            model_name='billet', name='source',
            field=models.CharField(choices=[('APP','Application'),('GUICHET','Guichet')],
                                   default='GUICHET', max_length=10),
        ),
        migrations.AddField(
            model_name='billet', name='statut_billet',
            field=models.CharField(choices=[('CONFIRME','Confirmé'),('ANNULE','Annulé'),('UTILISE','Utilisé')],
                                   default='CONFIRME', max_length=10),
        ),
        migrations.AddField(
            model_name='billet', name='statut_paiement',
            field=models.CharField(choices=[('EN_ATTENTE','En attente'),('PAYE','Payé'),('REMBOURSE','Remboursé')],
                                   default='EN_ATTENTE', max_length=12),
        ),
        migrations.AddField(
            model_name='billet', name='mode_paiement',
            field=models.CharField(choices=[('ESPECES','Espèces'),('ORANGE_MONEY','Orange Money'),('MOOV_MONEY','Moov Money')],
                                   default='ESPECES', max_length=15),
        ),

        # ── Billet : prix ─────────────────────────────────────────────────────
        migrations.AddField(model_name='billet', name='prix',   field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name='billet', name='devise', field=models.CharField(default='XOF', max_length=10)),

        # ── Billet : infos passager ───────────────────────────────────────────
        migrations.AddField(model_name='billet', name='passager_nom',       field=models.CharField(blank=True, max_length=100)),
        migrations.AddField(model_name='billet', name='passager_prenom',    field=models.CharField(blank=True, max_length=100)),
        migrations.AddField(model_name='billet', name='passager_telephone', field=models.CharField(blank=True, max_length=30)),

        # ── Billet : vendeur ──────────────────────────────────────────────────
        migrations.AddField(
            model_name='billet', name='vendu_par',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                                    related_name='billets_vendus', to='accounts.profilemploye'),
        ),

        # ── Incident ──────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='Incident',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type_incident', models.CharField(max_length=25, choices=[
                    ('PASSAGER_SANS_BILLET','Passager sans billet'),
                    ('CONFLIT_SIEGE','Conflit de siège'),
                    ('PROBLEME_BUS','Problème de bus'),
                    ('AUTRE','Autre'),
                ])),
                ('description',     models.TextField()),
                ('resolution',      models.TextField(blank=True)),
                ('resolu',          models.BooleanField(default=False)),
                ('date_incident',   models.DateTimeField(default=django.utils.timezone.now)),
                ('date_resolution', models.DateTimeField(blank=True, null=True)),
                ('trajet',       models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,  related_name='incidents',         to='transport.trajet')),
                ('signale_par',  models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,  related_name='incidents_signales',to='accounts.profilemploye')),
                ('arret_concerne',models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='incidents', to='transport.arretligne')),
            ],
            options={'verbose_name':'Incident','verbose_name_plural':'Incidents','ordering':['-date_incident']},
        ),

        # ── RapportTrajet ─────────────────────────────────────────────────────
        migrations.CreateModel(
            name='RapportTrajet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nb_passagers_attendus', models.IntegerField()),
                ('nb_passagers_reels',    models.IntegerField()),
                ('nb_billets_bord',       models.IntegerField(default=0)),
                ('nb_absents',            models.IntegerField(default=0)),
                ('heure_depart_reelle',   models.DateTimeField(blank=True, null=True)),
                ('heure_arrivee_reelle',  models.DateTimeField(blank=True, null=True)),
                ('notes',                 models.TextField(blank=True)),
                ('date_soumission',       models.DateTimeField(default=django.utils.timezone.now)),
                ('trajet',     models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='rapport',        to='transport.trajet')),
                ('soumis_par', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,    related_name='rapports_soumis',to='accounts.profilemploye')),
            ],
            options={'verbose_name':'Rapport de trajet','verbose_name_plural':'Rapports de trajet'},
        ),
    ]
