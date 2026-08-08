import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('transport', '0002_tarif_par_segment'),
        ('accounts', '0003_profilemploye_telephone'),
    ]

    operations = [
        migrations.AddField(
            model_name='trajet',
            name='controleur',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='trajets_assignes',
                to='accounts.profilemploye',
            ),
        ),
    ]
