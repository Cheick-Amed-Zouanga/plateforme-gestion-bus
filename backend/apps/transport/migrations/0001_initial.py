from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name='CompagnieTransport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=150, unique=True)),
                ('description', models.TextField(blank=True)),
            ],
            options={'verbose_name': 'Compagnie de transport', 'verbose_name_plural': 'Compagnies de transport'},
        ),
        migrations.CreateModel(
            name='Bus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('immatriculation', models.CharField(max_length=50, unique=True)),
                ('type_bus', models.CharField(choices=[('STANDARD', 'Standard'), ('VIP', 'VIP')], default='STANDARD', max_length=20)),
                ('capacite', models.PositiveIntegerField(default=0)),
                ('actif', models.BooleanField(default=True)),
                ('compagnie', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bus', to='transport.compagnietransport')),
            ],
            options={'verbose_name': 'Bus', 'verbose_name_plural': 'Bus'},
        ),
        migrations.CreateModel(
            name='Siege',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('numero', models.CharField(max_length=10)),
                ('bus', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sieges', to='transport.bus')),
            ],
            options={'verbose_name': 'Siège', 'verbose_name_plural': 'Sièges'},
        ),
        migrations.AddConstraint(
            model_name='siege',
            constraint=models.UniqueConstraint(fields=['bus', 'numero'], name='uniq_siege_par_bus'),
        ),
        migrations.CreateModel(
            name='Ligne',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=100)),
                ('code', models.CharField(max_length=20, unique=True)),
                ('description', models.TextField(blank=True)),
                ('active', models.BooleanField(default=True)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('compagnie', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lignes', to='transport.compagnietransport')),
            ],
            options={'verbose_name': 'Ligne', 'verbose_name_plural': 'Lignes'},
        ),
        migrations.CreateModel(
            name='ArretLigne',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ordre', models.IntegerField()),
                ('ville', models.CharField(max_length=100)),
                ('latitude', models.FloatField()),
                ('longitude', models.FloatField()),
                ('distance_depuis_precedent', models.FloatField(default=0)),
                ('duree_route_depuis_precedent', models.IntegerField(default=0)),
                ('duree_montee_passagers', models.IntegerField(default=0)),
                ('duree_descente_passagers', models.IntegerField(default=0)),
                ('duree_pause', models.IntegerField(default=0)),
                ('duree_arret_total', models.IntegerField(default=0)),
                ('temps_depuis_depart', models.IntegerField(default=0)),
                ('est_depart', models.BooleanField(default=False)),
                ('est_arrivee', models.BooleanField(default=False)),
                ('ligne', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='arrets', to='transport.ligne')),
            ],
            options={'verbose_name': 'Arrêt de ligne', 'verbose_name_plural': 'Arrêts de ligne', 'ordering': ['ordre']},
        ),
        migrations.AddConstraint(
            model_name='arretligne',
            constraint=models.UniqueConstraint(fields=['ligne', 'ordre'], name='uniq_arret_ordre_ligne'),
        ),
        migrations.CreateModel(
            name='Trajet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('depart_prevu', models.DateTimeField()),
                ('arrivee_prevue', models.DateTimeField(blank=True, null=True)),
                ('statut', models.CharField(choices=[('PLANIFIE', 'Planifié'), ('EN_COURS', 'En cours'), ('TERMINE', 'Terminé'), ('ANNULE', 'Annulé')], default='PLANIFIE', max_length=15)),
                ('bus', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='trajets', to='transport.bus')),
                ('compagnie', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='trajets', to='transport.compagnietransport')),
                ('ligne', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='trajets', to='transport.ligne')),
            ],
            options={'verbose_name': 'Trajet', 'verbose_name_plural': 'Trajets'},
        ),
        migrations.CreateModel(
            name='Tarif',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type_bus', models.CharField(choices=[('STANDARD', 'Standard'), ('VIP', 'VIP')], default='STANDARD', max_length=20)),
                ('prix', models.PositiveIntegerField(help_text='Montant en XOF.')),
                ('devise', models.CharField(default='XOF', max_length=10)),
                ('compagnie', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tarifs', to='transport.compagnietransport')),
                ('ligne', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tarifs', to='transport.ligne')),
            ],
            options={'verbose_name': 'Tarif', 'verbose_name_plural': 'Tarifs'},
        ),
        migrations.AddConstraint(
            model_name='tarif',
            constraint=models.UniqueConstraint(fields=['compagnie', 'ligne', 'type_bus'], name='uniq_tarif_compagnie_ligne_type'),
        ),
    ]
