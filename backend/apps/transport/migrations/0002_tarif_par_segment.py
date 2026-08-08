from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('transport', '0001_initial'),
    ]

    operations = [
        # 1. Supprimer l'ancienne contrainte unique
        migrations.RemoveConstraint(
            model_name='tarif',
            name='uniq_tarif_compagnie_ligne_type',
        ),

        # 2. Ajouter arret_depart (nullable temporairement pour SQLite)
        migrations.AddField(
            model_name='tarif',
            name='arret_depart',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='tarifs_depart',
                to='transport.arretligne',
            ),
        ),

        # 3. Ajouter arret_arrivee (nullable temporairement)
        migrations.AddField(
            model_name='tarif',
            name='arret_arrivee',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='tarifs_arrivee',
                to='transport.arretligne',
            ),
        ),

        # 4. Rendre arret_depart non-nullable (Django recrée la table SQLite — OK car aucune donnée)
        migrations.AlterField(
            model_name='tarif',
            name='arret_depart',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='tarifs_depart',
                to='transport.arretligne',
            ),
        ),

        # 5. Rendre arret_arrivee non-nullable
        migrations.AlterField(
            model_name='tarif',
            name='arret_arrivee',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='tarifs_arrivee',
                to='transport.arretligne',
            ),
        ),

        # 6. Nouvelle contrainte unique par segment
        migrations.AddConstraint(
            model_name='tarif',
            constraint=models.UniqueConstraint(
                fields=['compagnie', 'ligne', 'arret_depart', 'arret_arrivee', 'type_bus'],
                name='uniq_tarif_segment',
            ),
        ),
    ]
